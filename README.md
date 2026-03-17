# ⛴️ Ferry Good

A web-based ferry scheduling and customer assignment system built with **Next.js** and **Microsoft Access**.

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Express](https://img.shields.io/badge/Express-4-green?style=flat-square&logo=express)
![MS Access](https://img.shields.io/badge/Microsoft_Access-Database-red?style=flat-square&logo=microsoft)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38bdf8?style=flat-square&logo=tailwindcss)

---

## 📋 Overview

Ferry Good is a full-stack management system for Philippine inter-island ferry operations. It allows staff to manage ferry schedules, assign passengers, and track booking history — all through a clean, role-based web interface backed by a Microsoft Access database.

---

## ✨ Features

- 🔐 **Role-based access control** — Admin, Register Staff, and Client roles
- 📅 **Schedule management** — View, search, filter, and sort ferry schedules
- 👥 **Customer assignment** — Assign and remove passengers from schedules
- 📖 **Customer history** — Read-only master record of all bookings
- 🛡️ **Admin panel** — User management, activate/deactivate accounts
- 🗄️ **MS Access database** — Full relational schema with VBA automation
- 📋 **Audit logging** — Every action is recorded with user and timestamp
- 💾 **Auto-backup** — VBA module backs up the database on every close

---

## 🖥️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| State Management | TanStack React Query |
| API Server | Express.js 4, JWT Authentication |
| Database | Microsoft Access (ACEOLEDB 12.0) |
| DB Bridge | node-adodb |
| Auth | bcryptjs + JSON Web Tokens |
| UI Components | lucide-react, react-hot-toast |

---

## 👥 Role Permissions

| Feature | Admin | Register | Client |
|---|:---:|:---:|:---:|
| View schedules | ✅ | ✅ | ✅ |
| View assigned passengers | ✅ | ✅ | ✅ |
| Add customers | ✅ | ✅ | ❌ |
| Assign customers to schedules | ✅ | ✅ | ❌ |
| Remove customers from schedules | ✅ | ❌ | ❌ |
| Delete customers | ✅ | ❌ | ❌ |
| View customer history | ✅ | ✅ | ❌ |
| Manage system users | ✅ | ❌ | ❌ |

---

## 📁 Project Structure

```
ferry-good/
├── database/                   # MS Access schema, VBA modules, seed data
│   ├── FerryGood_Schema.sql    # 46-step Access-compatible schema
│   ├── VBA_Modules.bas         # 8 VBA automation procedures
│   ├── SampleData.sql          # Seed data for testing
│   └── setup_instructions.md  # Step-by-step database setup guide
│
├── api-server/                 # Express.js REST API
│   ├── server.js               # Entry point
│   ├── db/connection.js        # MS Access OLEDB connection
│   ├── middleware/auth.js      # JWT authentication + role guard
│   └── routes/
│       ├── auth.js             # Login, logout, user management
│       ├── schedules.js        # Schedule CRUD + customer assignment
│       └── customers.js        # Customer CRUD + history
│
└── frontend/                   # Next.js 14 application
    ├── app/
    │   ├── page.tsx            # Login page
    │   ├── dashboard/          # Dashboard overview
    │   ├── schedules/          # Schedule list + detail pages
    │   ├── customers/          # Customer management
    │   ├── history/            # Read-only booking history
    │   └── admin/              # User management (admin only)
    ├── components/
    │   ├── layout/Sidebar.tsx  # Navigation sidebar
    │   └── ui/index.tsx        # Shared UI components
    ├── lib/
    │   ├── api.ts              # Axios client with JWT injection
    │   ├── auth-context.tsx    # Global auth state
    │   └── utils.ts            # Formatting and helper functions
    └── types/index.ts          # TypeScript type definitions
```

---

## 🚀 Getting Started

### Prerequisites

- **Windows OS** — required for MS Access OLEDB driver
- **Node.js 18+**
- **Microsoft Access 2016+** or Microsoft 365
- **Microsoft Access Database Engine 2016 (64-bit)**
  - Download: https://www.microsoft.com/en-us/download/details.aspx?id=54920

### 1. Database Setup

1. Open Microsoft Access and create a blank database saved as `FerryGood.accdb`
2. Run each statement in `database/FerryGood_Schema.sql` one at a time via **Create → Query Design → SQL View**
3. Run `database/SampleData.sql` to insert seed data
4. Import `database/VBA_Modules.bas` via **Alt+F11 → File → Import File**

> See `database/setup_instructions.md` for the full step-by-step guide.

### 2. API Server

```bash
cd api-server
npm install
```

Create a `.env` file:
```env
PORT=4000
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=999d
DB_PATH=C:\path\to\FerryGood.accdb
DB_PASSWORD=
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=10000
```

Start the server:
```bash
npm run dev
```

API runs at `http://localhost:4000`

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:3000`

> Both terminals must stay running simultaneously.

---

## 🔑 Default Credentials

| Role | Username | Password |
|---|---|---|
| Admin | `admin` | `Admin@123` |
| Register Staff | `register_staff` | `Register@123` |
| Client | `client_user` | `Client@123` |

---

## 🗄️ Database Schema

**8 tables** with full relational integrity:

```
Users ──────────────────────────────────────────┐
Ferries ─────────────────────────────────────┐  │
Ports ──┬─────────────────────────────────┐  │  │
        │                                 │  │  │
       Routes ──────────────────────── Schedules
                                           │  │
                                    ScheduleCustomers
                                           │
                                       Customers

AuditLog (standalone — logs all actions)
```

**3 saved queries:**
- `QRY_ActiveSchedules` — schedules with capacity counts via correlated subquery
- `QRY_CustomerHistory` — full 7-table JOIN for booking history
- `QRY_OverbookingCheck` — detects schedules at or over capacity

---

## ⚙️ VBA Automation Modules

| Module | Description |
|---|---|
| `AutoBackupOnClose` | Creates timestamped `.accdb` backup on every close |
| `WriteAuditLog` | Records every INSERT/UPDATE/DELETE to AuditLog |
| `ValidateCapacity` | Checks available seats before assignment |
| `CascadeScheduleStatusUpdate` | Cancels all bookings when a schedule is cancelled |
| `CleanOrphanRecords` | Removes dangling ScheduleCustomers rows |
| `GenerateManifest` | Exports a text passenger manifest per schedule |
| `EnableCompactOnClose` | Enables automatic database compaction on close |
| `CleanOldBackups` | Purges backup files older than 30 days |

---

## 🔧 Known Setup Notes

- `node-adodb` uses `cscript.exe` to bridge Node.js and Access. If you encounter a **"Provider cannot be found"** error, edit `node_modules/node-adodb/lib/engine.js` and change the `module.exports` to always return `cscript64` (the 64-bit path).
- The database file path must not be open in Access at the same time the API server is running — Access locks the file exclusively.
- Run the API server as Administrator if you encounter permission errors with `cscript.exe`.

---

## 📄 License

This project was built for academic purposes.
