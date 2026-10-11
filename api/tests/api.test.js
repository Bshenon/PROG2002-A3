const { test } = require("node:test");
const assert = require("node:assert/strict");
const { createApp } = require("../app");
const v = require("../validation");
async function request(t, pool, path, method = "GET", body) {
  const server = createApp(pool).listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  t.after(
    () =>
      new Promise((r) => {
        server.close(r);
        server.closeAllConnections();
      }),
  );
  const response = await fetch(
    "http://127.0.0.1:" + server.address().port + path,
    {
      method,
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    },
  );
  return { status: response.status, data: await response.json() };
}
const guest = {
  full_name: "Guest",
  email: "guest@example.com",
  phone: "0400000001",
  ticket_quantity: 2,
};
test("calendar and numeric identifiers reject malformed values", () => {
  assert.equal(v.date("2026-02-30"), false);
  assert.equal(v.positiveId("1 OR 1=1"), false);
  assert.equal(v.positiveId("1"), true);
});
test("registration rejects fractional and zero tickets", () => {
  assert.ok(v.registration({ ...guest, ticket_quantity: 1.5 }));
  assert.ok(v.registration({ ...guest, ticket_quantity: 0 }));
  assert.equal(v.registration(guest), null);
});
test("invalid ID returns 400 before database access", async (t) =>
  assert.equal((await request(t, {}, "/api/events/no")).status, 400));
test("missing event returns 404", async (t) =>
  assert.equal(
    (await request(t, { query: async () => [[]] }, "/api/events/999")).status,
    404,
  ));
test("details preserve A2 fields and add newest-first public registrations", async (t) => {
  let n = 0;
  const result = await request(
    t,
    {
      query: async (sql) => {
        if (n++ === 0) return [[{ event_id: 1, event_name: "Gala" }]];
        assert.match(sql, /ORDER BY registered_at DESC,registration_id DESC/);
        assert.doesNotMatch(sql, /SELECT \*/);
        return [[{ full_name: "Guest" }]];
      },
    },
    "/api/events/1",
  );
  assert.equal(result.data.event_name, "Gala");
  assert.equal(result.data.registrations.length, 1);
});
test("admin list has no active-only filter", async (t) => {
  const result = await request(
    t,
    {
      query: async (sql) => {
        assert.doesNotMatch(sql, /WHERE/);
        return [[{ status: "Suspended" }]];
      },
    },
    "/api/admin/events",
  );
  assert.equal(result.data[0].status, "Suspended");
});
test("search uses placeholders for user input", async (t) => {
  const result = await request(
    t,
    {
      query: async (sql, values) => {
        assert.match(sql, /LIKE \?/);
        assert.equal(values[0], "%O'Reilly%");
        return [[]];
      },
    },
    "/api/events/search?location=O%27Reilly",
  );
  assert.equal(result.status, 200);
});
test("registered event deletion returns conflict", async (t) => {
  const result = await request(
    t,
    {
      query: async () => {
        throw { code: "ER_ROW_IS_REFERENCED_2" };
      },
    },
    "/api/events/1",
    "DELETE",
  );
  assert.equal(result.status, 409);
});
test("empty event deletion succeeds", async (t) =>
  assert.equal(
    (
      await request(
        t,
        { query: async () => [{ affectedRows: 1 }] },
        "/api/events/8",
        "DELETE",
      )
    ).status,
    200,
  ));
test("registration normalises email and commits locked transaction", async (t) => {
  let committed = false,
    released = false;
  const db = {
    beginTransaction: async () => {},
    commit: async () => {
      committed = true;
    },
    rollback: async () => {},
    release: () => {
      released = true;
    },
    query: async (sql, args) => {
      if (sql.startsWith("SELECT")) {
        assert.match(sql, /FOR UPDATE/);
        return [[{ event_id: 1 }]];
      }
      assert.equal(args[2], "guest@example.com");
      return [{ insertId: 11 }];
    },
  };
  const result = await request(
    t,
    { getConnection: async () => db },
    "/api/events/1/registrations",
    "POST",
    { ...guest, email: "GUEST@example.com" },
  );
  assert.equal(result.status, 201);
  assert.ok(committed && released);
});
test("duplicate registration rolls back and returns conflict", async (t) => {
  let rollback = false;
  const db = {
    beginTransaction: async () => {},
    rollback: async () => {
      rollback = true;
    },
    release: () => {},
    query: async (sql) => {
      if (sql.startsWith("SELECT")) return [[{ event_id: 1 }]];
      throw { code: "ER_DUP_ENTRY" };
    },
  };
  assert.equal(
    (
      await request(
        t,
        { getConnection: async () => db },
        "/api/events/1/registrations",
        "POST",
        guest,
      )
    ).status,
    409,
  );
  assert.ok(rollback);
});
test("unavailable event registration is refused", async (t) => {
  const db = {
    beginTransaction: async () => {},
    rollback: async () => {},
    release: () => {},
    query: async () => [[]],
  };
  assert.equal(
    (
      await request(
        t,
        { getConnection: async () => db },
        "/api/events/8/registrations",
        "POST",
        guest,
      )
    ).status,
    409,
  );
});
const event = {
  organisation_id: 1,
  category_id: 2,
  event_name: "Gala",
  event_date: "2026-12-20",
  event_time: "18:30",
  location: "Perth",
  purpose: "Education",
  description: "Community evening",
  ticket_price: 25,
  fundraising_goal: 1000,
  fundraising_progress: 0,
  status: "Active",
};
test("event creation validates body and parameterises insert", async (t) => {
  const result = await request(
    t,
    {
      query: async (sql, values) => {
        assert.match(sql, /INSERT INTO events/);
        assert.equal(values[2], "Gala");
        assert.equal(values[12], 0);
        return [{ insertId: 9 }];
      },
    },
    "/api/events",
    "POST",
    event,
  );
  assert.equal(result.status, 201);
  assert.equal(result.data.event_id, 9);
});
test("event update derives suspended flag from status", async (t) => {
  const result = await request(
    t,
    {
      query: async (sql, values) => {
        assert.match(sql, /UPDATE events/);
        assert.equal(values[12], 1);
        assert.equal(values[13], "8");
        return [{ affectedRows: 1 }];
      },
    },
    "/api/events/8",
    "PUT",
    { ...event, status: "Suspended" },
  );
  assert.equal(result.status, 200);
});
test("invalid event price rejected before database access", async (t) =>
  assert.equal(
    (
      await request(t, {}, "/api/events", "POST", {
        ...event,
        ticket_price: -1,
      })
    ).status,
    400,
  ));
