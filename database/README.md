# Database Architecture - Mini Placement Portal

This directory contains database documentation, schema definitions, and migration guidelines for the **College Mini Placement Portal**.

## Tech Stack
* **RDBMS**: PostgreSQL (>= 14)
* **ORM**: Prisma ORM (v5.x)
* **Prisma Schema Location**: `apps/api/prisma/schema.prisma` (and mirrored in `database/schema.prisma`)

---

## Relational Models Overview

The database design encapsulates strict integrity constraints, foreign keys, cascade rules, and role-based entity separation across **10 models**:

### 1. `User`
* Core authentication and credentials record.
* Fields: `id` (UUID), `email` (unique), `passwordHash`, `role` (`STUDENT` | `TPO`), `isActive`, `createdAt`, `updatedAt`.
* 1-to-1 optional relationship with `StudentProfile` and `TpoProfile`.

### 2. `StudentProfile`
* Primary student institutional record.
* Supports two admission types:
  * `REGULAR`: Standard 4-year engineering entry (linked to `TwelfthDetails`).
  * `D2D`: Diploma to Degree lateral entry (linked to `D2DDetails`).
* **Profile State Lifecycle**:
  * `status`: `DRAFT` | `LOCKED`.
  * **Critical Business Rule**: Once submitted, `status = LOCKED` and `lockedAt` is populated. The backend API strictly blocks any subsequent modifications by the student. Only authorized Central TPO officers can update locked profiles.
* **Verification Status**:
  * `verificationStatus`: `PENDING` | `VERIFIED` | `REJECTED`.
* Relations: 1-to-1 with `TenthMarks`, optional 1-to-1 with `TwelfthDetails` or `D2DDetails`, 1-to-many with `Application` and `Verification`.

### 3. `TenthMarks`
* Mandatory for all students.
* Stores `board`, `schoolName`, `passingYear`, `marksObtained`, `totalMarks`, and calculated `percentage`.
* `subjectWiseMarks`: JSON array storing granular marks breakdown:
  ```json
  [
    { "subject": "Mathematics", "marksObtained": 92, "maxMarks": 100 },
    { "subject": "Science", "marksObtained": 88, "maxMarks": 100 },
    { "subject": "English", "marksObtained": 85, "maxMarks": 100 }
  ]
  ```

### 4. `TwelfthDetails` (Regular Students)
* Populated when `studentType == 'REGULAR'`.
* Stores `board`, `schoolName`, `passingYear`, `stream`, `marksObtained`, `totalMarks`, and `percentage`.

### 5. `D2DDetails` (Diploma-to-Degree Lateral Entry)
* Populated when `studentType == 'D2D'`.
* Stores `diplomaCollege`, `diplomaUniversity`, `diplomaBranch`, `passingYear`, `diplomaCgpa`, and optional `diplomaPercentage`.

### 6. `TpoProfile`
* Operational profile for Central Training & Placement Officers.
* Stores `fullName`, `designation`, `department`, `phone`.

### 7. `Company`
* Recruiter partner master record.
* Stores `name` (unique), `website`, `industry`, `description`, `logoUrl`, and contact details.

### 8. `RecruitmentDrive`
* Specific placement drive posted by Central TPO.
* Defines eligibility parameters:
  * `minCgpa`
  * `minTenthPercentage`
  * `minTwelfthOrDiplomaPercentage`
  * `maxActiveBacklogs`
  * `allowedStudentTypes` (`REGULAR`, `D2D`)
  * `allowedDepartments` (Array of departments, e.g. `["CSE", "IT", "ECE"]`)
* Job details: `title`, `jobRole`, `driveType` (`FULL_TIME`, `INTERNSHIP`, `INTERN_PLUS_FTE`), `packageLpa`, `stipendMonthly`, `deadline`, and `status`.

### 9. `Application`
* Record of student application to a recruitment drive.
* Enforces uniqueness on `[studentProfileId, recruitmentDriveId]` (a student cannot apply twice to the same drive).
* Lifecycle `status`: `APPLIED` -> `UNDER_REVIEW` -> `SHORTLISTED` -> `REJECTED` | `SELECTED`.

### 10. `Verification`
* Immutable audit log of verifications conducted by TPO officers.
* Records `studentProfileId`, `verifiedByUserId`, `status` (`PENDING`, `VERIFIED`, `REJECTED`), `remarks`, and `verifiedAt`.

---

## Database Setup & Environment Variables

Configure your PostgreSQL connection in `.env` or `apps/api/.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/placement_portal?schema=public"
```

### Validate Schema
```bash
npm run prisma:validate
```

### Generate Prisma Client
```bash
npm run prisma:generate
```

### Run Migrations (when connecting to active PostgreSQL instance)
```bash
npx prisma migrate dev --name init --schema=apps/api/prisma/schema.prisma
```
