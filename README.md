# TiffinLedger

TiffinLedger is a full-stack subscription and billing system for any home-style tiffin/lunch delivery business.

## Core rule

A customer gets a monthly weekday lunch plan, can pause/resume service, and is billed only for weekdays actually served.

```text
Daily rate = monthly plan price / planned weekdays in selected month
Bill = daily rate × actual served weekdays
```

Saturday and Sunday are not planned delivery days. `Delivery` records are the billing source of truth.

## Stack

Next.js App Router + TypeScript · Prisma · SQLite · REST APIs · bcrypt · HTTP-only JWT session cookie.

## Setup

```bash
npm install
cp .env.example .env
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Open `http://localhost:3000`.

Demo owner: `owner@tiffin.local` / `demo1234`

Demo customer: `priya@tiffin.local` / `demo1234`

## Endpoints

### Auth

- `POST /api/auth/register` — owner registration
- `POST /api/auth/login` — owner/customer login
- `POST /api/auth/logout` — logout

### Customers & subscriptions

- `GET /api/customers?q=&status=&sort=&order=&page=&limit=` — search/filter/sort/paginate
- `GET /api/customers/:id` — customer details
- `POST /api/subscriptions` — create a subscription/customer
- `POST /api/subscriptions/:id/pause` — pause
- `POST /api/subscriptions/:id/resume` — resume
- `POST /api/subscriptions/:id/transfer` — T6 mid-cycle transfer

### Billing

- `GET /api/bills/:customerId?month=YYYY-MM` — bill for selected month

### Deliveries

- `GET /api/deliveries?date=YYYY-MM-DD` — active customers and served status
- `POST /api/deliveries` — mark a day served/not served

### T1 notification clock

- `POST /clock` — deterministic morning processing; accepts `{ "date":"YYYY-MM-DD" }`
- `POST /api/clock` — same handler
- `GET /outbox` — notification outbox
- `GET /api/outbox` — same handler

`/clock` runs only on weekdays, selects active customers not paused on that date, and writes an idempotent notification per customer/date. Repeating the same clock date does not duplicate outbox rows.

### Customer portal

- `GET /api/customer/me`
- `GET /api/customer/bill?month=YYYY-MM`
- `POST /api/customer/pause`
- `POST /api/customer/resume`

### T4 messy import

- `POST /api/import/customers`

Body:

```json
{
  "csv":"name,phone,planPrice,startDate\nRahul,9876543210,3000,01/09/2026\nRahul duplicate,9876543210,3000,2026-09-01"
}
```

Response includes `imported`, `deduped`, `rejected`, `total` and a line-level report. Blank required values are rejected. Duplicate phone numbers are deduped. Common date formats are accepted.

## T6 transfer

```http
POST /api/subscriptions/:id/transfer
Content-Type: application/json

{
  "toCustomerId":"target-customer-id",
  "transferDate":"2026-09-17"
}
```

The subscription keeps the same plan and cycle. A `SubscriptionTransfer` row preserves the old/new customer and date. Existing delivery rows remain associated with the customer actually served, allowing billing to split by customer.

## UI

- Landing page — product positioning, audience, features and three next features.
- Owner dashboard — lifecycle actions, search, active/paused/ended status, sorting, pagination, bills, transfer, CSV import and T1 clock/outbox shortcut.
- Customer portal — own subscription status, bill and pause/resume.

## Debugging

If Prisma cannot find the schema:

```bash
ls prisma/schema.prisma
npx prisma generate
npx prisma db push
```

For a clean local database during development:

```bash
npx prisma db push --force-reset
npm run db:seed
```

If login sits on `Please wait…`, inspect the terminal for the API error and browser DevTools → Network → `/api/auth/login`. Restart `npm run dev` after changing `.env`.

## Evaluation checklist

1. Landing page.
2. Owner registration/login.
3. Add subscription.
4. Pause/resume.
5. Search by phone.
6. Active/paused status.
7. Sorting + pagination.
8. Month-end bill.
9. `POST /clock` then `GET /outbox`.
10. T6 transfer endpoint.
11. T4 messy CSV import and report.
12. Customer login and self-service pause/resume.

## Three next features

1. WhatsApp bill delivery.
2. Online payment links and reconciliation.
3. Delivery-route planning and driver assignment.
