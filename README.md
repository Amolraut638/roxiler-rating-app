# Roxiler Store Rating Platform

A full-stack store rating application with role-based access control. Users browse and rate stores, Store Owners monitor their store performance, and System Administrators manage the entire platform.

**Live Demo:** https://roxiler-rating-app.vercel.app
> ⚠️ Replace this URL with the actual deployed URL after deployment.

---

## Roles

| Role | Capabilities |
|------|--------------|
| **System Administrator** | Manage users and stores, view dashboard statistics |
| **Normal User** | Browse stores, search by name/address, submit and modify ratings (1–5) |
| **Store Owner** | View owned stores, average ratings, rating counts, and individual rater details |

---

## Features

- Role-based access control with JWT authentication
- Admin dashboard with total users, stores, and ratings statistics
- Admin user management (create, list, view details) with search, filtering, sorting, pagination
- Admin store management (create, list) with search, filtering, sorting, pagination
- Normal user store browsing with name/address search, sorting, and pagination
- Rating submission (1–5 stars) and rating modification per store
- Store owner dashboard with average ratings and individual rater information
- Password update for all roles
- Form validation matching backend rules exactly
- Responsive React UI (desktop, tablet, mobile)

---

## Tech Stack

**Frontend**
- React 18
- Vite
- Tailwind CSS
- Axios
- React Router v6
- lucide-react

**Backend**
- Node.js ≥ 18 (ES Modules)
- Express.js
- Prisma ORM
- PostgreSQL (Neon)
- JSON Web Tokens (JWT)
- bcryptjs

---

## Project Structure

```
roxiler-rating-app/
├── client/        # React + Vite frontend
├── server/        # Node.js + Express backend
└── README.md
```

---

## Local Setup

### Backend

```bash
cd server
npm install
cp .env.example .env
# Fill in DATABASE_URL and JWT_SECRET in .env
npx prisma generate
npx prisma migrate deploy
node scripts/create-admin.js   # create the first System Administrator (see below)
npm run dev
# API: http://localhost:5000
# Health: http://localhost:5000/api/health
```

### Frontend

```bash
cd client
npm install
# Create client/.env.local (for local dev only):
# VITE_API_URL=http://localhost:5000/api
npm run dev
# App: http://localhost:3000
```

> In local development the Vite proxy forwards `/api` requests to `http://localhost:5000`, so `VITE_API_URL` is only required when targeting a different backend (e.g. the deployed Vercel API).

---

### First Admin Setup

Public signup creates only `USER` accounts. To create the first `ADMIN` account on a fresh database:

1. Configure `server/.env` with your PostgreSQL `DATABASE_URL`.
2. Run the Prisma migrations.
3. Run:

```bash
cd server
node scripts/create-admin.js
```

Enter the administrator name, email, address, and password when prompted. The password is hashed with bcrypt before being stored — it is never saved in plaintext or printed to the terminal.

After the script completes, start the backend and log in through the application with the credentials you just entered. Use the Admin dashboard to create Normal Users, Store Owners, and Stores.

---

## API

The backend exposes REST APIs for authentication, administration, store browsing, ratings, and the store-owner dashboard.

For the complete API reference (15 endpoints, request/response shapes, error codes, validation rules):

**→ [`server/README.md`](server/README.md)**

---

## Environment Variables

### Backend (`server/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string (Neon) |
| `JWT_SECRET` | ✅ | Secret for signing JWTs (≥ 32 chars recommended) |
| `PORT` | No | HTTP port (default: `5000`) |
| `JWT_EXPIRES_IN` | No | Token lifetime, e.g. `1d` (default: `1d`) |
| `CLIENT_ORIGIN` | No | Allowed CORS origin (default: `*`) |

### Frontend (`client/.env.local`)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Full base URL of the backend API, e.g. `https://your-api.vercel.app/api` |

> **Never commit `.env` files or production secrets to version control.**

---

## Deployment

The project is configured for Vercel deployment:

- **Frontend** — Vite SPA deployed to Vercel with `vercel.json` for React Router SPA routing.
- **Backend** — Express API deployed to Vercel as a serverless function via `vercel.json`.

Placeholder live URL: https://roxiler-rating-app.vercel.app
> Replace with your actual deployed URLs after deployment.

### Deployment steps

1. Deploy the **backend** (`server/`) to Vercel first. Note the deployment URL.
2. Set `VITE_API_URL=https://<your-backend>.vercel.app/api` in the **frontend** Vercel project environment variables.
3. Set `CLIENT_ORIGIN=https://<your-frontend>.vercel.app` in the **backend** Vercel project environment variables.
4. Deploy the **frontend** (`client/`) to Vercel.
