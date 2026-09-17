# AI_LOGS

This file records the AI-assisted development work used in this project. It is kept as a development log rather than a marketing description.

I need to build a full-stack tiffin billing application.
The business flow is simple: customers subscribe to a monthly weekday lunch plan, they can pause the service for a few days, and at month-end they should be billed only for the days actually served.
The project needs a real database, REST APIs, registration and login, search, pagination and sorting, a usable UI, a one-page landing page, README.md, REASONING.md and AI_LOGS.md.
There are also three additional requirements:

T1: Every morning, notify customers due a delivery today through /clock and expose the generated notifications through /outbox.
T6: Transfer a subscription to another customer during the current cycle while keeping the plan and cycle and splitting billing based on who was actually served.
T4: Import messy customer data containing duplicate phones, mixed date formats and blanks and return an imported/deduped/rejected report.
Please help me design this in a practical way without making it unnecessarily complicated.

A clean way to structure this is around a subscription lifecycle instead of treating the system as just a customer directory.
The core flow can be:

Subscribe → Active → Pause / Resume → Actual Delivery → Month-end Bill

I would separate the main database concepts into User, Customer, Subscription, PausePeriod, and Delivery. For the extra requirements, add SubscriptionTransfer and Notification.

The most important business rule should use actual delivery records for billing:

Daily Rate = Monthly Plan Price / Planned Weekdays

Final Bill = Daily Rate × Actual Delivered Weekdays

That keeps paused and unserved days out of the final amount.

I want billing to depend on actual delivered days, not just the current customer status.

That is the safer approach. ACTIVE only tells us that the subscription is available. It does not prove that a lunch was actually delivered.

Use a Delivery table and count only served delivery rows inside the selected billing month.
For example:

Monthly Plan = ₹3000

Planned Weekdays = 22

Delivered Days = 18

Daily Rate = ₹3000 / 22

Bill = Daily Rate × 18

Saturday and Sunday should not be counted as planned delivery days.

The owner is the main user, but customers should also be able to see their subscription and bill and pause/resume their own service.

Use two roles: OWNER and CUSTOMER.

The owner can manage customers, subscriptions, deliveries, imports, and billing.

The customer should only be able to access their own profile, subscription, and bill.

Passwords can be hashed with bcrypt and authentication can use an HTTP-only session cookie. That gives the owner full operational control while keeping a simple customer-facing portal.

The T1 requirement says the system should notify active customers who are due for delivery today, only on weekdays and only if they are not paused. The evaluator will call POST /clock and inspect /outbox.

Make /clock deterministic by allowing a date to be supplied.

The flow can be:
POST /clock → Check weekday → Find active customers → Exclude paused customers → Create notification records → GET /outbox

A request such as:

JSON
{
  "date": "2026-09-17"
}
makes the behavior easy to test. A unique customer + date constraint on notifications will also prevent duplicates if the clock is triggered more than once for the same date.

For T6, the subscription can move to another customer during the current cycle. The plan and cycle should remain the same, but the billing should still reflect who was served before and after the transfer.

Keep Subscription separate from Customer and record transfers explicitly.

When a transfer happens:

Keep the existing plan price.

Keep the existing billing cycle.

Store the previous customer and the new customer.

Store the transfer date.

Keep previous delivery records attached to the customer who actually received the service.

A SubscriptionTransfer record makes the history clear and gives you a clean place to extend the feature later.

For T4, the import can contain duplicate phone numbers, blank fields and dates in different formats. I need imported, deduped and rejected counts plus a useful report.

Process every row separately and classify it into one of three outcomes:

Imported

Deduped

Rejected

The importer should:

Validate the customer name.

Normalize the phone number.

Validate the plan price.

Parse common date formats.

Detect duplicate phones inside the uploaded data and check whether the phone already exists in the database.

Reject incomplete or invalid rows and return a line-level report.

That gives the owner a clear result instead of silently dropping bad rows.

Search should mainly work by phone because that is how the owner looks customers up, but I also want name/email search, filtering, sorting and pagination.

Use server-side query parameters such as:
?q=&status=&sort=&order=&page=&limit=

Search can cover phone, name, and email.

Status filters can be: ALL, ACTIVE, PAUSED, ENDED.

Sorting should use an allow-list such as: name, phone, planPrice, status, createdAt.

Pagination can use database skip/take so the frontend does not need to load the whole customer table.

I also want a customer portal, but I do not want to overcomplicate it.

Keep the customer portal small. It only needs to show:

Current subscription status

Monthly plan & served days

Current bill

Pause/Resume service toggles

The owner dashboard can remain the main operational interface. This keeps the user experience focused on the actual business workflow.

I was setting this up in GitHub Codespaces and accidentally placed the project ZIP inside the application source folder.

The ZIP should not stay inside the application source tree. After extraction, the repository root should contain the actual project folders (app/, components/, lib/, prisma/, public/).

Remove the ZIP afterwards. This keeps the Next.js source tree clean and avoids unnecessary files being scanned by the development server.

Prisma previously gave me an error saying that it could not find the schema.

The schema should be located at prisma/schema.prisma.

Then run:

Bash
npx prisma generate
npx prisma db push
Also make sure .env contains a valid database URL. For SQLite:
DATABASE_URL="file:./dev.db"

If the local database needs to be rebuilt during development:

Bash
npx prisma db push --force-reset
npm run db:seed
The login page stayed on "Please wait..." for a long time. How should I debug this?

Check the request path instead of changing the UI first.

The flow is:
Browser → /api/auth/login → Authentication → Prisma → Database

Open browser developer tools and check: F12 → Network → /api/auth/login.
Also inspect the server terminal for errors.

Verify:

.env exists and AUTH_SECRET is set.

Prisma client is generated (npx prisma generate).

Database exists (dev.db).

Development server was restarted after environment changes.

This separates frontend, API, and database issues quickly.

I want the final documentation to explain what I built, how it works, how to run it, all API endpoints, the main design decisions and what I would build next.

The README.md should include:

What the product solves & main workflow

Technology stack & Database structure

T1, T4, and T6 behavior implementation

Setup, run, and debugging commands + demo accounts

Complete API endpoint list with search, sorting, and pagination

Current limitations and future improvements

The REASONING.md can focus on why the data model was chosen, why delivery records are used for billing, how the three twists are handled, and what was tested and fixed.

I want the project to stay practical for a small tiffin business. What should I keep as the main idea?

Keep the system centered around one simple rule:

Store what is planned, record what actually happened, and bill only for what was actually served.

The main lifecycle stays:
Subscribe → Pause / Resume → Record Delivery → Calculate Bill

Then the additional requirements sit naturally around it:

T1 → Notification Clock / Outbox

T4 → Messy Customer Import

T6 → Subscription Transfer

This keeps the application easy to understand while leaving room for future features like WhatsApp notifications, online payments, and route planning.

What should I test before submitting?

Test the complete user flows, not only the screens.

The main checklist is:

Owner registration & login/logout

Customer login

Create subscription & duplicate phone validation

Pause & Resume toggles

Search by phone, status filtering, sorting, pagination

Month-end bill generation

T1 clock on weekday vs. weekend & duplicate T1 clock calls

T6 subscription transfer execution

T4 CSV import with duplicate/invalid row handling

Customer self-service pause/resume

Also confirm that .env, node_modules, .next, and the local dev.db file are not committed to GitHub.
