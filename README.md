# AssetFlow — Enterprise Asset & Resource Management System

> **Industry-agnostic ERP platform** to register, allocate, book, maintain, and audit physical assets across their full lifecycle — with role-based workflows and real-time notifications.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-22.x-green?logo=node.js)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19.x-61dafb?logo=react)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?logo=postgresql)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.x-2d3748?logo=prisma)](https://www.prisma.io/)
[![Ant Design](https://img.shields.io/badge/Ant%20Design-5.x-0170fe?logo=antdesign)](https://ant.design/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## ✨ Features

| Domain | Capabilities |
|--------|--------------|
| **Authentication & RBAC** | Employee-only signup (self-elevation blocked), role promotion by Admin, 4 roles (Admin, Asset Manager, Department Head, Employee) with scoped permissions |
| **Organization Setup** | Hierarchical departments, asset categories with custom fields, employee directory with role promotion |
| **Asset Lifecycle** | Register assets with auto-generated tags & QR codes, directory with search/filter, status state machine (Available → Allocated → Reserved → Under Maintenance → Lost/Retired/Disposed) |
| **Allocation & Transfer** | One active allocation per asset (enforced by DB constraint), transfer workflow with approval chain, return/check-in with condition notes |
| **Resource Booking** | Calendar-based booking for bookable assets, PostgreSQL `EXCLUDE` constraint prevents overlapping bookings |
| **Maintenance Workflow** | Request → Approve → Assign Technician → In Progress → Resolved; asset status auto-flips to `UNDER_MAINTENANCE` **only after approval** |
| **Audit Cycles** | Plan cycles (by department/location), assign auditors, mark items Verified/Missing/Damaged, discrepancy reports, cycle closure |
| **Dashboard & Reports** | KPI cards, utilization charts, maintenance frequency, department summaries, booking heatmaps, CSV export |
| **Real-time Notifications** | Socket.io live toasts + notification center + unread badge |
| **Activity Log & Audit Trail** | Every mutation logged (who/what/when) with JSON metadata |

---

## 🏗 Architecture

```
AssetFlow/
├── backend/     # Node.js + Express + TypeScript + Prisma + PostgreSQL (REST API + Socket.io)
├── frontend/    # React + Vite + TypeScript + Ant Design 5 + TanStack Query + Socket.io-client
└── docs/        # ARCHITECTURE.md (canonical spec — read before designing anything non-trivial)
```

- **Backend** is the source of truth for the data contract (OpenAPI/Swagger at `/api/docs`)
- **Frontend** mirrors only the types it needs from the backend
- Both apps are independently deployable (separate `package.json`, separate `Dockerfile`)

> 📖 **Full specification:** [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — read before designing anything non-trivial.

---

## 🔒 Golden Invariants (Never Violate)

| # | Invariant | Enforcement |
|---|-----------|-------------|
| 1 | **Signup creates EMPLOYEE only** — role hard-coded, never from body | Backend route handler |
| 2 | **No double-allocation** — one `ACTIVE` allocation per asset | Partial unique index + transactional check |
| 3 | **No booking overlap** — half-open `[start,end)` intervals | PostgreSQL `EXCLUDE` constraint (GiST) |
| 4 | **Maintenance requires approval** — asset flips to `UNDER_MAINTENANCE` only after approval | State machine + service guard |
| 5 | **Asset status transitions validated** — illegal transitions → `409 Conflict` | State machine (`lib/stateMachine.ts`) |
| 6 | **Every mutation authorized + logged** — `requirePermission` + domain events → ActivityLog + Notifications | Middleware + event bus (`lib/events.ts`) |

> 🔴 If a change weakens any invariant — **stop and flag it.**

---

## 🚀 Quick Start

### Prerequisites
- **Node.js 22+** (LTS)
- **PostgreSQL 16+** (local via Docker or hosted: Neon, Supabase, Railway)

### 1. Clone & Install

```bash
git clone https://github.com/DhruvPipaliya1/AssetFlow.git AssetFlow
cd AssetFlow

# Backend
cd backend
cp .env.example .env        # set DATABASE_URL, JWT_SECRET, CLIENT_ORIGIN
npm install
npm run prisma:migrate      # applies migrations + creates constraints
npm run seed                # seeds demo data (8 users, 4 depts, assets, etc.)
npm run dev                 # API on http://localhost:4000

# Frontend (new terminal)
cd ../frontend
cp .env.example .env        # set VITE_API_URL, VITE_WS_URL
npm install
npm run dev                 # SPA on http://localhost:5173
```

### 2. Demo Credentials (from seed)

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@assetflow.test` | `Admin@123` |
| Asset Manager | `manager@assetflow.test` | `Manager@123` |
| Department Head | `head@assetflow.test` | `Head@123` |
| Employee | `employee@assetflow.test` | `Employee@123` |

> **Swagger UI:** `http://localhost:4000/api/docs` — interactive API docs with auth support.

---

## 📦 Backend (API) — `backend/`

```bash
cd backend

npm run dev           # tsx watch (port 4000)
npm run build         # tsc → dist/
npm run start         # node dist/server.js
npm run typecheck     # tsc --noEmit
npm run prisma:studio # Prisma Studio UI
npm run seed          # idempotent demo seed
```

**Key scripts**

| Script | Purpose |
|--------|---------|
| `db:up` | Starts local Postgres via Docker (optional) |
| `prisma:migrate` | Runs pending migrations |
| `prisma:generate` | Regenerates Prisma Client |
| `prisma:deploy` | Applies migrations in CI/prod |

**Environment** (`.env`)

```env
DATABASE_URL="postgresql://user:pass@localhost:5432/assetflow?schema=public"
JWT_SECRET="super-secret-change-in-prod"
CLIENT_ORIGIN="http://localhost:5173"
PORT=4000
```

**API Modules** (mounted under `/api`)

```
/auth          → signup, login, me
/departments   → CRUD + hierarchy
/categories    → CRUD + custom fields
/employees     → directory + role promotion
/assets        → register, directory, detail, QR
/allocations   → allocate, return, overdue
/transfers     → request, approve, complete
/bookings      → calendar, create, cancel, reschedule
/maintenance   → raise, approve, assign, resolve
/audit-cycles  → plan, assign, audit, close
/audit-items   → item-level actions
/dashboard     → KPIs
/reports       → utilization, heatmap, export
/notifications → feed, mark read
/activity-log  → audit trail
```

---

## 🎨 Frontend (SPA) — `frontend/`

```bash
cd frontend

npm run dev           # Vite HMR (port 5173)
npm run build         # tsc + vite build → dist/
npm run preview       # preview production build
npm run lint          # oxlint
```

**Environment** (`.env`)

```env
VITE_API_URL=http://localhost:4000/api
VITE_WS_URL=http://localhost:4000
```

**Stack highlights**

- **Ant Design 5** — single component library (no MUI/shadcn)
- **TanStack Query** — server state, caching, invalidation
- **React Router v7** — RBAC route guards (`ProtectedRoute`, `RoleRoute`)
- **Zod** — form validation (mirrors backend schemas)
- **Socket.io-client** — live notifications + unread badge
- **Recharts + @ant-design/plots** — dashboards & heatmaps

**Project structure** (`src/`)

```
features/          # one folder per screen (mirrors backend modules)
  auth/            # Login, Signup, ForgotPassword
  dashboard/       # KPI cards + quick actions
  org/             # Departments | Categories | Employees tabs
  assets/          # Directory, Register, Detail Drawer
  allocations/     # Allocate, Transfers, Returns
  bookings/        # Calendar + BookingForm
  maintenance/     # Raise + approval Steps
  audits/          # Cycles, assignments, discrepancies
  reports/         # Charts + CSV export
  notifications/   # Feed + bell dropdown
components/common/ # StatusTag, KpiCard, WorkflowSteps, PageHeader, ConfirmButton, Loader
lib/               # api.ts (axios), queryClient.ts, socket.ts, auth.tsx (context)
hooks/             # useAuth, useSocketNotifications
types/             # enums + DTOs mirrored from backend
```

---

## 🧪 Testing & Quality

```bash
# Backend
cd backend
npm run typecheck   # strict TS
# (add your test runner: vitest/jest — not yet configured)

# Frontend
cd frontend
npm run lint        # oxlint
npm run build       # typecheck + production build
```

> **Definition of Done** (every feature): RBAC-guarded route · Zod-validated body · state transition checked · activity log + notification fire · happy path + rejection path work in UI · seed exercises it · appears on dashboard.

---

## 🗄 Database Schema Highlights

- **Enums for all status/role/priority fields** — no magic strings
- **Partial unique index** on `Allocation` (`status = ACTIVE`) → one active allocation per asset
- **PostgreSQL `EXCLUDE` constraint** on `Booking` → no overlapping time ranges per asset
- **Asset tag sequence** (`AF-0001`, `AF-0002`, …) via `SEQUENCE` + trigger
- **Soft delete** — `status = INACTIVE` on departments/categories/employees (preserves FKs + history)
- **ActivityLog** — every mutation emits a domain event → handler writes `ActivityLog` + `Notification`

> Constraints that Prisma can't express (partial unique index, EXCLUDE) live in `prisma/migrations/*_add_constraints/migration.sql`.

---

## 🔐 RBAC Matrix (Summary)

| Capability | Admin | Asset Manager | Dept Head | Employee |
|------------|:-----:|:-------------:|:---------:|:--------:|
| Manage departments/categories/employees | ✅ | | | |
| Promote/demote roles | ✅ | | | |
| Register & allocate assets | | ✅ | | |
| Approve transfers/maintenance/returns/audits | | ✅ | | |
| View dept assets | | | ✅ | |
| Approve allocation/transfer **within dept** | | | ✅ | |
| Book on behalf of dept | | | ✅ | |
| View own assets | | | | ✅ |
| Book resources | | | | ✅ |
| Raise maintenance | | | | ✅ |
| Initiate return/transfer | | | | ✅ |

> 🔸 Scoped permissions (dept/own) **must** check ownership, not just role. See `backend/src/lib/permissions.ts`.

---

## 🐳 Docker (Optional)

```yaml
# docker-compose.yml (root)
version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: assetflow
      POSTGRES_USER: assetflow
      POSTGRES_PASSWORD: assetflow
    ports: ["5432:5432"]
    volumes: ["pgdata:/var/lib/postgresql/data"]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U assetflow"]
      interval: 5s
      timeout: 3s
      retries: 5

  backend:
    build: ./backend
    ports: ["4000:4000"]
    env_file: ./backend/.env
    depends_on:
      postgres:
        condition: service_healthy

  frontend:
    build: ./frontend
    ports: ["5173:5173"]
    env_file: ./frontend/.env
    depends_on: [backend]

volumes:
  pgdata:
```

```bash
docker compose up -d --build
```

---

## 📁 Project Conventions

| Area | Convention |
|------|------------|
| **Language** | TypeScript `strict: true` — no `any` without justification comment |
| **Enums** | `SCREAMING_SNAKE_CASE` — identical values on backend & frontend |
| **Money** | `acquisitionCost` → `Decimal(12,2)` — for ranking/reports only, never accounting |
| **Time** | All timestamps UTC; booking overlap math in UTC |
| **Soft delete** | Deactivate (status flip) — never hard-delete (preserves FKs + history) |
| **Errors** | `{ error: { code, message, details? } }` with correct HTTP status |
| **Naming** | `camelCase` (code), `PascalCase` (types/components), `kebab-case` (files/routes) |
| **Git** | `feat/<module>-<thing>`, `fix/…` · small PRs · conventional commits |

---

## 🗺 Roadmap (High-Level)

| Phase | Focus |
|-------|-------|
| **P0** | Auth → Org Setup → Asset Register → Allocation (double-alloc block) → Transfer → Booking (overlap block) → Maintenance approval → Dashboard KPIs → Notifications |
| **P1** | Audit cycles + discrepancy · Overdue cron + alerts · Reports (utilization + heatmap) · Live socket notifications · Return/check-in flow |
| **P2** | CSV export · Booking heatmap polish · Category custom fields · Dark mode · Global search |
| **🔮 Future** | Refresh-token rotation · Multi-tenant (`organizationId`) · Durable event bus (Kafka/Redis) · Custom roles · SSO |

---

## 🤝 Contributing

1. Fork → `feat/<module>-<thing>` branch
2. Follow conventions above
3. Run `npm run typecheck` (backend) / `npm run lint && npm run build` (frontend)
4. Open PR with clear description + linked issue

---

## 📄 License

MIT © 2026 AssetFlow Contributors

---

## 🙋 Support

- **Issues:** GitHub Issues (bug reports, feature requests)
- **Architecture questions:** Read `docs/ARCHITECTURE.md` first
- **Security:** Report privately via GitHub Security Advisories