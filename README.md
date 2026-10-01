# 🎓 Mini Placement Portal

A web-based **Mini Placement Portal** designed to simplify the campus recruitment process by providing separate workflows for **Students** and the **Central Training & Placement Officer (TPO)**.

The portal allows students to maintain their placement profiles and apply for eligible recruitment drives, while the Central TPO can manage student profiles, companies, recruitment drives, eligibility, and applications.

---

## 📌 Project Overview

The **Mini Placement Portal** provides a centralized platform for managing student placement activities.

### 👨‍🎓 Student Flow

Students can:

- Register and create their placement profile.
- Enter personal and academic details.
- Provide Std. 10 marks for each subject.
- Enter Std. 10 percentage.
- Enter Std. 12 percentage if they are not D2D students.
- Enter D2D CGPA and other required details if applicable.
- View companies and available recruitment drives.
- Apply to recruitment drives when they satisfy the eligibility criteria.
- View their application and verification status.

Once a student submits their profile, the profile is **locked and cannot be edited further**.

---

## 🏛️ Central TPO Flow

The Central TPO can:

- View all registered student profiles.
- Update student profile information.
- Verify student details.
- Add and manage companies.
- Add recruitment drives under companies.
- Define recruitment drive details such as:
  - Job role
  - CTC
  - Eligibility criteria
- Filter students based on recruitment eligibility.
- Check academic criteria such as:
  - Std. 10 marks
  - CGPA
  - CPI
  - Other applicable academic details
- Monitor student applications.
- Monitor student verification status.

---

## ✨ Key Features

### Student Module

| Feature | Description |
|---|---|
| 📝 Registration | Student registration and profile creation |
| 👤 Profile | Personal and academic information |
| 🔒 Profile Lock | Profile becomes non-editable after submission |
| 🏢 Companies | View companies participating in recruitment |
| 💼 Recruitment Drives | View available job opportunities |
| ✅ Eligibility | Apply only when eligibility criteria are satisfied |
| 📋 Applications | Track submitted applications |
| 🔍 Status | View verification/application status |

### Central TPO Module

| Feature | Description |
|---|---|
| 👥 Student Management | View and update student profiles |
| ✔️ Verification | Verify student information |
| 🏢 Company Management | Add and manage companies |
| 💼 Drive Management | Create recruitment drives |
| 🎯 Eligibility Filtering | Find eligible students |
| 📊 Application Monitoring | Monitor applications |
| 🔎 Student Filtering | Filter students using academic criteria |

---

## 🛠️ Technology Stack

### Frontend

- **React.js**
- **Tailwind CSS**
- **Next.js** *(preferred)*

### Backend

- **Node.js**
- **TypeScript**

### Database

- **PostgreSQL**

### Development Tools

- Git
- GitHub
- VS Code
- Postman

---

## 🏗️ System Architecture

```text
                    ┌─────────────────────┐
                    │   Mini Placement    │
                    │       Portal        │
                    └──────────┬──────────┘
                               │
                 ┌─────────────┴─────────────┐
                 │                           │
          ┌──────▼──────┐             ┌──────▼──────┐
          │   Student   │             │ Central TPO │
          │    Portal   │             │    Portal   │
          └──────┬──────┘             └──────┬──────┘
                 │                           │
                 └─────────────┬─────────────┘
                               │
                       ┌───────▼────────┐
                       │   Backend API  │
                       │ Node.js + TS   │
                       └───────┬────────┘
                               │
                       ┌───────▼────────┐
                       │   PostgreSQL   │
                       │    Database    │
                       └────────────────┘
```

---

## 📂 Suggested Project Structure

```text
mini-placement-portal/
│
├── frontend/
│   ├── app/
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── hooks/
│   ├── utils/
│   └── ...
│
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── models/
│   │   ├── services/
│   │   ├── middleware/
│   │   └── utils/
│   └── ...
│
├── database/
│   ├── migrations/
│   └── seed/
│
├── README.md
├── .gitignore
└── package.json
```

---

## 🔄 Main Application Flow

### Student Registration

```text
Student
   │
   ▼
Registration Form
   │
   ▼
Enter Personal Details
   │
   ▼
Enter Academic Details
   │
   ▼
Submit Profile
   │
   ▼
Profile Locked
   │
   ▼
View Recruitment Drives
   │
   ▼
Check Eligibility
   │
   ▼
Apply
```

### Central TPO Recruitment Flow

```text
Central TPO
    │
    ▼
Add Company
    │
    ▼
Create Recruitment Drive
    │
    ▼
Define Eligibility Criteria
    │
    ▼
System Filters Eligible Students
    │
    ▼
Students Apply
    │
    ▼
TPO Monitors Applications
    │
    ▼
Verification / Status
```

