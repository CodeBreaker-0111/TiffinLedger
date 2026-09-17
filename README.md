# TiffinLedger

A small full-stack billing app for home-style tiffin/lunch delivery businesses.

## What it solves

A customer subscribes to a monthly weekday lunch plan. When the customer pauses service for travel, festivals, etc., those paused weekdays should not be billed.

TiffinLedger stores customers, subscriptions, pause periods and served deliveries. The month-end bill is calculated from actual served weekdays.

**Billing formula**

`Daily rate = Monthly plan price / number of weekdays in the selected month`

`Bill = Daily rate × weekdays actually delivered`

Example: ₹3,000 plan / 22 weekdays = ₹136.36/day. If 18 weekdays were served, the bill is ₹2,455 after rounding.

## Stack

- Next.js App Router + TypeScript
- Prisma ORM
- SQLite database for simple real persistence
- REST API routes
- bcrypt password hashing
- HTTP-only JWT session cookie
- React UI

## Requirements

- Node.js 20+ (Node 24 works)
- npm

## Setup

```bash
git clone <your-public-repository-url>
cd tiffin-billing-app
npm install
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Set a real `AUTH_SECRET` in `.env`.

Create the database:

```bash
npx prisma generate
npx prisma db push
npm run db:seed
```

Run:

```bash
npm run dev
```

Open `http://localhost:3000`.

Demo login after seeding:

- Email: `owner@tiffin.local`
- Password: `demo1234`

## REST API endpoints

All customer/billing endpoints require the login session cookie.

### Authentication

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Register owner |
| POST | `/api/auth/login` | Login owner |
| POST | `/api/auth/logout` | Logout |

### Customers

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/customers?q=&status=&sort=&order=&page=&limit=` | Search, filter, sort and paginate customers |
| POST | `/api/customers` | Create a subscription/customer |
| POST | `/api/customers/:id/pause` | Pause a customer |
| POST | `/api/customers/:id/resume` | Resume a customer |

### Billing

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/bills/:id?month=YYYY-MM` | Calculate month-end pro-rated bill |

## Search, pagination and sorting

The customer list supports:

- Search by customer name or phone
- Status filter: ALL / ACTIVE / PAUSED
- Sorting by name, plan price, status or creation date
- Ascending/descending order
- Server-side pagination

Example:

```text
GET /api/customers?q=9876&status=ACTIVE&sort=name&order=asc&page=1&limit=8
```

## Data model

- `User` — owner account
- `Customer` — subscriber and monthly plan
- `PausePeriod` — pause/resume history
- `Delivery` — actual served weekday records

A delivery is unique per customer/date, so duplicate service entries cannot accidentally double-count a day.

## Debugging

If Prisma says it cannot find the schema, verify this file exists:

```text
prisma/schema.prisma
```

Then run:

```bash
npx prisma generate
npx prisma db push
```

If the database gets into a bad local state during development:

```bash
rm prisma/dev.db
npx prisma db push
npm run db:seed
```

PowerShell:

```powershell
Remove-Item prisma/dev.db
npx prisma db push
npm run db:seed
```

If login stops working, confirm `.env` contains `AUTH_SECRET`, restart `npm run dev`, and log in again.

## Evaluation flow

1. Register or use the demo owner.
2. Add a customer with a monthly plan.
3. Pause the customer.
4. Resume the customer.
5. Search by phone/name.
6. Open **Bill** to see delivered weekdays, daily rate and final amount.
7. Change status, sorting and page controls.

## Three next features

1. WhatsApp bill generation and delivery.
2. Online payment links and payment tracking.
3. Delivery-route planning with daily delivery status.

## Project structure

```text
app/
  api/
    auth/
    bills/
    customers/
  dashboard/
  login/
  register/
components/
lib/
prisma/
```
