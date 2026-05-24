# SyncFlow AI — Setup & Integration Guide

## What was integrated

The project already had a complete Express + Mongoose backend written. The frontend was using entirely hardcoded mock data. This integration connects them:

- **Axios API client** (`src/lib/api.js`) — configured with JWT auth header injection and 401 redirect
- **Zustand auth store** (`src/store/authStore.js`) — login, register, logout with localStorage persistence
- **React Query hooks** (`src/hooks/useApi.js`) — typed hooks for all resources (vendors, products, orders, auth)
- **ProtectedRoute** (`src/components/ProtectedRoute.jsx`) — redirects unauthenticated users to `/login`
- **Vite proxy** (`vite.config.js`) — `/api` → `http://localhost:5000` so CORS is never an issue in dev
- **Login & Signup pages** — now call the real backend, show errors, loading states
- **Vendors, Orders, Products pages** — live data from MongoDB, with search/filter, status mutations, pagination
- **Dashboard** — stat cards pull real order analytics and vendor counts
- **Dashboard layout** — shows real user name/role, working Sign out button
- **Seed script** — populates demo data so you can log in immediately

---

## Prerequisites

- Node.js 18+
- MongoDB running locally (`mongod`) **or** a MongoDB Atlas connection string

---

## 1 — Start MongoDB

```bash
# Local
mongod

# Or update MONGODB_URI in server/.env to your Atlas connection string
```

## 2 — Install & seed backend

```bash
cd syncflow-ai/server
npm install
node seed.js        # creates demo user + sample data
```

Seed output confirms:
```
✅ Seed complete!
   Login: demo@syncflow.ai / password123
```

## 3 — Start backend

```bash
# Inside syncflow-ai/server/
npm run dev         # starts on http://localhost:5000
```

## 4 — Install & start frontend

```bash
# Inside syncflow-ai/
npm install
npm run dev         # starts on http://localhost:5173
```

Open http://localhost:5173 → click "Login" → use `demo@syncflow.ai` / `password123`.

---

## Project structure

```
syncflow-ai/
├── server/                  ← Express + Mongoose backend
│   ├── config/db.js         ← MongoDB connection
│   ├── middleware/auth.js   ← JWT protect + RBAC authorize
│   ├── models/              ← User, Vendor, Product, Order schemas
│   ├── routes/              ← auth, vendors, products, orders
│   ├── seed.js              ← demo data seeder  ← NEW
│   ├── .env                 ← env vars
│   └── index.js             ← entry point
│
└── src/                     ← React + Vite frontend
    ├── lib/api.js            ← axios client  ← NEW
    ├── store/authStore.js    ← Zustand auth  ← NEW
    ├── hooks/useApi.js       ← React Query hooks  ← NEW
    ├── components/
    │   └── ProtectedRoute.jsx  ← NEW
    ├── features/
    │   ├── auth/            ← LoginPage, SignupPage (now real API)
    │   ├── dashboard/       ← DashboardLayout (real user), DashboardPage (real stats)
    │   ├── vendors/         ← VendorsPage (live data, approve/suspend)
    │   ├── orders/          ← OrdersPage (live data, status update)
    │   └── products/        ← ProductsPage (live data, delete)
    └── app/App.jsx          ← ProtectedRoute wrapping dashboard
```

---

## API endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register |
| POST | /api/auth/login | Login |
| POST | /api/auth/logout | Logout |
| GET  | /api/auth/me | Current user |
| GET  | /api/vendors | List vendors (paginated, filterable) |
| POST | /api/vendors | Create vendor |
| PATCH | /api/vendors/:id/status | Approve / suspend |
| GET  | /api/products | List products |
| DELETE | /api/products/:id | Delete product |
| GET  | /api/products/sync/status | Sync counts |
| GET  | /api/orders | List orders (paginated) |
| PATCH | /api/orders/:id/status | Update status |
| GET  | /api/orders/analytics/summary | Revenue + status breakdown |

---

## Environment variables (`server/.env`)

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/syncflow-ai
JWT_SECRET=change-this-in-production
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development
```

For production: update `MONGODB_URI` to Atlas, set a strong `JWT_SECRET`, and set `NODE_ENV=production`.
