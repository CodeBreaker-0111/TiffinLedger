# REASONING

## Business invariant

The product is built around one invariant: a customer is billed only for service actually delivered.

## Domain model

`Customer` represents the person. `Subscription` represents a plan and billing cycle. `PausePeriod` preserves pause history. `Delivery` is the actual service event and drives billing. `SubscriptionTransfer` preserves T6 hand-offs. `Notification` is the T1 outbox.

## Why Delivery is the billing source

An ACTIVE status says the subscription is currently active; it does not prove that lunch was actually served on every historical weekday. Counting served `Delivery` rows avoids charging paused or unserved days and gives an auditable trail.

## T1

`POST /clock` accepts an explicit date so the evaluator can control the day. The handler rejects weekends, filters active customers, checks pause periods, and creates one notification per customer/date. The unique constraint makes repeated clock calls idempotent.

## T6

Transfer moves the current subscription to a new customer and records a transfer history row. The plan price and cycle dates remain unchanged. Existing delivery rows are not rewritten, so the customer who received service keeps the service history used for billing.

## T4

The import path is intentionally report-oriented. Each row becomes imported, deduped, or rejected. Phone numbers are normalized enough for common messy input, duplicate phones are caught within the file and against the DB, and several common date formats are accepted.

## Authentication and authorization

Passwords are hashed with bcrypt. An HTTP-only JWT cookie identifies the session. Owner routes are scoped by `ownerId`; customer routes are scoped by the linked customer account.

## Search/pagination/sorting

Search is server-side across name/phone/email. Pagination uses database skip/take. Sorting is restricted to an allow-list.

## Testing checklist

Run:

```bash
npm install
npx prisma generate
npx prisma db push
npm run db:seed
npm run typecheck
npm run dev
```

Then verify owner registration/login, add subscription, pause/resume, bill, search, sort, pagination, `/clock`, `/outbox`, T6 transfer, T4 import, and customer portal.

## Practical production follow-ups

The local implementation uses SQLite to keep setup simple for a competition/Codespace. Production can move to PostgreSQL, add a real CSV parser for quoted commas, move notification delivery to a queue/provider, and add audit logging/payment reconciliation.
