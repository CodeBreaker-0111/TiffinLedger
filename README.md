# TiffinLedger

TiffinLedger is a full-stack application for home-style tiffin and lunch delivery businesses.

The main goal is simple:

> A customer should be billed only for the days on which the tiffin was actually served.

The app helps a tiffin owner manage customers, monthly subscriptions, pause/resume requests, deliveries, pro-rated bills and a few important operational workflows.

---

## 1. What problem does this solve?

In a normal tiffin service, a customer may subscribe to a monthly lunch plan.

For example:

- Monthly plan = ₹3,000
- Lunch is planned for weekdays
- Customer travels for a few days
- The service is paused during the trip
- Those paused days should not be charged

At the end of the month, the owner needs the correct bill based on the number of weekdays actually served.

TiffinLedger handles this process in one place.

### Basic billing rule

```text
Daily rate = Monthly plan price / Planned weekdays in the month

Final bill = Daily rate × Actual weekdays served
```

Saturday and Sunday are not treated as normal delivery days.

The application stores delivery records, so billing is based on actual service instead of only looking at the customer's current status.

---

# 2. What I built

The project is a full-stack product with:

- Real database persistence using Prisma + SQLite
- Owner registration and login
- Customer login and customer portal
- Monthly subscriptions
- Pause and resume lifecycle
- Actual delivery records
- Pro-rated month-end billing
- Search by name, phone and email
- Active / Paused / Ended customer status
- Pagination
- Sorting
- T1 morning notification clock
- `/outbox` notification view
- T6 mid-cycle subscription transfer
- T4 messy CSV import
- Import report with `imported`, `deduped` and `rejected`
- Landing page explaining the product
- REST APIs for the main operations

---

# 3. How the application works

## Owner flow

```text
Owner registers/logs in
        ↓
Creates a customer subscription
        ↓
Customer becomes ACTIVE
        ↓
Daily delivery is recorded
        ↓
Customer can be PAUSED
        ↓
Paused days are not served / not billed
        ↓
Customer can RESUME
        ↓
Actual deliveries continue
        ↓
Month-end bill is calculated
```

The owner can also:

- Search customers by phone/name/email
- Filter by status
- Sort customers
- Move through paginated results
- Run the daily notification clock
- View notification outbox
- Import customer data
- Transfer a subscription to another customer

---

# 4. Customer flow

A customer can have a customer account.

The customer portal shows:

- Current subscription status
- Monthly plan price
- Number of weekdays served this month
- Current bill
- Pause service
- Resume service

A seeded customer account is available for testing.

```text
Email:    priya@tiffin.local
Password: demo1234
```

---

# 5. Technology used

### Frontend

- Next.js
- React
- TypeScript
- CSS

### Backend

- Next.js App Router API routes
- REST-style API endpoints
- Zod validation

### Database

- SQLite
- Prisma ORM

### Authentication

- bcryptjs for password hashing
- Signed HTTP-only JWT session cookie
- Role-based access for owner and customer

---

# 6. Database design

The main database entities are:

### User

Stores owner and customer accounts.

Important fields:

- name
- email
- password hash
- role

Roles:

```text
OWNER
CUSTOMER
```

### Customer

Represents the person receiving tiffin.

Important fields:

- name
- phone
- email
- monthly plan price
- current status
- owner

Statuses:

```text
ACTIVE
PAUSED
ENDED
```

### Subscription

Represents the plan and billing cycle.

Stores:

- customer
- plan price
- cycle start
- cycle end
- status

Keeping subscriptions separate from customers is useful for subscription transfers.

### PausePeriod

Stores pause history:

- customer
- subscription
- pause start date
- pause end date

This means we do not lose historical pause information.

### Delivery

Stores actual service:

- customer
- subscription
- date
- served / not served

There is a unique constraint on:

```text
customer + date
```

so the same customer's day cannot be counted twice accidentally.

### SubscriptionTransfer

Stores T6 transfer history:

- subscription
- old customer
- new customer
- transfer date

### Notification

Stores T1 notification outbox entries:

- customer
- date
- message
- status

There is a unique constraint on:

```text
customer + date
```

which makes the clock operation idempotent.

---

# 7. T1 — Morning notification clock

The requirement is:

> Every morning, notify the customers who are due for delivery today.

The application implements this using:

```text
POST /clock
```

The clock:

1. Receives a date.
2. Checks whether the date is a weekday.
3. Finds active customers.
4. Removes customers who are paused on that date.
5. Creates notification records for the remaining customers.
6. Exposes them through `/outbox`.

This simulates a Notification Service.

### Example

```bash
curl -X POST http://localhost:3000/clock \
  -H "Content-Type: application/json" \
  -d '{"date":"2026-09-17"}'
```

Then open:

```text
http://localhost:3000/outbox
```

The same API is also available under:

```text
POST /api/clock
GET  /api/outbox
```

Using a date in the request makes the feature easy to test and deterministic.

---

# 8. T6 — Mid-cycle subscription transfer

A subscription can be transferred to another customer during its existing billing cycle.

Example:

