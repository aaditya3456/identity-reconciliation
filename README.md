# Bitespeed Identity Reconciliation (Backend)

Production-ready backend for the **Bitespeed Identity Reconciliation** assignment using:

- Node.js
- TypeScript
- Express
- MySQL
- Prisma ORM

## Folder structure

```
identity_Reco/
  prisma/
    schema.prisma
    migrations/
  src/
    controllers/
    middleware/
    prisma/
    routes/
    services/
    app.ts
    server.ts
  package.json
  tsconfig.json
  .env
  .env.example
```

## Prerequisites

- Node.js 18+ (recommended)
- MySQL 8+

## Environment variables

Root `.env` is required.

Example:

```
DATABASE_URL="mysql://USER:PASSWORD@localhost:3306/bitespeed_identity"
PORT=3000
NODE_ENV=development
```

Create the database in MySQL before running migrations:

```sql
CREATE DATABASE bitespeed_identity;
```

## Install & run

```bash
npm install
```

Run migration + generate Prisma client:

```bash
npm run prisma:migrate
```

Start dev server:

```bash
npm run dev
```

Build and start (production):

```bash
npm run build
npm start
```

Health check:

- `GET /health`

## API

### POST `/identify`

Request body:

```json
{
  "email": "string | null",
  "phoneNumber": "string | null"
}
```

Either `email` or `phoneNumber` will always be present.

Response format:

```json
{
  "contact": {
    "primaryContactId": 0,
    "emails": ["string"],
    "phoneNumbers": ["string"],
    "secondaryContactIds": [0]
  }
}
```

### Quick test (PowerShell)

```powershell
Invoke-RestMethod -Method Post -Uri "http://localhost:3000/identify" `
  -ContentType "application/json" `
  -Body '{"email":"a@b.com","phoneNumber":"123"}'
```

## Notes

- Business logic lives in `src/services/contactService.ts`.
- Controller is intentionally thin (`src/controllers/contactController.ts`).
- Prisma schema is in `prisma/schema.prisma`.

