# Ethara Project Tracker (Admin/Member RBAC)

Full-stack web app where users can create projects, assign tasks, and track progress with role-based access control.

## Features

- Authentication with JWT (`signup` / `login`)
- Role-based access (`ADMIN`, `MEMBER`)
- Project management (create/list/view + add members)
- Task management (create/list/update status/assignment)
- Dashboard stats (all/todo/in-progress/done/overdue)
- Validation using `zod`
- Relational SQL database using Prisma + PostgreSQL
- Railway-ready deployment config

## Tech Stack

- Node.js + Express
- Prisma ORM
- PostgreSQL
- Vanilla HTML/CSS/JS frontend (served by Express)

## RBAC Rules

- **Admin**
  - Can create projects
  - Can add members to projects
  - Can create tasks and update all task fields
  - Can view all data
- **Member**
  - Can view projects/tasks where they are involved
  - Can update only the status of tasks assigned to them

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env` from `.env.example` and update values:

```env
PORT=4000
JWT_SECRET=your-strong-secret
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ethara_db?schema=public
```

3. Generate Prisma client + sync schema:

```bash
npm run prisma:generate
npm run prisma:push
```

4. Start app:

```bash
npm run dev
```

Open: `http://localhost:4000`

## REST API Overview

### Auth
- `POST /api/auth/signup`
- `POST /api/auth/login`

### Projects
- `GET /api/projects`
- `POST /api/projects` (Admin)
- `GET /api/projects/:id`
- `POST /api/projects/:id/members` (Admin)

### Tasks
- `GET /api/tasks`
- `POST /api/tasks` (Admin)
- `PATCH /api/tasks/:id` (Admin: all fields, Member: own task status only)

### Dashboard
- `GET /api/dashboard`

### Health
- `GET /api/health`

## Railway Deployment

1. Push project to GitHub.
2. Create new Railway project and link the GitHub repo.
3. Add a PostgreSQL service in Railway.
4. Set environment variables in Railway:
   - `DATABASE_URL` (from Railway PostgreSQL)
   - `JWT_SECRET` (strong secret)
   - `PORT` (Railway usually injects this automatically)
5. Deploy.  
   `railway.json` runs:
   - `npm run prisma:migrate`
   - `npm start`
6. Open generated Railway public URL.

## Submission Checklist

- Live URL: `ADD_YOUR_RAILWAY_URL_HERE`
- GitHub Repo: `ADD_YOUR_GITHUB_REPO_URL_HERE`
- README: included in this repo
- 2-5 min Demo Video: `ADD_YOUR_VIDEO_LINK_HERE`

## Demo Flow Suggestion (2-5 min)

1. Signup/Login as Admin.
2. Create project and add members.
3. Create and assign tasks with due dates.
4. Login as Member and update assigned task status.
5. Show dashboard counts and overdue tracking.
6. Show live deployed Railway URL.
