# Library Management System


- **Frontend:** React + Vite (JavaScript / JSX), React Router, Fetch API, hand written flat CSS
- **Backend:** Node.js + Express REST API, JWT authentication, bcrypt password hashing
- **Database:** PostgreSQL (hosted on Neon) accessed through Prisma ORM

Everything the assignment asks for is implemented: dashboard, book management, stock
(availability) management, transactions, user management, role based access control and a
seeded default administrator.

## Table of contents

1. [Features](#1-features)
2. [Technology stack](#2-technology-stack)
3. [Project structure](#3-project-structure)
4. [Prerequisites](#4-prerequisites)
5. [Setting up the Neon PostgreSQL database](#5-setting-up-the-neon-postgresql-database)
6. [Running the backend](#6-running-the-backend)
7. [Running the frontend](#7-running-the-frontend)
8. [Default administrator login](#8-default-administrator-login)
9. [API documentation](#9-api-documentation)
10. [Database design](#10-database-design)
11. [Business rules](#11-business-rules)
12. [Security notes](#12-security-notes)
13. [Pushing to GitHub](#13-pushing-to-github)
14. [Troubleshooting](#14-troubleshooting)

## 1. Features

**Dashboard**

- Total books, total copies available, registered users, borrowed books.
- Number of books with low stock (fewer than 2 copies available) and a warning banner.
- Recent transactions table.
- Full table of every book with its quantities.
- Books with fewer than 2 copies available are highlighted (low stock / out of stock).

**Book management (administrators)**

- Add, view, edit and delete books.
- Search by title, author or ISBN and filter by genre.
- Every book has an ID, title, author, genre, ISBN, quantity and available quantity.
- Duplicate ISBN numbers are rejected with a clear message.

**Availability / stock management (administrators)**

- Add stock when deliveries arrive.
- Stock is deducted automatically when a book is borrowed.
- Stock is increased automatically when a book is returned.
- Negative stock is impossible; a book with no available copies cannot be borrowed.
- Every stock change writes a transaction record inside a database transaction, so the
  stock numbers and the ledger always stay consistent.

**Transactions (administrators)**

- Borrow, return and add-stock actions in one form.
- Full transaction history with type (BORROW / RETURN / STOCK_ADDITION), book, user,
  quantity, date, status and notes.
- Searchable and filterable history table.

**User management (administrators)**

- Register, view, edit and delete users, and assign the ADMIN or USER role.
- Search by name or membership ID.
- View any member's borrowing history and how many copies they currently have on loan.
- Duplicate membership IDs and email addresses are rejected.
- Users with transaction history are protected from deletion.

**Authentication and authorisation**

- Login with email and password, bcrypt hashed passwords, JWT sessions.
- Protected backend routes and protected React routes.
- Only administrators can reach book management, stock management and user management.
- Users are redirected according to their role after login, and can log out from the
  sidebar or the navbar.

---

## 2. Technology stack

| Layer      | Technology                                                          |
| ---------- | ------------------------------------------------------------------- |
| Frontend   | React 18, Vite, React Router DOM, Fetch API, plain CSS              |
| Backend    | Node.js, Express, CORS, express.json(), JSON Web Tokens, bcryptjs   |
| Database   | PostgreSQL on Neon                                                  |
| ORM        | Prisma (schema, migrations, seed)                                   |

> **Note on bcrypt:** the project uses [`bcryptjs`](https://www.npmjs.com/package/bcryptjs),
> which is the pure JavaScript implementation of bcrypt with the same API. It is used
> instead of the native `bcrypt` package because it installs without a C++ build toolchain
> on Windows (no `node-gyp` errors). The algorithm and the hashed output are identical.

---

## 3. Project structure

```
managment/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma         # Books, Users, Transactions models
│   │   ├── migrations/           # Generated SQL migrations
│   │   └── seed.js               # Creates the default administrator
│   ├── src/
│   │   ├── config/prisma.js      # Shared PrismaClient instance
│   │   ├── controllers/          # auth, book, transaction, user, dashboard
│   │   ├── middleware/           # JWT auth + central error handler
│   │   ├── routes/               # REST route definitions
│   │   ├── utils/                # ApiError, asyncHandler, validators
│   │   ├── app.js                # Express app (CORS, JSON, routes)
│   │   └── server.js             # Entry point, connects to PostgreSQL
│   ├── .env
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/client.js         # Fetch wrapper used by every page
│   │   ├── components/           # Navbar, Dashboard, BookList, forms...
│   │   ├── context/              # AuthContext (JWT + user), ToastContext
│   │   ├── pages/                # Login, Books, Transactions, Users...
│   │   ├── utils/                # formatting helpers, genre list
│   │   ├── App.jsx               # Route table
│   │   ├── index.css             # Flat teal / blue design system (top navbar)
│   │   └── main.jsx
│   ├── .env.example
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── .gitignore
└── README.md
```

---

## 4. Prerequisites

- [Node.js](https://nodejs.org/) 18 or newer (includes `npm`)
- A free [Neon](https://neon.tech/) account
- Git (only needed to push the project to GitHub)

Check your versions:

```bash
node -v
npm -v
```

---

## 5. Setting up the Neon PostgreSQL database

Neon is PostgreSQL in the cloud, so nothing needs to be installed locally.

1. Create a free account at <https://neon.tech/> and create a new project
   (for example `library-management`).
2. In the Neon dashboard open your project and click **Connect**.
3. Copy the **connection string**. It looks like this:

   ```
   postgresql://neondb_owner:AbC123xyz@ep-cool-name-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

   If Neon offers a choice, use the **direct** connection (not the pooled `-pooler` host),
   because Prisma migrations work best against the direct connection.

4. Make sure the URL ends with `?sslmode=require` (Neon requires TLS).

You do **not** need to create the tables by hand. Prisma creates the `users`, `books` and
`transactions` tables from `backend/prisma/schema.prisma`.

---

## 5. Running the backend

Open a terminal in the project folder.

```bash
# 1. Go into the backend folder
cd backend

# 2. Install dependencies
npm install

# 3. Create your environment file
#    Windows PowerShell:
Copy-Item .env.example .env
#    macOS / Linux:
#    cp .env.example .env
```

Now open `backend/.env` and fill it in:

```env
DATABASE_URL="postgresql://neondb_owner:YOUR-PASSWORD@YOUR-NEON-HOST/neondb?sslmode=require"
JWT_SECRET="paste-a-long-random-string-here"
JWT_EXPIRES_IN="1d"
PORT=4000
CLIENT_ORIGIN="http://localhost:5173"
```

To generate a good `JWT_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

> `.env` is listed in `.gitignore`, so your database password and JWT secret are never
> committed to GitHub. Only `.env.example` (with placeholder values) is committed.

Next, create the database tables and the default administrator:

```bash
# 4. Generate the Prisma client
npx prisma generate

# 5. Create and apply the migrations (creates the tables)
npx prisma migrate dev --name init

# 6. Seed the default administrator account
npx prisma db seed
```

If step 5 reports that it cannot create a **shadow database** on Neon, use these two
commands instead:

```bash
npx prisma migrate dev --name init --create-only   # writes the migration file
npx prisma migrate deploy                          # applies it to Neon
npx prisma db seed
```

Finally, start the API:

```bash
npm run dev     # auto restarts on file changes
# or
npm start
```

You should see:

```
Connected to the PostgreSQL database
Library API is running on http://localhost:4000/api
```

Verify it in a browser or with curl:

```
http://localhost:4000/api/health
```

Optional: browse your data visually with `npx prisma studio`.

---

## 7. Running the frontend

Open a **second** terminal.

```bash
cd frontend

# Install dependencies
npm install

# Optional: only needed if your API is not on http://localhost:4000/api
Copy-Item .env.example .env

npm run dev
```

Vite prints a local URL, normally <http://localhost:5173>. Open it and sign in.

The frontend reads the API location from `VITE_API_URL` (default `http://localhost:4000/api`).

---

## 8. Default administrator login

The seed script creates one administrator:

| Field         | Value                |
| ------------- | -------------------- |
| Email         | `admin@library.com`  |
| Password      | `Admin@123`          |
| Membership ID | `LIB-ADMIN-001`      |
| Role          | `ADMIN`              |

**You must change this password after your first sign in.** The account is flagged with
`mustChangePassword = true`, so the app automatically redirects you to the
**Change Password** page and will not let you use anything else until the password has
been changed.

The login screen also displays these starting credentials for convenience during a
demonstration. Remove that block from
`frontend/src/pages/LoginPage.jsx` if you would rather not show them.

---

## 9. API documentation

Base URL: `http://localhost:4000/api`

Send the JWT on protected routes as a header: `Authorization: Bearer <token>`.

### Authentication

| Method | Endpoint                 | Access        | Description                                      |
| ------ | ------------------------ | ------------- | ------------------------------------------------ |
| POST   | `/auth/login`            | Public        | Body `{ email, password }` - returns token + user |
| POST   | `/auth/register`         | Public        | Self registration, always creates a `USER`        |
| GET    | `/auth/me`               | Signed in     | Returns the account behind the token              |
| POST   | `/auth/change-password`  | Signed in     | Body `{ currentPassword, newPassword }`           |

### Dashboard

| Method | Endpoint     | Access    | Description                                                    |
| ------ | ------------ | --------- | -------------------------------------------------------------- |
| GET    | `/dashboard` | Signed in | Totals, low stock books, recent transactions and the book table |

### Books

| Method | Endpoint         | Access     | Description                                 |
| ------ | ---------------- | ---------- | ------------------------------------------- |
| GET    | `/books`         | Signed in  | `?search=` matches title/author/ISBN, `?genre=` filters |
| GET    | `/books/genres`  | Signed in  | Distinct genre list for the filter dropdown |
| GET    | `/books/:id`     | Signed in  | A single book                               |
| POST   | `/books`         | Admin      | Body `{ title, author, genre, isbn, quantity }` |
| PUT    | `/books/:id`     | Admin      | Updates a book; available is recalculated   |
| DELETE | `/books/:id`     | Admin      | Blocked when transaction history exists     |

### Transactions

| Method | Endpoint                | Access     | Description                                            |
| ------ | ----------------------- | ---------- | ------------------------------------------------------ |
| GET    | `/transactions`         | Signed in  | `?search=`, `?type=BORROW\|RETURN\|STOCK_ADDITION`      |
| GET    | `/transactions/:id`     | Signed in  | A single transaction                                   |
| POST   | `/transactions/borrow`  | Admin      | Body `{ bookId, userId, quantity }` - reduces stock     |
| POST   | `/transactions/return`  | Admin      | Body `{ bookId, userId, quantity }` - increases stock   |
| POST   | `/transactions/stock`   | Admin      | Body `{ bookId, quantity, note? }` - adds new stock     |

### Users

| Method | Endpoint     | Access | Description                                                          |
| ------ | ------------ | ------ | -------------------------------------------------------------------- |
| GET    | `/users`     | Admin  | `?search=` matches name/membership ID/email, `?role=ADMIN\|USER`      |
| GET    | `/users/:id` | Admin  | A single user                                                        |
| GET    | `/users/:id/transactions` | Admin | One member's borrowing history plus an outstanding-copies summary |
| POST   | `/users`     | Admin  | Body `{ fullName, membershipId, email, password, role }`              |
| PUT    | `/users/:id` | Admin  | Updates a user; `password` is optional                               |
| DELETE | `/users/:id` | Admin  | Blocked for your own account, the last admin, and users with history  |

### Misc

| Method | Endpoint   | Access | Description          |
| ------ | ---------- | ------ | -------------------- |
| GET    | `/health`  | Public | API liveness check   |

### Response format

Success responses return the resource, for example:

```json
{ "count": 2, "books": [ { "id": 1, "title": "Clean Code", "available": 3, "...": "..." } ] }
```

Errors always look like:

```json
{ "message": "A book with ISBN \"978-0132350884\" already exists" }
```

HTTP status codes used: `200`, `201`, `400` (validation), `401` (not signed in),
`403` (not an administrator), `404` (not found), `409` (conflict / protected record),
`500` (unexpected server error).

---

## 10. Database design

The Prisma models in `backend/prisma/schema.prisma` map to three PostgreSQL tables. The
database itself is what tracks **stock levels** and **borrowing history**; the API only
reads and writes through it.

### `books` - stock levels

| Column      | Type          | Purpose                                           |
| ----------- | ------------- | ------------------------------------------------- |
| `id`        | serial PK     | Book identifier                                   |
| `title`     | text          | Title                                             |
| `author`    | text          | Author                                            |
| `genre`     | text          | Genre                                             |
| `isbn`      | text UQ       | Unique ISBN                                       |
| `quantity`  | int           | **Total copies owned** (stock level)              |
| `available` | int           | **Copies currently on the shelf** (current stock) |
| `createdAt`, `updatedAt` | timestamp | Audit timestamps                     |

`quantity` and `available` are the live stock levels. They are never edited by hand:
every borrow, return or delivery adjusts them inside a database transaction, so they can
never drift out of sync with the ledger.

### `transactions` - borrowing history

| Column      | Type        | Purpose                                 |
| ----------- | ----------- | --------------------------------------- |
| `id`        | serial PK   | Ledger row                              |
| `type`      | enum        | `BORROW`, `RETURN` or `STOCK_ADDITION`  |
| `status`    | enum        | `COMPLETED`, `PENDING` or `CANCELLED`   |
| `quantity`  | int         | Copies moved                            |
| `bookId`    | FK to books | Which book moved                        |
| `userId`    | FK to users | Which member (or admin, for deliveries) |
| `note`      | text (null) | Optional remark                         |
| `createdAt` | timestamp   | When it happened                        |

This table **is** the borrowing history. Rows are never deleted (the foreign keys use
`onDelete: Restrict`), so the record of who borrowed what, and when, is kept forever.
A member's copies currently on loan are derived from it as
`SUM(BORROW) - SUM(RETURN)` - exactly what `GET /api/users/:id/transactions` returns.

### `users`

Members and administrators (`role` = `ADMIN` / `USER`) with unique `email` and
`membershipId`. `password` stores only the bcrypt hash.

### Relationships

- `users 1 -> many transactions` and `books 1 -> many transactions`.
- Deleting a book or a user that appears in the ledger is rejected, which preserves the
  borrowing history and keeps the stock figures explainable.

---

## 11. Business rules

- A book cannot be borrowed when `available` is 0, and `available` can never go negative.
- Borrowing decreases `available`, returning increases it, adding stock increases both
  `quantity` and `available`.
- Returning is limited to the copies that member actually has outstanding.
- Every one of those actions writes a transaction row in the same database transaction
  (`prisma.$transaction`), so the stock numbers and the ledger cannot disagree.
- Editing a book's total quantity adjusts `available` by the same difference and refuses to
  go below the number of copies currently on loan.
- Books and users that appear in the ledger cannot be hard deleted, which keeps the
  transaction history intact.
- The last administrator account cannot be deleted or demoted.

---

## 11. Security notes

- Passwords are hashed with bcrypt (10 salt rounds) and never returned by the API.
- JWTs are signed with `JWT_SECRET` from the environment; no secret is hardcoded.
- `DATABASE_URL` and `JWT_SECRET` live in `.env`, which is git-ignored.
- Every administrator route is protected twice: the React router hides the pages and the
  Express middleware (`requireAdmin`) rejects the request.
- Login failures return the same message for a wrong email and a wrong password, so the
  API does not reveal which accounts exist.

---

## 12. Pushing to GitHub

```bash
git init
git add .
git commit -m "Library Management System: React + Express + Prisma + PostgreSQL"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
git push -u origin main
```

Before pushing, confirm that `backend/.env` and `frontend/.env` are **not** staged
(`git status`). The included `.gitignore` excludes them, along with `node_modules`.

---

## 14. Troubleshooting

| Problem | Fix |
| --- | --- |
| `[DATABASE_URL is missing]` when starting the backend | You have not created `backend/.env` yet, or the variable is misspelled. |
| `[Could not connect to PostgreSQL]` | Check the connection string, keep `?sslmode=require`, and confirm the Neon project is awake. |
| `P1001: Can't reach database server` | Wrong host/port, or your network blocks the connection. |
| `Cannot reach the server. Is the backend running on port 4000?` | Start the backend, or fix `VITE_API_URL`. |
| CORS error in the browser console | Make sure `CLIENT_ORIGIN` in `backend/.env` matches the Vite URL (default `http://localhost:5173`). |
| `Can't create a shadow database` during `prisma migrate dev` | Use `--create-only` + `prisma migrate deploy`, as shown in section 6. |
| A book/user will not delete | It has transaction history on purpose. Keep it, or remove the related transactions first. |
| `npm install` fails on Windows for bcrypt | This project uses `bcryptjs`, so no native build is needed. Delete `node_modules` and reinstall. |

---

## npm scripts reference

**backend**

| Script                  | What it does                                   |
| ----------------------- | ---------------------------------------------- |
| `npm run dev`           | Start the API with auto restart                |
| `npm start`             | Start the API normally                         |
| `npm run prisma:generate` | Regenerate the Prisma client                 |
| `npm run prisma:migrate`  | Create and apply a development migration     |
| `npm run prisma:deploy`   | Apply committed migrations (production style) |
| `npm run prisma:studio`   | Open Prisma Studio                             |
| `npm run seed`          | Run the seed script                            |

**frontend**

| Script            | What it does                        |
| ----------------- | ----------------------------------- |
| `npm run dev`     | Start the Vite dev server           |
| `npm run build`   | Build the production bundle         |
| `npm run preview` | Serve the built bundle locally      |
