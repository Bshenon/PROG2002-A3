# Backend test results — Aagaman Subedi

Tested on 10 October 2026 using local Node.js/Express and MySQL.

| Test | Actual result |
|---|---|
| Automated tests | 15 passed, 0 failed |
| Database import | 4 tables, 8 events, 10 registrations |
| Event registration | Success |
| Duplicate email for same event | HTTP 409 |
| Same email for another event | Success |
| Delete event with registrations | HTTP 409 |
| Create temporary event | Event 9 created |
| Update event | Updated name confirmed through GET |
| Delete temporary event | Success |
| Retrieve deleted event | HTTP 404 |
| Test data cleanup | Two test registrations removed |
| Final database counts | 8 events, 10 registrations |
| Credentials protection | api/db-details.js ignored by Git |

Automated tests use simulated database responses.
The manual registration and CRUD checks used real local MySQL.
Frontend integration and cPanel deployment remain pending.
