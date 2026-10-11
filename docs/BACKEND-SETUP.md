# Aagaman's PROG2002 A3 backend handover

Prepared from the supplied A2 project. The client teammate uses the original A2 ZIP, completes registration UI and replaces hardcoded localhost URLs before deployment. Client files are excluded from this backend handover. Admin UI belongs to the other teammate. This package is not a complete A3 submission.

## Start on Windows (VS Code PowerShell)

1. Extract this ZIP into a NEW A3 folder; do not overwrite your A2 folder.
2. Open the extracted folder in VS Code.
3. Create a NEW MySQL database, `charityevents_a3`, and import `database/charityevents_a3.sql` into it. This import creates the four tables and sample data. Use an empty A3 database only. It deliberately contains no DROP statements; importing into a populated database will stop at the existing table instead of replacing it.
4. `cd api`
5. `Copy-Item db-details.example.js db-details.js`
6. Edit db-details.js with your LOCAL password. Do not commit or share it.
7. `npm ci`
8. `npm test`
9. `npm start`
10. Open http://localhost:3060/api/health and http://localhost:3060/api/events/1.

MySQL CMD alternative (type your password only at the password prompt):

```
cd /d "C:\Program Files\MySQL\MySQL Server 9.7\bin"
mysql -u root -p
```

Inside MySQL:

```
CREATE DATABASE charityevents_a3 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE charityevents_a3;
SOURCE C:/YOUR/EXTRACTED/FOLDER/database/charityevents_a3.sql;
SHOW TABLES;
SELECT COUNT(*) FROM registrations;
```

Replace SOURCE path with the actual extracted location; use forward slashes. Expect 4 tables and 10 registrations.

## Team integration contract

Base URL locally: http://localhost:3060/api. JSON request bodies, numeric quantities/prices/IDs. Responses use `message` for failures.

| Method | Path                                                     | Response/use                                          |
| ------ | -------------------------------------------------------- | ----------------------------------------------------- |
| GET    | /health                                                  | Database connectivity                                 |
| GET    | /events                                                  | Active, unsuspended, upcoming events; A2 array format |
| GET    | /events/search?date=YYYY-MM-DD&location=Perth&category=2 | Filtered array; all filters optional                  |
| GET    | /categories                                              | Category dropdown                                     |
| GET    | /organisations                                           | Organisation dropdown                                 |
| GET    | /events/:id                                              | A2 event object plus `registrations` array            |
| GET    | /admin/events                                            | All events including past and suspended               |
| GET    | /admin/events/:id                                        | Event plus full registrations for staff               |
| POST   | /events/:id/registrations                                | Create registration; 201 success                      |
| POST   | /events                                                  | Create event; 201 success                             |
| PUT    | /events/:id                                              | Full event update; 200 success                        |
| DELETE | /events/:id                                              | 200 success; 409 if registrations exist               |

Registration body:

```json
{
  "full_name": "Aagaman Subedi",
  "email": "aagaman@example.com",
  "phone": "0400000001",
  "ticket_quantity": 2
}
```

Registration date is generated on the server. Email is trimmed and lowercased; (event_id,email) is unique. Email identifies a registrant for this coursework because a user table is not required. Same email may register for different events. Public registration lists omit phone/email. Use `textContent` to render untrusted text in the frontend.

Event POST and PUT body (PUT requires all these fields):

```json
{
  "organisation_id": 1,
  "category_id": 2,
  "event_name": "New Charity Gala",
  "event_date": "2026-12-20",
  "event_time": "18:30",
  "location": "Perth Town Hall",
  "purpose": "Support education",
  "description": "Community fundraising evening",
  "ticket_price": 25,
  "fundraising_goal": 10000,
  "fundraising_progress": 0,
  "status": "Active"
}
```

Allowed statuses: Active, Past, Suspended. `suspended` is derived from status. Existing old Active events still appear in admin; homepage excludes past dates. Registration refuses non-active, suspended or already-started events. Registration inserts do not change existing fundraising_progress: it represents the supplied fundraiser totals, not a payment ledger. No real payment processing.

## Genuine Git milestones

Use the shared private A3 repository agreed by the team. Invite teammates and marker. Do not pretend these prepared files were developed over earlier dates. Review and understand each milestone, apply it, test it, then commit and push when actually completed.

- Baseline: original A2 source and ignore rules.
- Database: new table and ten seeds; verify import.
- Backend: pool, validation, routes and tests; verify npm test and live MySQL.
- Handover: API contract and test evidence.
  Work on `feature/aagaman-backend`, request teammate review, fix review findings, then merge. If another member already created the repository, clone it first and copy the agreed files into it; do not create a competing repository.

## Deployment and submission still required

Each member imports SQL into their own cPanel database, creates their own private db-details.js using the cPanel database/user names, installs dependencies and starts server.js using the supplied SCU Node tutorial. Server respects process.env.PORT. Frontends must use the deployed API base URL, not localhost. Do not share cPanel credentials. This unauthenticated admin API and open CORS follow the simplified coursework brief; not a production access-control system.

Keep screenshots/test results, Git commits and review feedback as genuine evidence. Each student records their own contribution and understanding (max 15 minutes), uploads to SCU OneDrive with a marker-accessible link, and sends confidential peer evaluation to the tutor. Submission includes client/admin/API ZIPs, final SQL schema+data, accessible private GitHub link, video link and required documentation. Confirm exact packaging in Blackboard.