```text
Customer A
₹3,000 monthly plan
1 Sep → 12 Sep
        ↓
Transfer
        ↓
Customer B
13 Sep → 30 Sep
```

The following things stay with the subscription:

- Plan price
- Billing cycle

The system also creates a transfer history record.

Past delivery rows stay attached to the customer who was actually served.

This allows customer-level historical billing instead of losing the original service history.

### Endpoint

```text
POST /api/subscriptions/:id/transfer
```

Example request:

```json
{
  "toCustomerId": "CUSTOMER_ID",
  "transferDate": "2026-09-17"
}
```

---

# 9. T4 — Messy customer import

The application also supports importing customer data from CSV text.

The importer handles:

- Duplicate phone numbers
- Duplicate rows inside the same file
- Existing phone numbers in the database
- Blank required fields
- Invalid plan values
- Common mixed date formats

Supported date examples:

```text
2026-09-17
2026/09/17
17/09/2026
17-09-2026
```

The import response includes:

```text
imported
deduped
rejected
```

and a line-level report.

### Example request

```http
POST /api/import/customers
Content-Type: application/json
```

Body:

```json
{
  "csv": "name,phone,planPrice,startDate\nRahul,9876543210,3000,01/09/2026\nRahul Duplicate,9876543210,3000,2026-09-01\nPriya,,2800,15-09-2026"
}
```

Possible result:

```json
{
  "imported": 1,
  "deduped": 1,
  "rejected": 1
}
```

---

# 10. Search, filtering, pagination and sorting

The owner dashboard supports server-side:

### Search

Searches:

- Customer name
- Phone
- Email

Example:

```text
GET /api/customers?q=9876543210
```

### Status filter

```text
ALL
ACTIVE
PAUSED
ENDED
```

### Sorting

Supported sort fields:

```text
name
phone
planPrice
status
createdAt
```

Both ascending and descending order are supported.

### Pagination

Example:

```text
GET /api/customers?page=1&limit=8
```

---

# 11. REST API endpoints

All protected endpoints require a valid login session.

## Authentication

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Register an owner |
| POST | `/api/auth/login` | Login owner or customer |
| POST | `/api/auth/logout` | Logout |

---

## Customers

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/customers` | Search, filter, sort and paginate customers |
| GET | `/api/customers/:id` | Get customer details |

### Customer list query parameters

```text
q
status
sort
order
page
limit
```

Example:

```text
GET /api/customers?q=rahul&status=ACTIVE&sort=name&order=asc&page=1&limit=8
```

---

## Subscriptions

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/subscriptions` | Create customer + subscription |
| POST | `/api/subscriptions/:id/pause` | Pause a subscription |
| POST | `/api/subscriptions/:id/resume` | Resume a subscription |
| POST | `/api/subscriptions/:id/transfer` | Transfer subscription to another customer |

---

## Billing

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/bills/:customerId?month=YYYY-MM` | Calculate a customer's bill |

Example:

```text
GET /api/bills/customer-id?month=2026-09
```

---

## Deliveries

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/deliveries?date=YYYY-MM-DD` | Get delivery list for a day |
| POST | `/api/deliveries` | Mark a delivery as served / not served |

---

## T1 clock and outbox

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/clock` | Process today's notification cycle |
| POST | `/api/clock` | Same operation |
| GET | `/outbox` | View notification outbox |
| GET | `/api/outbox` | Same outbox |

---

## Customer portal

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/customer/me` | Get logged-in customer |
| GET | `/api/customer/bill?month=YYYY-MM` | Get customer's current bill |
| POST | `/api/customer/pause` | Customer pauses own service |
| POST | `/api/customer/resume` | Customer resumes own service |

---

## T4 import

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/import/customers` | Import CSV data and return a report |

---

# 12. Project setup

## Requirements

Install:

- Node.js 20+
- npm
- Git

Node 24 is also fine.

---

## Clone the repository

```bash
git clone <your-github-repository-url>
cd tiffinflow
```

---

## Install dependencies

```bash
npm install
```

---

## Create environment file

Linux / Codespaces:

```bash
cp .env.example .env
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

The local environment should contain:

```env
DATABASE_URL="file:./dev.db"
AUTH_SECRET="change-this-to-a-long-random-secret"
```

For a real deployment, use a strong random value for `AUTH_SECRET`.

---

# 13. Setup the database

Generate the Prisma client:

```bash
npx prisma generate
```

Create/update the local database:

```bash
npx prisma db push
```

Seed demo data:

```bash
npm run db:seed
```

Expected seed output:

```text
Seed complete
Owner: owner@tiffin.local / demo1234
Customer: priya@tiffin.local / demo1234
```

---

# 14. Run the project

Start the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

In GitHub Codespaces, open the forwarded port `3000`.

---

# 15. Useful demo accounts

## Owner

```text
Email: owner@tiffin.local
Password: demo1234
```

## Customer

```text
Email: priya@tiffin.local
Password: demo1234
```

---

# 16. How to test the main flow

### Test 1 — Create a subscription

Login as owner and create:

