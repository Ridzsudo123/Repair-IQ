# RepairIQ Backend – Submission Starter

A Node.js + Express REST API using Microsoft SQL Server / Azure SQL Database.

## Requirements
- Node.js 18 or newer
- SQL Server or Azure SQL Database
- A database login with permission to create/use the RepairIQ schema

## Setup
1. Open a terminal in this folder.
2. Run `npm install`.
3. Create the database by running `database/schema.sql` in SQL Server Management Studio or Azure Data Studio.
4. Copy `.env.example` to `.env` and enter your database details.
5. Set `JWT_SECRET` to a long random value. Never upload `.env` to your submission repository.
6. Run `npm run dev` (or `npm start`).
7. Test `GET http://localhost:5000/api/health`.

## Main API endpoints

| Method | Endpoint | Purpose | Login |
|---|---|---|---|
| GET | `/api/health` | API health check | No |
| POST | `/api/auth/register` | Create customer account | No |
| POST | `/api/auth/login` | Login and receive JWT | No |
| GET/POST | `/api/devices` | List/add own devices | Yes |
| GET/POST | `/api/issues` | List/report issues for own devices | Yes |
| GET | `/api/providers` | List active repair providers | Yes |
| GET | `/api/issues/:issueId/estimates` | Compare estimates for own issue | Yes |
| POST | `/api/estimates` | Add estimate (staff/admin only) | Staff/Admin |
| GET/POST | `/api/repairs` | View/add own repair history | Yes |

For protected endpoints, send header: `Authorization: Bearer YOUR_TOKEN`.

## Example requests

Register:
```json
{ "name": "Demo User", "email": "demo@example.com", "password": "DemoPass123" }
```

Login:
```json
{ "email": "demo@example.com", "password": "DemoPass123" }
```

Add a device:
```json
{ "deviceType": "Mobile", "brand": "Samsung", "model": "Galaxy A54", "serialNumber": "DEMO-SERIAL" }
```

Report an issue:
```json
{ "deviceId": 1, "description": "Phone battery drains quickly", "symptoms": "Battery percentage drops fast", "severity": "medium" }
```

## Important project notes
- This is a runnable starter backend, not a fully deployed production system.
- Public registration deliberately creates only `customer` accounts. Do not add a public role field.
- To test staff-only routes, create a staff account through a controlled database/admin process; never expose role changes to public users.
- Blob image upload, password reset, email verification, audit log and frontend integration are planned extensions.
- Keep credentials in environment variables and do not submit real passwords, tokens or personal data.
