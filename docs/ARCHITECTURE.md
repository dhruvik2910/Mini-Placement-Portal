# System Architecture: Mini Placement Portal

## 1. Architectural Philosophy

The Mini Placement Portal is designed as a **production-quality monorepo** strictly decoupling the Next.js frontend from the Express.js API server. 

### Core Architectural Invariants:
1. **Decoupled Client & Server**: The Next.js client interacts exclusively with the backend via HTTP REST endpoints (`/api/v1/*`). No database connections, ORM queries, or credentials exist inside React components.
2. **Server-Side Profile Locking**: The transition from `DRAFT` to `LOCKED` is strictly enforced in API domain logic and database constraints. The student cannot update locked academic or personal profile fields via the API.
3. **Layered API Structure**: Controller -> Service -> Repository / Prisma ORM.
4. **Shared Types Package**: Enums, DTOs, and common validation schemas are shared via `@placement/shared` without duplicating code.

---

## 2. Monorepo Organization

```text
mini placement portal/
├── apps/
│   ├── web/                     # Next.js 14 Frontend (App Router, Tailwind CSS, Stitch Design)
│   │   ├── src/
│   │   │   ├── app/             # App router pages, layouts, styles
│   │   │   └── components/      # UI components following 4px/8px rhythm
│   │   ├── package.json
│   │   ├── tailwind.config.ts
│   │   └── tsconfig.json
│   │
│   └── api/                     # Node.js + Express Backend
│       ├── src/
│       │   ├── common/          # Operational error classes & utils
│       │   ├── config/          # Zod-validated env config & Prisma client singleton
│       │   ├── middleware/      # Error handler, 404, request validator, auth & RBAC
│       │   ├── modules/         # Modular feature domains (health, auth, students, etc.)
│       │   ├── routes/          # API version routing (/api/v1)
│       │   ├── app.ts           # Express application setup
│       │   └── server.ts        # Server entry point & graceful shutdown
│       ├── prisma/
│       │   └── schema.prisma    # Complete Prisma schema
│       ├── package.json
│       └── tsconfig.json
│
├── packages/
│   └── shared/                  # Common TypeScript interfaces, enums, Zod schemas
│       ├── src/
│       │   ├── enums.ts         # UserRole, StudentType, ProfileStatus, etc.
│       │   ├── types.ts         # DTOs, health response, API wrappers
│       │   ├── schemas.ts       # Shared Zod schemas
│       │   └── index.ts
│       └── package.json
│
├── database/                    # Database reference documentation & scripts
├── docs/                        # Architecture & Data model documentation
├── package.json                 # Monorepo workspaces definition
├── .env.example                 # Root environment template
└── README.md                    # Setup and execution guide
```

---

## 3. Security & Access Control Model

Two primary roles are supported:

| Role | Permissions |
| :--- | :--- |
| **`STUDENT`** | Register, submit academic profile, view eligible recruitment drives, apply to drives, track application status. Once profile is submitted (`LOCKED`), academic and personal fields cannot be edited. |
| **`TPO` (Central Officer)** | View student registry, inspect and verify profiles, override/update locked profiles, create recruiter companies, launch recruitment drives, set eligibility matrices, and manage student applications. |

---

## 4. Visual Design System

The frontend directly adheres to the institutional design language extracted from the Stitch reference screens:
* **Headings**: Plus Jakarta Sans
* **Body / Data**: Inter
* **Primary (Navy)**: `#00236f`
* **Secondary (Royal Blue Action)**: `#0051d5`
* **Surface Background**: `#f8f9ff`
* **Card Surface**: `#ffffff` with subtle borders (`#c5c5d3` / `#dce9ff`) and 4px/8px rhythm.
