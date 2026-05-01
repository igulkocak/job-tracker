# JobTrackr — Fullstack Job Application Tracker

## Stack
- **Frontend**: React 18 + Vite + CSS Modules
- **Backend**: Node.js + Express
- **Database**: MongoDB + Mongoose
- **Auth**: JWT (stored in localStorage)

---

## Quick Start

### 1. Clone & install

```bash
# Backend
cd server
npm install
cp .env.example .env    # edit MONGO_URI and JWT_SECRET

# Frontend
cd ../client
npm install
```

### 2. Run (development)

```bash
# Terminal 1 — API
cd server && npm run dev

# Terminal 2 — React
cd client && npm run dev
```

- API: http://localhost:5000
- App: http://localhost:3000

---

## API Endpoints

### Auth — `/api/auth`
| Method | Path        | Body                        | Description     |
|--------|-------------|-----------------------------|-----------------|
| POST   | /register   | name, email, password       | Create account  |
| POST   | /login      | email, password             | Sign in → JWT   |
| GET    | /me         | (header: Bearer token)      | Get current user|

### Jobs — `/api/jobs` (all require `Authorization: Bearer <token>`)
| Method | Path             | Body / Params                  | Description          |
|--------|------------------|--------------------------------|----------------------|
| GET    | /                | ?status, search, sortBy, order | List all + stats     |
| GET    | /:id             | —                              | Get single job       |
| POST   | /                | company, position, status, ... | Create job           |
| PUT    | /:id             | any job fields                 | Full update          |
| DELETE | /:id             | —                              | Delete job           |
| PATCH  | /:id/status      | { status }                     | Quick status update  |

---

## Database Schema

### User
```
name       String  required, max 50
email      String  required, unique
password   String  required, bcrypt hashed, min 6  (never returned in queries)
timestamps createdAt, updatedAt
```

### Job
```
user       ObjectId  ref: User, indexed
company    String    required, max 100
position   String    required, max 100
status     Enum      Applied | Interview | Offer | Rejected  (default: Applied)
location   String    optional
url        String    optional, must be http(s)://
salary     { min, max, currency }
notes      String    max 2000
nextStep   String    max 200
appliedAt  Date      default: now
tags       [String]
timestamps createdAt, updatedAt

Indexes: { user, createdAt }, { user, status }
```

---

## Folder Structure

```
job-tracker/
├── server/
│   ├── config/
│   │   └── db.js              # Mongoose connection
│   ├── middleware/
│   │   └── auth.js            # JWT protect middleware
│   ├── models/
│   │   ├── User.js            # User schema
│   │   └── Job.js             # Job schema
│   ├── routes/
│   │   ├── authRoutes.js      # /api/auth/*
│   │   └── jobRoutes.js       # /api/jobs/*
│   ├── .env.example
│   ├── package.json
│   └── server.js              # Express entry point
│
└── client/
    ├── src/
    │   ├── api/
    │   │   └── index.js       # Axios instance + API helpers
    │   ├── components/
    │   │   ├── JobCard.jsx    # Job card with inline status change
    │   │   ├── JobCard.module.css
    │   │   ├── JobForm.jsx    # Create/edit modal
    │   │   └── JobForm.module.css
    │   ├── context/
    │   │   └── AuthContext.jsx # Global auth state
    │   ├── pages/
    │   │   ├── Auth.module.css
    │   │   ├── Dashboard.jsx   # Main job board
    │   │   ├── Dashboard.module.css
    │   │   ├── Login.jsx
    │   │   └── Register.jsx
    │   ├── App.jsx             # Router + route guards
    │   ├── index.css           # CSS variables + reset
    │   └── main.jsx
    ├── index.html
    ├── package.json
    └── vite.config.js
```
