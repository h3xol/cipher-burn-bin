# SecurePaste (PostgreSQL only)

A zero-knowledge paste/file sharer. Content is encrypted in the browser (AES-GCM + HMAC with PBKDF2 for optional passwords), stored via a lightweight Node/Express API backed by PostgreSQL, and decrypted only by people who have the URL (the URL fragment holds the key).

## Features
- Client-side encryption: AES-GCM with integrity checks; optional password protection using PBKDF2 salt + iterations per paste.
- Text and files: up to 500k characters of text or 15MB files; burn-after-read and expirations.
- File storage offloaded to disk (uploads volume) with metadata in Postgres.
- Theming + UX: drag-and-drop uploads, copy/share link with key warning, dark/light toggle.

## Tech Stack
- Frontend: React 18, TypeScript, Vite, Tailwind/shadcn/ui, React Router.
- Backend: Node/Express API (`postgres-api`), PostgreSQL (schema + cron-ish cleanup), pgAdmin optional.
- Build/Run: Docker Compose for full stack; npm for local dev.

## Quick Start (Docker)
1) Copy `.env.example` to `.env` (only `VITE_POSTGRES_API_URL` matters for the web build).
2) `docker-compose up --build`
3) Services:
   - Web: http://localhost:4173
   - API: http://localhost:3001/api
   - Postgres: localhost:5432
   - pgAdmin (optional): http://localhost:5050 (login `admin@local.dev` / `admin1234`)
4) Volumes: `db-data` (database), `uploads` (encrypted files), `pgadmin-data` (pgAdmin). Schema seeds from `postgres-api/schema.init.sql`.

## Local Development (without Docker)
1) Install deps: `npm install`
2) Start Postgres and create DB/user:
   ```sql
   CREATE DATABASE securepaste;
   CREATE USER securepaste_user WITH PASSWORD 'securepaste_password';
   GRANT ALL PRIVILEGES ON DATABASE securepaste TO securepaste_user;
   ```
3) Seed schema: `psql -U securepaste_user -d securepaste -f postgres-api/schema.sql`
4) API:
   ```bash
   cd postgres-api
   cp .env.example .env  # set DB creds/ports if different
   npm install
   npm run dev
   ```
5) Frontend:
   ```bash
   cd ..
   cp .env.example .env      # ensure VITE_POSTGRES_API_URL matches your API
   npm run dev
   ```

## Security Notes
- Keys stay client-side: the URL fragment contains the encryption key; we do not store it. Anyone with the link can decrypt—share carefully.
- Passwords: PBKDF2 with per-paste salt + iterations, stored alongside the paste metadata for verification.
- Integrity: HMAC (HKDF-derived) over IV+ciphertext to detect tampering.
- Cleanup: API runs periodic cleanup for expired/burned pastes and their files; manual trigger at `POST /api/cleanup`.

## File & Text Limits
- Text: 500k characters max.
- Files: 15MB max; encrypted client-side, stored in `uploads/encrypted-files`.

## Scripts
- `npm run dev` – Vite dev server
- `npm run build` – production build (requires `VITE_POSTGRES_API_URL`)
- `npm run preview` – preview built site
- `npm run lint` – lint sources

## Environment
- `.env` (root): `VITE_POSTGRES_API_URL` (e.g., `http://localhost:3001/api`) and `VITE_DATABASE_PROVIDER=postgres` (default).
- `postgres-api/.env`: DB connection, port, optional `CLEANUP_INTERVAL_MS`.

## Cleanup / Reset
- To wipe data: stop Docker, remove volumes `db-data` and `uploads`, then `docker-compose up --build`.

## License
MIT
