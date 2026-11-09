# TalentHub – Campus Placement Management System

A web-based campus placement management platform designed to streamline the placement process by connecting students, companies, and placement coordinators through a centralized application.

Built using **Node.js, Express.js, SQLite, HTML, CSS, and JavaScript**, TalentHub provides role-based access, job management, eligibility verification, application tracking, interview scheduling, and placement statistics.

## 1. Technology Stack

| Component | Technology |
|---|---|
| Backend | Node.js, Express.js |
| Database | SQLite |
| Frontend | HTML5, CSS3, JavaScript |
| Authentication | Password Hashing, Session Management |
| Architecture | Layered Architecture (Router–Service–Repository) |

## 2. Project Structure

```text
TalentHub/
│
├── package.json
├── package-lock.json
├── README.md
├── server.js
├── start.bat
│
├── public/
│   ├── app.js
│   ├── index.html
│   └── style.css
│
└── src/
    ├── auth.js
    ├── db.js
    ├── schema.js
    ├── seed.js
    ├── validate.js
    │
    ├── repositories/
    │   ├── applicationRepo.js
    │   ├── companyRepo.js
    │   ├── jobRepo.js
    │   ├── statsRepo.js
    │   ├── studentRepo.js
    │   └── userRepo.js
    │
    ├── routers/
    │   ├── authRouter.js
    │   ├── companyRouter.js
    │   ├── coordinatorRouter.js
    │   └── studentRouter.js
    │
    └── services/
        ├── authService.js
        ├── companyService.js
        ├── coordinatorService.js
        ├── eligibility.js
        └── studentService.js
```

## 3. Features and Functionalities

### Student Module
- View available placement opportunities.
- Check job eligibility with eligible/not eligible status and explanations.
- Apply for jobs based on eligibility criteria.
- Track application status.
- View scheduled interview details.
- Accept or decline placement offers.
- Register through the application.

### Company Module
- Create and manage job postings.
- Define eligibility requirements, including minimum CGPA, maximum active backlogs, and permitted branches.
- Set application deadlines.
- View applications received for posted jobs.
- Shortlist or reject applicants.
- Schedule interviews.
- Record interview results.
- Issue placement offers.

### Placement Coordinator Module
- Access placement statistics and dashboards.
- View placed students and overall placement percentage.
- Monitor offers, average CTC, and highest CTC.
- View placement statistics by branch and company.
- Update student CGPA and active backlogs.
- Add company accounts to the platform.

## 4. Business Logic and Rules

The system implements the following placement-related rules:

**Job Eligibility**

A student is eligible for a job when all the following conditions are satisfied:

- Student CGPA is greater than or equal to the company's minimum CGPA requirement.
- Active backlogs do not exceed the permitted maximum.
- Student's branch is included in the job's allowed branches.

**Application Management**
- A student can apply only once for a particular job.
- Applications are accepted only before the job deadline.
- Applications are allowed only for open job listings.
- Students who have accepted an offer are treated as placed under the implemented one-offer policy.

**Application and Placement Pipeline**

```text
Applied
   ↓
Shortlisted
   ↓
Interview Scheduled
   ↓
Interview Passed
   ↓
Offer Issued
   ↓
Accepted / Declined
```

**Role-Based Access**
- Companies can manage only their own job listings and applicants.
- Students can access and respond only to their own applications and offers.
- Placement coordinators can manage relevant placement information.

## 5. System Architecture

TalentHub follows a layered architecture that separates request handling, business logic, and database operations.

| Layer | Responsibility |
|---|---|
| Server | Initializes Express, configures security headers, and mounts routers. |
| Router | Handles HTTP requests and role-based access checks. |
| Service | Implements business logic, eligibility checks, and application workflows. |
| Repository | Handles database queries and data operations. |
| Database | Stores users, students, companies, jobs, applications, interviews, and offers. |
| Frontend | Provides the user interface using HTML, CSS, and JavaScript. |

### Database

The application uses SQLite for persistent data storage.

The database includes the following tables:

- users
- students
- companies
- job_listings
- job_allowed_branches
- applications
- interview_slots
- offers

## 6. Installation and Execution

### Prerequisites
- Node.js version 16 or later.
- npm (included with Node.js).

### Steps to Run

**Step 1: Open the project directory**

Open a terminal in the TalentHub project folder.

**Step 2: Install dependencies**

```bash
npm install
```

**Step 3: Start the application**

```bash
npm start
```

Alternatively, run:

```bash
node server.js
```

On Windows, you can also double-click `start.bat`.

**Step 4: Open the application**

Visit the following URL in your browser:

```text
http://localhost:3000
```

To stop the server, press `Ctrl + C` in the terminal.

## 7. Demo Credentials

The application includes preconfigured demo accounts.

**Default password for all demo accounts:** `password123`

| Role | Demo Email |
|---|---|
| Placement Coordinator | coordinator@talenthub.test |
| Student | rahul@talenthub.test |
| Student | priya@talenthub.test |
| Student | arjun@talenthub.test |
| Student | sneha@talenthub.test |
| Student | kiran@talenthub.test |
| Company | abc@talenthub.test |
| Company | xyz@talenthub.test |

Students can also create their own accounts through the registration page.

> These are demonstration credentials intended for local testing, not production use.

## 8. Database Initialization and Reset

The SQLite database is stored at:

```text
data/talenthub.db
```

The database and initial demo data are created during the first application run.

To reset the database and restore the initial demo data:

```bash
npm run reset-db
```

Stop the server before resetting the database, then restart the application.

## 9. Key Highlights

- Role-based access for students, companies, and placement coordinators.
- Automated job eligibility verification.
- Centralized placement application management.
- Structured interview and offer management workflow.
- Placement analytics and statistics.
- Modular backend architecture.
- Persistent SQLite database.

## 10. Project Information

**Project Name:** TalentHub – Campus Placement Management System

**Application Type:** Full-Stack Web Application

**Backend:** Node.js and Express.js

**Database:** SQLite

**Frontend:** HTML, CSS, and JavaScript