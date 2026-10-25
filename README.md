# Multi-School Fee Management SaaS

Prepared by Ali Raza | Version 1.0

## 1. Project Overview

Multi-School Fee Management SaaS is a cloud-based web application that lets many
schools manage student fees on one platform. Each school gets its own private
workspace where it can register students, define fee structures, generate
monthly fee vouchers, record payments, print receipts, track defaulters and
view financial reports. A super admin manages all schools, subscriptions and
platform settings. Parents can log in to see their child's fee status and
download vouchers.

## 2. Problem Statement

Many small and medium schools still manage fees using registers or Excel
sheets. This causes calculation mistakes, lost receipts, unclear dues, delayed
reports and no easy way to follow up with parents. Existing school software is
often expensive or too complex for small schools. This project provides a
simple, affordable and ready-to-use fee system on a subscription model.

## 3. Objectives

- Allow multiple schools to use one system with fully separated data (multi-tenancy).
- Automate monthly fee voucher generation for all students.
- Record payments (full, partial, advance) and issue printable receipts.
- Track pending dues, fines and discounts automatically.
- Provide clear reports for the school owner and accountant.
- Give parents online access to fee status and vouchers.
- Provide a subscription plan system for schools.

## 4. Scope

In scope: school registration, role-based access, student and class
management, fee structures, voucher and receipt generation, payment recording,
discounts and fines, defaulter list, reports, parent portal, super admin panel,
subscription plans.

Out of scope (future work): online payment gateway integration, SMS and
WhatsApp automation, payroll, timetable and exam modules, mobile app.

## 5. User Roles

| Role | Description | Main permissions |
|---|---|---|
| Super Admin | Platform owner | Manage schools, plans, platform statistics |
| School Admin | Principal or owner | Full access to own school, settings, reports |
| Accountant | Fee clerk | Record payments, print vouchers and receipts, view dues |
| Parent | Guardian of a student | View child's fee status, download vouchers and receipts |

## 6. Features

### 6.1 School management (Super Admin)
Register and activate or suspend schools, create subscription plans (for
example by number of students), view platform statistics: schools, students,
monthly collection.

### 6.2 Academic setup (School Admin)
Create classes and sections, add students individually or import from Excel
(CSV), link siblings to one parent account for family discounts.

### 6.3 Fee management
Fee heads: tuition, admission, exam, transport, lab, annual charges. Fee
structure per class. Discounts (sibling, scholarship, staff child) and late
fines. Monthly vouchers for a whole class or the whole school in one click.
Previous dues carried forward automatically.

### 6.4 Payments and receipts
Cash, bank transfer, JazzCash or Easypaisa payments recorded manually.
Partial and advance payments supported. Auto-generated numbered PDF receipt.
Payment reversal with an audit trail (never deleted).

### 6.5 Reports and follow-up
Daily, monthly and yearly collection reports, defaulter list with amount due
and months pending, class-wise and head-wise income summary, export to Excel
and PDF.

### 6.6 Parent portal
Login with registered phone or email, view fee history, current dues and
payment status, download vouchers and receipts.

## 7. Languages and Technologies Used

### 7.1 Programming and markup languages

| Language | Where it is used |
|---|---|
| TypeScript | Frontend (React) and backend (Node.js) |
| JavaScript | Configuration files and small scripts |
| SQL | PostgreSQL database queries and migrations |
| HTML5 | Page structure through React JSX and voucher templates |
| CSS3 / Tailwind CSS | Styling, responsive layout, print styles for vouchers |
| JSON | API data and configuration |
| Markdown | README and documentation |

### 7.2 Frameworks and libraries

| Layer | Technology |
|---|---|
| Frontend | React, Vite, React Router, Tailwind CSS |
| Data fetching | Axios (TanStack Query is a documented next step; v1 uses plain Axios services) |
| Backend | Node.js, Express.js |
| Database | PostgreSQL (production) |
| ORM | Prisma ORM (schema in `server/prisma/schema.prisma`) |
| Authentication | JWT, bcrypt, role-based access control |
| Validation and security | Helmet, CORS, role checks (Zod validation is a documented next step; v1 validates required fields in routes) |
| PDF and Excel | PDFKit (PDF), ExcelJS (Excel export), CSV import |
| Testing | Node assertions for fee maths, API smoke tests |
| Tools | Git, GitHub, Postman, Prisma Studio, VS Code |
| Deployment | Vercel (frontend), Render or Railway (backend), Neon or Supabase (PostgreSQL) |

## 8. System Architecture

Client-server architecture with a shared database and logical separation of
each school's data (multi-tenancy).

