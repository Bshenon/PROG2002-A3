# Live MySQL checks (required before calling your backend finished)

Automated tests use a simulated database, so they do not prove SQL import or real foreign-key behaviour.

1. Import final SQL into a new local database. Verify four tables and ten registrations.
2. GET /api/health: 200.
3. GET /api/events/1: registration list newest first, original event fields retained, no contact details.
4. GET /api/admin/events: includes suspended event 8 and old event 7.
5. POST valid registration to event 1 using a new email: 201; query MySQL to verify persistence.
6. Repeat same email/event: 409, count unchanged. Same email/event 2: 201.
7. Zero/fractional tickets, bad email or invalid event ID: 400.
8. Suspended/past/missing event registration: 409, no row inserted.
9. POST sample event from README: 201. Record returned ID. PUT to change its name: 200; GET to verify.
10. DELETE new event with no registrations: 200; GET returns 404.
11. DELETE event 1 with seed registrations: 409; event and registrations remain.
12. Invalid organisation/category on event creation: 400.
13. Admin event detail includes associated registration contacts; public response does not.
14. Repeat complete registration/create/edit/delete flows using integrated frontend and deployed cPanel.
    Record actual result and screenshot for each. Clean up temporary test rows and export final schema/data for submission after integration.
