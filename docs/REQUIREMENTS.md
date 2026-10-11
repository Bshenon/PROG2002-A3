# Backend requirements and design decisions

| Brief requirement                                  | Implementation                                          | Verification still needed                          |
| -------------------------------------------------- | ------------------------------------------------------- | -------------------------------------------------- |
| Related registration table, primary/foreign keys   | registrations linked to events                          | Import SQL in MySQL                                |
| Registrant details, contact, date and tickets      | full_name, email, phone, registered_at, ticket_quantity | Inspect inserted record                            |
| One person once per event, multiple events allowed | Normalised email + UNIQUE(event_id,email)               | Same-event refusal and different-event success     |
| At least 10 initial registrations                  | Ten fictional seed records on events 1 and 2            | SELECT COUNT(*)                                    |
| Updated event_db.js                                | mysql2 promise connection pool                          | Real connection health check                       |
| Event details with registrations newest first      | GET /api/events/:id                                     | Compare timestamps on website                      |
| Create, update, delete event APIs                  | POST, PUT, DELETE /api/events                           | Live CRUD checks                                   |
| Block deletion when registrations exist            | Foreign key ON DELETE RESTRICT + HTTP 409               | Live deletion refusal                              |
| Registration form saves through an API             | POST /api/events/:id/registrations                      | Teammate connects form                             |
| Admin includes every event status                  | GET /api/admin/events and /api/admin/events/:id         | Teammate connects dashboard                        |
| Single final schema/data SQL export                | database/charityevents_a3.sql                           | Fresh import and final re-export after integration |

The brief does not require a user table. Email is the documented coursework identity; this cannot establish real-world identity without authentication. The brief exempts admin authentication. No category editing is included because Part 2 makes category manipulation endpoints optional. Both clients still need their own UI implementation.

The SQL is organised organisations -> categories -> events -> registrations. Parent records exist before children; no disabled foreign keys, table locks, version-specific executable comments, server-level settings or destructive DROP commands are used. Import once into an empty A3 database. Existing A2 data is preserved, with the old event 7 labelled Past to demonstrate all three statuses explicitly.

The API uses placeholders, validates request bodies, limits JSON size, returns consistent errors and does not expose database errors to the browser. Public registration responses omit email and phone. Registration and deletion are coordinated by the parent-row lock and restrictive foreign key. Dates use the database server clock; configure the deployed database/session timezone to match the event timezone before checking event-start cutoffs.

Automated tests simulate database responses. They verify API behaviour and generated queries, not real SQL execution or deployment. Complete LIVE-TEST-CHECKLIST.md and record actual results before marking this part finished.