1. Client (React): role-based screens for admin, accountant and parent.
2. API (Express): REST endpoints, authentication, validation and role checks.
3. Tenant middleware: reads the school ID from the user's token and attaches
   it to every query so a school can never see another school's data.
4. Service layer: fee calculation, voucher generation, payment logic.
5. Database (PostgreSQL via Prisma): one database, every table has a
   `school_id` column.
6. File generation: PDF receipts and vouchers, Excel exports.

Multi-tenancy approach: shared database with a `school_id` on every tenant
table. Simple, cheap and suitable for small and medium schools.

## 9. Fee Calculation Logic

For each student and month:

1. Start with the sum of fee heads applicable to the student's class.
2. Subtract discounts (sibling, scholarship, custom).
3. Add previous unpaid balance (arrears).
4. Add late fine if the due date has passed.
5. The result is the payable amount on the voucher.

When a payment is recorded: balance = payable amount minus total paid. If the
balance is greater than zero the voucher is marked Partial, if it is zero it
is marked Paid, and any extra amount is stored as advance for the next month.

## 10. Database Design

- `schools`: id, name, address, phone, plan_id, status, created_at
- `users`: id, school_id (null for super admin), name, email or phone,
  password_hash, role, created_at
- `classes`: id, school_id, name, section
- `students`: id, school_id, class_id, parent_id, name, roll_no,
  admission_date, status
- `parents`: id, school_id, name, phone, email, address
- `fee_heads`: id, school_id, name, type (monthly or one-time)
- `fee_structures`: id, school_id, class_id, fee_head_id, amount
- `discounts`: id, school_id, student_id, type, amount or percentage, reason
- `vouchers`: id, school_id, student_id, month, year, total_amount, discount,
  fine, arrears, payable, paid, status, due_date
- `payments`: id, school_id, voucher_id, amount, method, reference_no,
  received_by, paid_at, is_reversed
- `plans`: id, name, max_students, price

Relationships: a school has many classes, students and users; a parent has
many students; a student has many vouchers; a voucher has many payments.

## 11. API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| POST | /api/auth/login | Login and receive a JWT |
| GET | /api/schools | List schools (super admin) |
| POST | /api/schools | Register a school |
| GET / POST | /api/classes | List or create classes |
| GET / POST | /api/students | List or add students |
| POST | /api/students/import | Import students from CSV |
| GET / POST | /api/fee-structures | Manage fee structures |
| POST | /api/vouchers/generate | Generate monthly vouchers |
| GET | /api/vouchers/:id/pdf | Download voucher PDF |
| POST | /api/payments | Record a payment |
| GET | /api/payments/:id/receipt | Download receipt PDF |
| POST | /api/payments/:id/reverse | Reverse a payment (audit trail, never deleted) |
| GET | /api/reports/defaulters | Defaulter list |
| GET | /api/reports/collection | Collection report by date range |
| GET | /api/reports/collection/export | Export collection to Excel |
| GET | /api/parent/children | Parent portal: children and dues |

## 12. Folder Structure

```
school-fee-saas/
  README.md
  client/
    src/
      components/   (Sidebar, DataTable, VoucherPreview, ReceiptPreview)
      pages/        (Login, Dashboard, Students, Classes, FeeSetup, Vouchers, Payments, Reports, ParentPortal, SuperAdmin)
      hooks/        (useAuth, useStudents, useVouchers)
      context/      (AuthContext)
      services/     (api.ts)
      routes/       (ProtectedRoute.tsx, RoleRoute.tsx)
  server/
    prisma/         (schema.prisma, seed.ts)
    src/
      index.ts
      db.ts         (local SQLite adapter — see Demo notes)
      middleware/   (auth.ts, tenant.ts, errorHandler.ts)
      routes/       (api.ts)
      services/     (feeCalculator.ts, voucherService.ts, pdfService.ts)
    tests/          (run-tests.js)
```

## 13. User Interface Pages

Login, Dashboard (today's collection, monthly collection, pending dues,
defaulters count, chart totals), Students (searchable table, add and import),
Fee Setup, Vouchers (generate, view and print), Payments (search student,
record payment, print receipt), Reports (collection, defaulters, income
summaries with export), Parent Portal, Super Admin (schools, plans, platform
statistics).

## 14. Security Considerations

- Hash passwords with bcrypt and protect routes with JWT.
- Enforce role-based access on every endpoint.
- Always filter queries by `school_id` from the token, never from user input.
- Validate required input; use parameterized queries to prevent SQL injection.
- Keep an audit log of payment creation and reversal.
- Do not delete payments; mark them as reversed.
- Use HTTPS, Helmet and restricted CORS.
- Take regular database backups.

## 15. Testing Plan

