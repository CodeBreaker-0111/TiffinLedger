# Reasoning

## Goal

The main requirement is not a generic CRM. The important business rule is:

> A customer must be billed only for weekdays on which the tiffin was actually served.

I therefore treated subscription, pause/resume and delivery records as first-class data instead of calculating a bill from the customer's current status alone.

## Main design decisions

### 1. SQLite + Prisma

SQLite keeps the project easy to run in a Codespace without requiring a separate database server. Prisma gives a clear schema and migrations/push workflow.

For a production deployment I would move the datasource to PostgreSQL.

### 2. Pause history instead of a single pause flag

The customer has an `ACTIVE`/`PAUSED` status for the dashboard, but every pause is also stored in `PausePeriod`.

That means the system can answer historical questions later, such as when a customer was paused during a particular month.

### 3. Delivery records drive billing

The billing function counts `Delivery` rows with `served=true` inside the selected month.

This is deliberate. A status such as ACTIVE is not enough to prove that lunch was delivered. Delivery records make the billing rule explicit.

### 4. Weekdays are the planned service days

The example business says lunch is delivered every weekday. Therefore Saturday and Sunday are excluded from the planned weekday count.

The formula is:

```text
monthly price / planned weekdays × delivered weekdays
```

The resulting amount is rounded to the nearest rupee.

### 5. Ownership and authentication

Every customer belongs to a `User`. API routes first resolve the authenticated owner and then scope customer queries to that owner.

Passwords are hashed with bcrypt and the login session is stored in an HTTP-only cookie.

## Testing and fixes

I tested the core flows mentally and through the API/UI structure while building:

1. Registration should reject invalid input.
2. Duplicate email should return a conflict.
3. Login should reject a wrong password.
4. Customer creation validates name, phone and positive plan price.
5. Duplicate customer phone is rejected.
6. Pause changes status to `PAUSED`, creates a pause period and removes today's delivery if it was created before pausing.
7. Resume closes the open pause period and restores today's delivery when today is a weekday.
8. Billing only uses deliveries belonging to the requested customer and month.
9. Search checks both name and phone.
10. Pagination is server-side using `skip` and `take`.
11. Sorting is restricted to an allow-list rather than accepting an arbitrary database field.
12. API routes return `401` when the owner session is missing.

## Important edge cases

- A paused customer has no new delivery recorded while paused.
- A resume on a weekend does not create a delivery.
- A customer can have multiple pause periods.
- Duplicate delivery rows are prevented with a composite unique constraint.
- A month with no weekdays is handled without dividing by zero.

## One practical improvement I would make next

For a real business, I would add an explicit daily delivery screen where the owner can mark each customer as delivered/not delivered. That would make the `Delivery` table a direct representation of the kitchen/delivery operation rather than relying on automatic records.

## AI assistance

AI assistance was used for implementation help, debugging ideas and documentation structure. The final project decisions, business rule interpretation and integration/testing should be reviewed by the developer before submission.
