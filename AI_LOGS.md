# AI_LOGS

This file records the AI-assisted development work used in this project. It is kept as a development log rather than a marketing description.

## Requirements review

**Developer request**

Build a full-stack tiffin owner product where customers subscribe monthly, can pause/resume, and are billed only for days actually served. Include database, REST APIs, UI, authentication, search, landing page, pagination and sorting.

**AI assistance used**

Recommended separating `Customer`, `Subscription`, `PausePeriod` and `Delivery`. Billing should use actual delivery records instead of relying only on the current status flag.

## T1 review

**Developer request**

Implement the morning notification twist. Evaluation will call `POST /clock` and inspect `/outbox`.

**AI assistance used**

Make the clock deterministic with an optional date. On weekdays, select active customers not paused on that date and create an idempotent notification keyed by customer/date.

## T6 review

**Developer request**

Transfer a subscription mid-cycle. The plan and cycle must carry over and billing should split according to which customer was served.

**AI assistance used**

Keep the subscription/cycle separate from the customer. Add a transfer history table and never rewrite existing delivery records.

## T4 review

**Developer request**

Import messy customer data with duplicate phones, mixed date formats and blanks, with imported/deduped/rejected reporting.

**AI assistance used**

Normalize common phone formatting, parse several date styles, dedupe against both the uploaded file and database, and return per-line status/reason.

## Customer portal review

**Developer request**

Add a customer-facing flow so customers can view status/billing and pause or resume their service.

**AI assistance used**

Use role-based sessions, link optional customer accounts to a subscription, and expose customer-scoped endpoints for profile, bill, pause and resume.

## Debugging note from development

A previous Prisma setup failed because `schema.prisma` was not at `prisma/schema.prisma`. The final repository keeps that exact path and the README includes the repair commands.

## Final review

The implementation was checked against the stated requirements: persistence, REST endpoints, owner and customer authentication, subscription lifecycle, pro-rated billing, search, pagination, sorting, landing page, T1 clock/outbox, T6 transfer and T4 import reporting.