- Unit tests: fee calculation, fines, discounts and advance handling
  (`server/tests/run-tests.js`, 6 assertions).
- API tests: health, login, student creation, voucher generation, payment,
  voucher PDF, receipt PDF, collection and defaulter reports (smoke-tested
  locally, see below).
- Tenant isolation tests: School A cannot list School B students and gets
  404 for a School B voucher PDF (verified locally).
- UI tests: voucher generation and payment flow (not yet run — see Demo notes).
- Print tests: voucher and receipt layout on A4 and half-page (PDFs are
  generated with PDFKit on A4; layout not print-tested on paper).

## 16. Setup Guide

Prerequisites: Node.js 20 or later, PostgreSQL for production (optional for
the local demo), Git.

Server (local demo):

1. Go to the server folder and run `npm install`.
2. Copy `.env.example` to `.env` (SQLite file by default).
3. Run `npm run build`, then `npx ts-node prisma/seed.ts` for demo data.
4. Run `npm start` (port 4000 by default).

Server (production, where Prisma engine download works):

1. Set `DATABASE_URL` to your PostgreSQL URL and change the Prisma provider
   to `postgresql` in `server/prisma/schema.prisma`.
2. Run `npx prisma generate && npx prisma db push`.
3. Run `npm run build` and `npm start`.

Client:

1. Go to the client folder and run `npm install`.
2. Create a `.env` file with `VITE_API_URL` (default
   `http://localhost:4000/api`).
3. Run `npm run dev` (port 5173) or `npm run build` for production.

Demo logins (DEMO ONLY, seeded by `prisma/seed.ts`):
`admin@demo.local / demo123` (school admin),
`accountant@demo.local / demo123`,
`super@demo.local / demo123` (super admin).

## 17. Deployment

- Frontend on Vercel.
- Backend on Render or Railway.
- PostgreSQL on Neon or Supabase.
- Add the live link and GitHub repository to the README and CV.

## 18. Subscription Plans (Example)

| Plan | Students | Suggested monthly price (PKR) |
|---|---|---|
| Starter | Up to 200 | 3,000 |
| Standard | Up to 600 | 6,000 |
| Premium | Up to 1,500 | 10,000 |

Prices are only an example and can be changed after market research.

## 19. Development Timeline

Weeks 1–8 as in the v1 documentation: requirements and database design;
authentication, roles, tenant middleware, school and class management;
students and CSV import; fee heads, structures, discounts and fines; voucher
generation and PDF output; payments, receipts and reversals; reports,
dashboard and parent portal; testing, deployment and documentation.

## 20. Limitations

- Payments are recorded manually; there is no online gateway in version 1.
- No SMS or WhatsApp reminders in version 1.
- Shared-database multi-tenancy needs careful query filtering (enforced by
  the tenant middleware in this code).
- Print layout has not been tested on paper.

## 21. Future Improvements

- JazzCash, Easypaisa and bank payment gateway integration.
- WhatsApp and SMS fee reminders to parents.
- Mobile app for parents.
- Staff salary and expense module.
- Urdu language interface.
- Attendance and exam result modules.

## 22. Conclusion

Multi-School Fee Management SaaS solves a real problem for schools by
replacing registers and Excel sheets with an accurate, organized and
affordable system. It demonstrates multi-tenant architecture, role-based
access, PostgreSQL with Prisma, PDF generation and a subscription business
model, which makes it a strong portfolio project and a realistic product
idea.

## Demo notes (read before showing this to anyone)

- **Prisma engine limitation in this VM:** `npx prisma generate` fails here
  because the Prisma query-engine binary cannot be downloaded from
  `binaries.prisma.sh` (network ECONNRESET, retried several times). The
  Prisma schema in `server/prisma/schema.prisma` is the authoritative,
  production data layer. For the local demo, `server/src/db.ts` implements
  the same tables and the same method names used by the routes on top of
  Node's built-in SQLite, so the API, tests and demo all run end-to-end
  here. In an environment where the engine download works, replace that
  file with a real Prisma client and run `npx prisma generate &&
  npx prisma db push` — no route code changes are needed.
- **Database:** locally SQLite (same schema shape); live PostgreSQL was
  NOT tested. Use Neon/Supabase Postgres for production.
- **Not verified:** live deployment (Vercel/Render), browser UI
  click-through, UI unit tests, paper print tests. The client was
  build-verified and the server API was smoke-tested (see Testing).
- **No real data:** demo schools and users are generic (Demo School A/B)
  and labelled DEMO ONLY. Do not add real school names, students or
  contact details to this project.
- **No online payments, SMS or WhatsApp in v1** — payments are recorded
  manually, as in the documentation.
