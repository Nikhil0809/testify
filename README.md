# 🎓 Testify — Mini Online Test Platform (MERN)

A complete, premium examination platform built with **MongoDB, Express.js, React and Node.js**.
Students take timed 10-question MCQ tests with a server-authoritative timer, instant graded
results, detailed answer review and full attempt history. Admins manage the question bank and
monitor students.

---

## ✨ Features

**Authentication**
- Student signup/login (name, email, password) with bcrypt hashing and JWT
- Protected routes, role-based access (student / admin), logout

**Student Dashboard**
- Personalized greeting, total attempts, average score, best score
- Start / resume test, view history, recent activity feed

**Online Test**
- 10 random MCQs sampled from MongoDB (`$sample`), 4 options each
- 10-minute countdown driven by **backend `startTime` / `expiryTime` timestamps** — survives refresh
- Previous / Next navigation + question palette (desktop sidebar, mobile bottom sheet)
- Answered / Unanswered / Review status indicators, progress bar
- Debounced automatic answer saving, save-on-tab-hide, save indicator
- Submission confirmation modal and **auto-submit when the timer hits zero**

**Results**
- Score /10, percentage, correct / incorrect / unanswered counts
- Question-wise review showing *your answer* vs *correct answer* + explanation
- Animated circular score ring and per-subject performance bars
- Filter review by correct / incorrect / skipped

**Test History**
- Only the logged-in student's attempts
- Sort (newest, oldest, best, worst) and filter (status, score band)
- Responsive table on desktop, cards on mobile, one-click view of any result

**Admin (bonus)**
- Admin login + protected dashboard with platform statistics
- Create / edit / delete MCQs with correct answer, subject, difficulty, active toggle
- Search + subject filter + pagination
- Student list with attempts, average and best scores

**Security**
- Correct answers are **never** sent to the client before submission
- Scores computed exclusively on the backend
- Server-side expiry enforcement, duplicate submission prevention
- Ownership verification on every attempt, no trust in client timer/score

---

## 📁 Project Structure

```
├── client/                     # React + Vite
│   ├── index.html
│   ├── tailwind.config.js
│   └── src/
│       ├── components/         # Loader, Skeletons, Modal, States, ProgressRing…
│       ├── pages/              # Login, Signup, Dashboard, Test, Result, History, admin/
│       ├── layouts/            # AuthLayout, DashboardLayout (collapsible sidebar)
│       ├── hooks/              # useTimer, useDocumentTitle
│       ├── context/            # AuthContext
│       ├── services/           # api (axios), authService, testService, adminService
│       └── utils/              # helpers (formatting, tones, greeting)
└── server/                     # Node + Express
    ├── server.js
    ├── config/                 # db connection
    ├── models/                 # User, Question, TestAttempt
    ├── controllers/            # auth, test, admin
    ├── routes/                 # auth, tests, admin
    ├── middleware/             # auth (JWT + admin), validation, error handler
    ├── seed/                   # 35 sample MCQs + seeder + admin user
    └── utils/                  # ApiError, asyncHandler
```

---

## 🚀 Installation

### Prerequisites
- Node.js 18+
- MongoDB **Atlas account** (or a local MongoDB instance)

### 1. Backend

```bash
cd server
npm install
```

Create `.env` from the example:

```bash
cp .env.example .env
```

```env
MONGO_URI=mongodb+srv://USER:PASS@cluster0.mongodb.net/mini_test?retryWrites=true&w=majority
JWT_SECRET=a_long_random_string_at_least_32_chars
PORT=5000
CLIENT_URL=http://localhost:5173
```

Seed the database (35 MCQs + admin account):

```bash
npm run seed          # add questions/admin if missing
npm run seed -- --wipe  # ⚠️ wipe and reseed everything
```

Start the server:

```bash
npm run dev           # auto-reload
# or
npm start
```

> **No MongoDB yet?** For local development without Atlas or a local install, the repo can boot an
> in-memory MongoDB: `npm run dev:memory` (requires the `mongodb-memory-server` dev dependency).

### 2. Frontend

```bash
cd client
npm install
```

Create `.env`:

```bash
cp .env.example .env
```

```env
VITE_API_URL=http://localhost:5000/api
```

Start the dev server:

```bash
npm run dev
```

App runs at **http://localhost:5173**, API at **http://localhost:5000/api**.

---

## 🔑 Default Accounts (created by seed)

| Role   | Email            | Password |
| ------ | ---------------- | -------- |
| Admin  | `admin@test.com` | `admin123` |

Students register themselves at `/signup`.

---

## 📡 API Reference

| Method | Endpoint                    | Auth  | Description |
| ------ | --------------------------- | ----- | ----------- |
| POST   | `/api/auth/register`        | —     | Student signup |
| POST   | `/api/auth/login`           | —     | Login, returns JWT |
| GET    | `/api/auth/me`              | JWT   | Current user |
| GET    | `/api/tests/dashboard`      | JWT   | Stats + recent attempts |
| POST   | `/api/tests/start`          | JWT   | Start **or resume** a test |
| GET    | `/api/tests/active`         | JWT   | Current in-progress attempt |
| PUT    | `/api/tests/:id/answers`    | JWT   | Save answers (auto-save) |
| POST   | `/api/tests/:id/submit`     | JWT   | Manual / auto submission |
| GET    | `/api/tests/:id/result`     | JWT   | Graded result + review |
| GET    | `/api/tests/history`        | JWT   | Own attempts (sort/filter) |
| GET    | `/api/admin/questions`      | Admin | Paginated question bank |
| POST   | `/api/admin/questions`      | Admin | Create question |
| PUT    | `/api/admin/questions/:id`  | Admin | Update question |
| DELETE | `/api/admin/questions/:id`  | Admin | Delete question |
| GET    | `/api/admin/students`       | Admin | Students + stats |
| GET    | `/api/admin/stats`          | Admin | Platform analytics |

---

## 🧪 Testing checklist

1. Sign up → dashboard shows `0` attempts with empty states
2. **Start Test** → 10 questions, timer at `10:00`
3. Refresh the page mid-test → timer continues from the same remaining time
4. Answer a few questions → "Saved hh:mm:ss" indicator updates
5. Mark a question for review → palette turns amber
6. Close the tab → reopen → answers restored
7. Submit → confirmation modal → result shows score, review, explanations
8. History lists the attempt with date/score/percentage; sort & filter work
9. Leave a test until 0:00 → auto-submits, status shows `expired`
10. Login as admin → manage questions, view students and statistics

---

## 🛠 Tech Stack

| Layer      | Tech |
| ---------- | ---- |
| Frontend   | React 18, Vite, Tailwind CSS, React Router, Axios, Framer Motion, Lucide, react-hot-toast |
| Backend    | Node.js, Express, express-validator |
| Database   | MongoDB Atlas + Mongoose |
| Auth       | JWT + bcryptjs |
| Styling    | Glassmorphism, dark navy + violet/blue accents, Inter / Plus Jakarta Sans |

---

## 📜 Scripts

**Server**
| Command | Description |
| ------- | ----------- |
| `npm run dev` | Start with auto-reload |
| `npm start` | Production start |
| `npm run seed` | Seed questions + admin (add `-- --wipe` to reset) |
| `npm run dev:memory` | Start with an in-memory MongoDB (no install needed) |

**Client**
| Command | Description |
| ------- | ----------- |
| `npm run dev` | Dev server on :5173 |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the production build |