---

## 🗃️ Core Database Entities

The application can be designed around the following major entities:

```text
Student
   │
   ├───────────────< Application >────────────── Company
   │                                             │
   │                                             │
   └── Student Academic Details            Recruitment Drive
                                                   │
                                                   │
                                                   └── Eligibility Criteria
```

### Main Tables

- `students`
- `student_academics`
- `companies`
- `recruitment_drives`
- `applications`
- `verification_status`

The exact database structure may be extended as development progresses.

---

## 🔐 Profile Locking

A key requirement of the system is that a student's profile becomes locked after submission.

```text
Profile Status

DRAFT
  │
  │ Submit
  ▼
SUBMITTED / LOCKED
  │
  └── Student cannot edit profile
```

The Central TPO retains the ability to view and update student information when required.

---

## 🎯 Recruitment Eligibility

Students should only be allowed to apply to recruitment drives when they satisfy the eligibility criteria specified by the Central TPO.

Possible criteria include:

- Minimum Std. 10 percentage/marks
- Std. 12 percentage where applicable
- Minimum CGPA
- Minimum CPI
- D2D-specific academic requirements
- Other recruitment-specific conditions

The eligibility system should automatically identify eligible students whenever possible.

---

## 📊 Application Status

A recruitment application can have statuses such as:

```text
Applied
   ↓
Under Verification
   ↓
Verified
   ↓
Shortlisted / Not Shortlisted
```

The exact statuses can be adjusted according to the final project requirements.

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd mini-placement-portal
```

### 2. Install Dependencies

For the frontend:

```bash
cd frontend
npm install
```

For the backend:

```bash
cd ../backend
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the backend directory.

Example:

```env
PORT=5000

DATABASE_URL=your_postgresql_database_url

JWT_SECRET=your_secret_key
```

> Never commit your `.env` file to GitHub.

### 4. Configure PostgreSQL

Create a PostgreSQL database and configure the database connection using the environment variables.

### 5. Start the Backend

```bash
npm run dev
```

### 6. Start the Frontend

```bash
cd frontend
npm run dev
```

The application can then be accessed through the local development URL displayed by Next.js.

---

## 🌱 Git & Contribution Guidelines

All team members should actively contribute to the project and maintain a clean Git history.

### Recommended Branch Structure

```text
main
│
├── frontend
├── backend
├── student-module
├── tpo-module
└── database
```

### Commit Message Examples

```text
feat: add student registration form
feat: add company management
feat: implement recruitment drive creation
feat: add student eligibility filtering
fix: resolve application validation issue
docs: update project README
refactor: improve student profile service
```

### Basic Git Workflow

```bash
git pull origin main

git checkout -b feature/student-registration

git add .

git commit -m "feat: add student registration"

git push origin feature/student-registration
```

Create a Pull Request after pushing the branch and review the changes before merging.

---

## ☁️ Deployment

The project is intended to be deployed using free-tier services where possible.

Possible deployment architecture:

```text
                 GitHub
                    │
          ┌─────────┴─────────┐
          │                   │
       Frontend             Backend
          │                   │
          └─────────┬─────────┘
                    │
               PostgreSQL
```

Deployment platforms can be selected according to the team's final requirements and available free-tier services.

---

## 📋 Project Goals

The primary goals of this project are:

- Build a functional mini placement management system.
- Simplify student placement registration.
- Provide centralized recruitment-drive management.
- Automate basic eligibility filtering.
- Allow TPOs to monitor applications and verification.
- Provide a clean and easy-to-use interface.
- Practice full-stack web development.
- Follow collaborative Git/GitHub development practices.

---

## 🔮 Future Enhancements

Additional features can be added after the core requirements are completed:

- 📧 Email notifications
- 🔔 Recruitment-drive notifications
- 📄 Resume upload
- 📊 Placement statistics dashboard
- 📥 Export eligible students to Excel/CSV
- 🔎 Advanced student filtering
- 📱 Responsive mobile interface
- 🔐 Role-based authentication and authorization
- 📈 TPO analytics dashboard
- 📝 Interview-round tracking
- 📢 Announcements

---

## 👨‍💻 Team

This project is developed as a collaborative team project.

**Project:** Mini Placement Portal  
**Domain:** Campus Recruitment / Placement Management  
**Development:** Full-Stack Web Application

---

## 📜 License

This project is developed for educational and academic purposes.

---

## ⭐ Acknowledgement

This project was developed as part of a team-based software development task to build a functional mini placement portal with Student and Central TPO workflows.
