# Mini Placement Portal (Monorepo)

A production-quality college Campus Training & Placement Office (TPO) management platform built with a strict monorepo architecture, type-safe data pipeline, and institutional design system.

---

## Architecture Overview

```
mini placement portal/
├── apps/
│   ├── web/                     # Next.js 14 Frontend (App Router, Tailwind CSS, Stitch Design System)
│   └── api/                     # Node.js + Express + TypeScript Backend
├── packages/
│   └── shared/                  # Common TypeScript interfaces, enums & Zod validation schemas
├── database/                    # Database documentation & reference schema
├── docs/                        # Architecture & Data model documentation
├── package.json                 # Monorepo workspaces definition
└── .env.example                 # Root environment template
```

### Core Technologies
* **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
* **Backend**: Node.js, Express, TypeScript, Zod
* **Database / ORM**: PostgreSQL, Prisma ORM
* **Design Language**: Stitch Placement OS specification (Plus Jakarta Sans, Inter, Institutional Navy `#00236f`, Royal Blue `#0051d5`, Crisp White Cards, 4px/8px rhythm)

---

## Roles & Core Rules

1. **`STUDENT`**:
   * Registers and submits academic profile (10th subject-wise marks + 12th for regular students, or Diploma details for D2D lateral entry students).
   * **Profile Locking**: Once the student submits their profile, the profile state transitions to `LOCKED`. Server-side validation strictly blocks any subsequent modifications by the student.
   * Views eligible recruitment drives and monitors application status.
2. **`CENTRAL TPO`**:
   * Verifies student academic profiles and can update or unlock profiles.
   * Adds recruiter companies and creates recruitment drives with custom eligibility criteria (min CGPA, 10th/12th/Diploma percentage cutoffs, backlog limits, department restrictions).
   * Monitors student application pipelines and tracks hiring outcomes.

---

## Prerequisites

* **Node.js**: >= 18.x (tested on v24.15.0)
* **npm**: >= 9.x
* **PostgreSQL**: >= 14 (for database migrations and query execution)

---

## Getting Started

### 1. Clone & Install Dependencies
From the repository root:
```bash
npm install
```

### 2. Environment Variables Configuration
Copy the root `.env.example` to both `apps/api/.env` and `apps/web/.env.local`:

```bash
# Backend environment
cp .env.example apps/api/.env

# Frontend environment
cp apps/web/.env.example apps/web/.env.local
```

#### Required Environment Variables

**Backend (`apps/api/.env`):**
| Variable | Description | Example |
| :--- | :--- | :--- |
| `PORT` | API Server port | `5000` |
| `NODE_ENV` | Environment mode | `development` |
| `DATABASE_URL` | PostgreSQL connection URI | `postgresql://postgres:postgres@localhost:5432/placement_portal?schema=public` |
| `JWT_SECRET` | Secret key for JWT signing | `super_secret_jwt_key_min_32_characters` |
| `JWT_EXPIRES_IN`| Token lifespan | `7d` |
| `CORS_ORIGIN` | Allowed client origin | `http://localhost:3000` |

**Frontend (`apps/web/.env.local`):**
| Variable | Description | Example |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | Express API endpoint | `http://localhost:5000/api/v1` |

---

## Running the Applications

The frontend and backend are completely decoupled and run independently.

### Running Backend API (Port 5000)
```bash
npm run dev:api
```
* API Server: `http://localhost:5000`
* Health Check: `http://localhost:5000/api/v1/health`

### Running Frontend (Port 3000)
```bash
npm run dev:web
```
* Web Portal: `http://localhost:3000`

---

## Validation & Quality Checks

Run the verification commands from the repository root:

```bash
# 1. Build shared library
npm run build:shared

# 2. Typecheck all packages and applications
npm run typecheck

# 3. Validate Prisma schema
npm run prisma:validate

# 4. Lint codebase
npm run lint

# 5. Full production build check
npm run build
```
