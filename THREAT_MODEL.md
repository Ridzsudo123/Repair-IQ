# RepairIQ – Threat Model

## 1. System and assets
RepairIQ contains a web/mobile frontend, an Express REST API, Azure SQL Database and (planned) Azure Blob Storage. Important assets are user identity data, password hashes, device/serial details, issue descriptions, repair estimates, repair history, uploaded device photos and database credentials.

## 2. Trust boundaries and data flow
1. User -> HTTPS -> frontend/API.
2. API -> authenticated database connection -> Azure SQL.
3. API -> authenticated storage access -> Azure Blob Storage (future upload feature).
4. Staff/admin -> privileged API operations.

## 3. STRIDE threat analysis

| Threat category | Example risk | Mitigation |
|---|---|---|
| Spoofing | Someone signs in using another user's account | Password hashing with bcrypt, short-lived JWT, HTTPS, login rate limiting and secure token handling |
| Tampering | A user changes another user's device or repair record | Parameterized SQL, server-side ownership checks, input validation and database constraints |
| Repudiation | A user denies making a repair-status change | Add audit log table with actor, action, timestamp and record ID; restrict log updates |
| Information disclosure | Personal/device data is exposed | Role-based access, least privilege, HTTPS, encrypted database/storage, safe error messages |
| Denial of service | Repeated requests overload the API | Rate limiting, request-size limits, monitoring and Azure scaling controls |
| Elevation of privilege | Customer changes their role to admin | Role is assigned server-side; public registration always creates customer role; privileged routes check roles |

## 4. Security controls implemented in this starter backend
- bcrypt password hashing (12 salt rounds).
- JWT authentication with a two-hour expiry.
- Role-check middleware for staff/admin-only estimate creation.
- Parameterized SQL queries to reduce SQL injection risk.
- Ownership checks before accessing a user's devices/issues/repair history.
- Helmet security headers, JSON body-size limit and API rate limiting.
- Generic client error messages so SQL/internal details are not disclosed.

## 5. Additional controls recommended before production
- Enforce HTTPS and restrict CORS to the real frontend domain.
- Store secrets in Azure Key Vault; never commit `.env`.
- Use Azure SQL encryption, private networking/firewall rules and least-privilege DB users.
- Add email verification, password reset and stronger login-abuse monitoring.
- Add audit logging for account, estimate and repair-status changes.
- Validate uploaded files by size/type and scan them; use private Blob containers and short-lived SAS URLs.
- Configure backups, restore tests, monitoring and alerting.
- Conduct dependency scanning and security testing before public deployment.

## 6. Risk rating (initial assessment)
| Risk | Likelihood | Impact | Priority |
|---|---|---|---|
| Account takeover | Medium | High | High |
| Cross-user data access | Medium | High | High |
| SQL injection | Low with parameterized queries | High | Medium |
| API abuse / service outage | Medium | Medium | Medium |
| Exposure of storage credentials | Medium | High | High |

This is a student-project threat model, not a formal security certification. Reassess it after the final architecture and deployment are known.
