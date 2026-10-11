const express = require("express");
const cors = require("cors");
const v = require("./validation");
const fields = [
  "organisation_id",
  "category_id",
  "event_name",
  "event_date",
  "event_time",
  "location",
  "purpose",
  "description",
  "ticket_price",
  "fundraising_goal",
  "fundraising_progress",
  "status",
  "suspended",
];
const select = `SELECT e.*, c.category_name, o.organisation_name FROM events e JOIN categories c ON e.category_id=c.category_id JOIN organisations o ON e.organisation_id=o.organisation_id`;
function createApp(pool) {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "32kb" }));
  const validId = (req, res, next) =>
    v.positiveId(req.params.id)
      ? next()
      : res.status(400).json({ message: "Invalid event ID." });
  app.get("/api/health", async (req, res) => {
    await pool.query("SELECT 1");
    res.json({ status: "ok" });
  });
  app.get("/api/categories", async (req, res) => {
    const [rows] = await pool.query(
      "SELECT * FROM categories ORDER BY category_name",
    );
    res.json(rows);
  });
  app.get("/api/organisations", async (req, res) => {
    const [rows] = await pool.query(
      "SELECT * FROM organisations ORDER BY organisation_name",
    );
    res.json(rows);
  });
  app.get("/api/events", async (req, res) => {
    const [rows] = await pool.query(
      select +
        " WHERE e.status='Active' AND e.suspended=0 AND e.event_date>=CURDATE() ORDER BY e.event_date,e.event_time",
    );
    res.json(rows);
  });
  app.get("/api/events/search", async (req, res) => {
    let sql = select + " WHERE e.status='Active' AND e.suspended=0";
    const values = [];
    if (req.query.date) {
      if (!v.date(req.query.date))
        return res.status(400).json({ message: "Invalid search date." });
      sql += " AND e.event_date=?";
      values.push(req.query.date);
    }
    if (req.query.location) {
      if (!v.text(req.query.location, 150))
        return res.status(400).json({ message: "Invalid search location." });
      sql += " AND e.location LIKE ?";
      values.push("%" + req.query.location.trim() + "%");
    }
    if (req.query.category) {
      if (!v.positiveId(req.query.category))
        return res.status(400).json({ message: "Invalid category." });
      sql += " AND e.category_id=?";
      values.push(req.query.category);
    }
    const [rows] = await pool.query(
      sql + " ORDER BY e.event_date,e.event_time",
      values,
    );
    res.json(rows);
  });
  app.get("/api/admin/events", async (req, res) => {
    const [rows] = await pool.query(
      select + " ORDER BY e.event_date DESC,e.event_id DESC",
    );
    res.json(rows);
  });
  async function details(req, res, admin) {
    const [rows] = await pool.query(
      select + " WHERE e.event_id=?" + (admin ? "" : " AND e.suspended=0"),
      [req.params.id],
    );
    if (!rows.length)
      return res.status(404).json({ message: "Event not found." });
    const columns = admin
      ? "*"
      : "registration_id,event_id,full_name,registered_at,ticket_quantity";
    const [registrations] = await pool.query(
      "SELECT " +
        columns +
        " FROM registrations WHERE event_id=? ORDER BY registered_at DESC,registration_id DESC",
      [req.params.id],
    );
    res.json({ ...rows[0], registrations });
  }
  app.get("/api/events/:id", validId, (req, res) => details(req, res, false));
  app.get("/api/admin/events/:id", validId, (req, res) =>
    details(req, res, true),
  );
  app.post("/api/events/:id/registrations", validId, async (req, res) => {
    const b = req.body || {};
    const error = v.registration(b);
    if (error) return res.status(400).json({ message: error });
    const db = await pool.getConnection();
    try {
      await db.beginTransaction();
      const [rows] = await db.query(
        "SELECT event_id FROM events WHERE event_id=? AND status='Active' AND suspended=0 AND TIMESTAMP(event_date,event_time)>NOW() FOR UPDATE",
        [req.params.id],
      );
      if (!rows.length) {
        await db.rollback();
        return res
          .status(409)
          .json({ message: "Event is unavailable or has already started." });
      }
      const [result] = await db.query(
        "INSERT INTO registrations (event_id,full_name,email,phone,ticket_quantity) VALUES (?,?,?,?,?)",
        [
          req.params.id,
          b.full_name.trim(),
          b.email.trim().toLowerCase(),
          b.phone.trim(),
          b.ticket_quantity,
        ],
      );
      await db.commit();
      res.status(201).json({
        message: "Registration successful.",
        registration_id: result.insertId,
        event_id: Number(req.params.id),
        ticket_quantity: b.ticket_quantity,
      });
    } catch (error) {
      await db.rollback();
      throw error;
    } finally {
      db.release();
    }
  });
  async function save(req, res, update) {
    const b = req.body || {};
    const error = v.event(b);
    if (error) return res.status(400).json({ message: error });
    const values = fields.map((key) =>
      key === "suspended"
        ? b.status === "Suspended"
          ? 1
          : 0
        : typeof b[key] === "string"
          ? b[key].trim()
          : (b[key] ?? null),
    );
    const [result] = await pool.query(
      update
        ? "UPDATE events SET " +
            fields.map((f) => f + "=?").join(",") +
            " WHERE event_id=?"
        : "INSERT INTO events (" +
            fields.join(",") +
            ") VALUES (" +
            fields.map(() => "?").join(",") +
            ")",
      update ? [...values, req.params.id] : values,
    );
    if (update && !result.affectedRows)
      return res.status(404).json({ message: "Event not found." });
    res.status(update ? 200 : 201).json({
      message: update ? "Event updated." : "Event created.",
      event_id: update ? Number(req.params.id) : result.insertId,
    });
  }
  app.post("/api/events", (req, res) => save(req, res, false));
  app.put("/api/events/:id", validId, (req, res) => save(req, res, true));
  app.delete("/api/events/:id", validId, async (req, res) => {
    const [result] = await pool.query("DELETE FROM events WHERE event_id=?", [
      req.params.id,
    ]);
    if (!result.affectedRows)
      return res.status(404).json({ message: "Event not found." });
    res.json({ message: "Event deleted." });
  });
  app.use((req, res) =>
    res.status(404).json({ message: "API endpoint not found." }),
  );
  app.use((error, req, res, next) => {
    if (error.code === "ER_DUP_ENTRY")
      return res
        .status(409)
        .json({ message: "This email is already registered for this event." });
    if (error.code === "ER_ROW_IS_REFERENCED_2")
      return res
        .status(409)
        .json({ message: "Cannot delete an event with registrations." });
    if (error.code === "ER_NO_REFERENCED_ROW_2")
      return res
        .status(400)
        .json({ message: "Organisation, category or event does not exist." });
    if (error.type === "entity.parse.failed")
      return res.status(400).json({ message: "Invalid JSON body." });
    if (error.type === "entity.too.large")
      return res.status(413).json({ message: "Request body is too large." });
    console.error("API error:", error.code || error.message);
    res.status(500).json({
      message: "Database request failed. Check server configuration.",
    });
  });
  return app;
}
module.exports = { createApp };