```text
Name: Rahul Sharma
Phone: 9876500000
Plan: ₹3000
```

---

### Test 2 — Pause

Pause the customer.

The status should become:

```text
PAUSED
```

A pause history entry is created.

---

### Test 3 — Resume

Resume the same customer.

The status should become:

```text
ACTIVE
```

A previously open pause period is closed.

---

### Test 4 — Billing

Open the customer bill.

Check:

- Monthly plan
- Planned weekdays
- Delivered weekdays
- Daily rate
- Final amount

---

### Test 5 — Search

Search using:

```text
9876500000
```

The customer should appear.

---

### Test 6 — T1

Run:

```bash
curl -X POST http://localhost:3000/clock \
  -H "Content-Type: application/json" \
  -d '{"date":"2026-09-17"}'
```

Then:

```text
http://localhost:3000/outbox
```

---

### Test 7 — T4

Use the import section on the owner dashboard with:

```csv
name,phone,planPrice,startDate
Rahul,9876511111,3000,01/09/2026
Rahul Duplicate,9876511111,3000,2026-09-01
Priya,,2800,15-09-2026
```

Check that the response clearly separates:

```text
Imported
Deduped
Rejected
```

---

### Test 8 — T6

Create another customer and call:

```text
POST /api/subscriptions/:id/transfer
```

with the new customer ID and a transfer date inside the billing cycle.

---

# 17. Debugging

## Prisma cannot find schema

Check:

```bash
ls prisma/schema.prisma
```

Then run:

```bash
npx prisma generate
npx prisma db push
```

---

## Need a completely fresh local database

For development only:

```bash
npx prisma db push --force-reset
npm run db:seed
```

This resets the local SQLite database.

---

## Login is not working

Check:

```bash
cat .env
```

Make sure `AUTH_SECRET` exists.

Then restart:

```bash
npm run dev
```

If login still fails, open the browser developer tools:

```text
F12 → Network
```

and check:

```text
/api/auth/login
```

Also look at the Codespace terminal for server-side errors.

---

## Page is not loading after code changes

Stop the dev server:

```text
Ctrl + C
```

Then remove the Next.js cache:

```bash
rm -rf .next
```

Restart:

```bash
npm run dev
```

---

## Type checking

Run:

```bash
npm run typecheck
```

This checks the TypeScript code without starting the server.

---

# 18. Project structure

```text
app/
├── api/
│   ├── auth/
│   ├── bills/
│   ├── clock/
│   ├── customer/
│   ├── customers/
│   ├── deliveries/
│   ├── import/
│   ├── outbox/
│   └── subscriptions/
├── customer/
├── dashboard/
├── login/
├── register/
├── clock/
├── outbox/
├── globals.css
├── layout.tsx
└── page.tsx

components/
├── AuthForm.tsx
├── CustomerPortal.tsx
└── OwnerDashboard.tsx

lib/
├── auth.ts
├── billing.ts
├── dates.ts
└── prisma.ts

prisma/
├── schema.prisma
└── seed.ts

README.md
REASONING.md
AI_LOGS.md
package.json
```

---

# 19. Important implementation choices

### Delivery is the source of truth for billing

A customer being `ACTIVE` does not automatically mean they were served.

The billing system checks real delivery records.

This makes the billing rule safer and easier to extend later.

### Pause history is preserved

Instead of only storing a pause flag, the application keeps pause periods.

This gives us historical information and makes future reporting easier.

### Subscription is separate from customer

This makes T6 possible.

A subscription can move between customers while keeping its original plan and cycle.

### Notification outbox is stored

T1 is currently implemented as an outbox-based workflow instead of calling a real WhatsApp/SMS provider.

This makes the behavior easy to test and gives a clean integration point for a real notification service later.

---

# 20. Known limitations

This is a competition/demo-ready application, not a complete production billing platform.

Current limitations include:

- Local SQLite database
- Simple CSV parsing
- No real WhatsApp/SMS provider connected
- No online payment gateway
- No advanced role/permission system
- No automated scheduled worker for the morning clock
- No route optimization for delivery staff

These are intentional boundaries so the core subscription, pause/resume, billing, T1, T4 and T6 workflows stay clear and testable.

---

# 21. What I plan to build next

The next features I would build are:

### 1. WhatsApp bill delivery

After a bill is generated, the owner could send the bill directly to the customer's WhatsApp.

### 2. Online payments

Add payment links, payment status and monthly payment history.

### 3. Delivery route planning

Create a route for each day based on customer locations and delivery assignments.

### 4. Better delivery management

Add a daily delivery screen where the owner or delivery staff can mark:

```text
Delivered
Skipped
Not delivered
```

with a reason.

### 5. Production database

Move from SQLite to PostgreSQL for a hosted production environment.

### 6. Automated jobs

Run the morning notification clock automatically using a scheduled job instead of manually calling `/clock`.

---

# 22. Final product idea

TiffinLedger is designed around one simple rule:

> **Serve what is planned, record what actually happened, and bill only for what was actually served.**

The current version covers the core subscription lifecycle and the three problem twists while keeping the system small enough to understand, test and extend.
