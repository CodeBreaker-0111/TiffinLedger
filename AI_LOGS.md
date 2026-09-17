# AI Logs

> This file records the AI-assisted development used for this project. It is intentionally kept focused on development assistance rather than presenting AI output as the author of the project.

## Session 1 — Project requirements

**Developer prompt**

I need to build a full-stack tiffin billing product. Customers subscribe to a monthly weekday lunch plan, can pause/resume service, and should be billed only for days actually served. The project needs a database, REST APIs, usable UI, authentication, search, pagination/sorting, landing page, README, reasoning notes and AI logs.

**AI assistance**

Suggested a simple architecture using Next.js, TypeScript, Prisma and SQLite, with `User`, `Customer`, `PausePeriod` and `Delivery` tables. Recommended making actual delivery records the source for billing rather than only checking the customer's current status.

## Session 2 — Prisma setup

**Developer prompt**

Prisma says it cannot find the schema.

**AI assistance**

The Prisma schema should be located at:

```text
prisma/schema.prisma
```

Then run:

```bash
npx prisma generate
npx prisma db push
```

Also verify `DATABASE_URL` exists in `.env`.

## Session 3 — Billing logic

**Developer prompt**

How should the pro-rated bill work when a customer pauses for a few weekdays?

**AI assistance**

Use the selected month's weekday count as the denominator and actual served weekdays as the numerator:

```text
daily rate = monthly plan / weekdays in month
bill = daily rate × served weekdays
```

Store delivery records so billing is based on actual service.

## Session 4 — API and UI

**Developer prompt**

The evaluation requires REST APIs, authentication, search, pagination and sorting.

**AI assistance**

Suggested API routes for registration/login, customer CRUD-style operations, pause/resume and bill calculation. Suggested server-side search/filter/sort/pagination to keep the API useful independently of the UI.

## Developer review

The implementation was reviewed around the core business rule, data ownership, validation and the required evaluation flow. AI suggestions were used as development assistance and were adapted into the project rather than copied as an unexplained generated application.
