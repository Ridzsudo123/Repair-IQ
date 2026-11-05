# RepairIQ – Deliverable Guide

This package focuses on the three requested deliverables: ER diagram, threat model and backend.

## 1. ER diagram
Open `ER_DIAGRAM.md`. It contains Mermaid ER notation for the relational model. The matching SQL implementation is in `../database/schema.sql`.

## 2. Threat model
Open `THREAT_MODEL.md`. It documents assets, trust boundaries, STRIDE threats, mitigations and initial risk ratings.

## 3. Backend
The Node.js/Express source is in `../src/`. Database tables and indexes are in `../database/schema.sql`. Setup and endpoint instructions are in `../README.md`.

## Before submission
- Run the SQL script in SQL Server / Azure Data Studio.
- Copy `.env.example` to `.env` and configure your own database credentials.
- Run `npm install`, then `npm start`.
- Test endpoints using Postman or Thunder Client.
- Capture screenshots of health check, registration, login, device creation and issue reporting.
- Never upload `.env`, passwords, JWT tokens or personal data.
- Clearly label Azure Blob Storage and frontend integration as planned if they have not actually been implemented.
