# REASONING.md

## 1. Understanding the Problem

The main requirement was to build a tiffin management system where customers are billed only for the weekdays on which they were actually served.

I treated this as a subscription lifecycle instead of only maintaining a customer list.

The basic flow is:

```text
Subscribe
   ↓
Active
   ↓
Pause / Resume
   ↓
Actual Delivery
   ↓
Month-end Bill
```

The owner is the main user of the application. A small customer portal is also included so customers can view their subscription, bill and pause/resume their service.

---

## 2. Main Design Approach

I separated the important parts of the system into different database models.

- User handles owner and customer authentication.
- Customer stores customer information.
- Subscription stores the monthly plan and billing cycle.
- PausePeriod stores pause history.
- Delivery stores the actual food delivery.
- SubscriptionTransfer handles mid-cycle subscription transfer.
- Notification stores the T1 notification outbox.

This structure keeps the business rules separate and makes the application easier to maintain and extend.

---

## 3. Billing Logic

The most important decision was to use actual delivery records as the source of truth for billing.

I did not calculate the bill only from the current customer status because an ACTIVE customer does not always mean that food was actually delivered.

The billing formula is:

```text
Daily Rate = Monthly Plan Price / Planned Weekdays

Final Bill = Daily Rate × Actual Delivered Weekdays
```

Saturday and Sunday are not counted as normal delivery days.

For example:

```text
Monthly Plan = ₹3000
Planned Weekdays = 22
Delivered Days = 18

Daily Rate = 3000 / 22
Final Bill = Daily Rate × 18
```

This automatically prevents paused or unserved weekdays from being charged.

---

## 4. T1 - Morning Notification

For the T1 requirement, I added a `/clock` endpoint.

The clock checks:

1. Whether the selected date is a weekday.
2. Which customers are currently active.
3. Which customers are not paused on that date.
4. Creates one notification for each eligible customer.

The generated notifications are stored in the database and can be viewed through `/outbox`.

I also added a unique customer/date constraint so running the clock multiple times for the same date does not create duplicate notifications.

The date can be passed to the endpoint so that the feature can be tested with a fixed date instead of depending only on the current system date.

---

## 5. T6 - Subscription Transfer

For the transfer requirement, I kept Subscription separate from Customer.

When a subscription is transferred to another customer:

- The plan price stays the same.
- The billing cycle stays the same.
- A transfer history record is created.
- Existing deliveries remain connected to the customer who was actually served.

This makes it possible to understand who received the service before and after the transfer and keeps the billing history clear.

---

## 6. T4 - Messy Customer Import

The import feature was designed to handle common data problems.

The importer checks for:

- Duplicate phone numbers
- Duplicate rows inside the same file
- Phone numbers that already exist in the database
- Missing customer names
- Missing phone numbers
- Missing or invalid plan prices
- Invalid dates
- Different common date formats

Every imported row gets one of three results:

```text
Imported
Deduped
Rejected
```

The API also returns a line-level report so the owner can understand why a particular row was accepted or rejected.

---

## 7. Authentication and Security

The application has two roles:

```text
OWNER
CUSTOMER
```

Owners can manage customers, subscriptions, deliveries, imports and billing.

Customers can only access their own profile, subscription and bill.

Passwords are hashed using bcrypt and authentication uses an HTTP-only session cookie.

Owner API requests are also scoped to the logged-in owner so that one owner cannot access another owner's customer data.

---

## 8. Search, Sorting and Pagination

The customer dashboard supports server-side search, sorting and pagination.

Search can be done using:

- Customer name
- Phone number
- Email

Customers can also be filtered using:

```text
ALL
ACTIVE
PAUSED
ENDED
```

Sorting is available by fields such as:

```text
Name
Phone
Plan Price
Status
Created Date
```

Pagination is handled on the server so the frontend does not need to load the full customer list at once.

---

## 9. Testing Approach

I tested the application around the actual business flows rather than only checking individual pages.

The main test cases were:

- Owner registration
- Owner login and logout
- Customer login
- Creating a subscription
- Duplicate phone validation
- Pause and resume
- Search by phone
- Status filtering
- Sorting
- Pagination
- Month-end billing
- T1 clock on a weekday
- T1 clock on a weekend
- Running the clock twice for the same date
- Subscription transfer
- CSV import
- Duplicate import records
- Invalid import records
- Customer self-service pause/resume

Seed data was also added so the main flows can be tested quickly after setting up the project.

---

## 10. Issues Found and Fixed

### Prisma Schema Issue

At one stage Prisma could not find the Prisma schema.

The problem was related to the schema location.

I fixed this by keeping the schema at:

```text
prisma/schema.prisma
```

and using:

```bash
npx prisma generate
npx prisma db push
```

---

### Login Loading Issue

When login remained on the `Please wait...` state, I checked the complete request flow instead of changing the UI directly.

The flow was checked as:

```text
Browser
   ↓
/api/auth/login
   ↓
Authentication
   ↓
Prisma
   ↓
Database
```

This helped identify whether the problem was coming from the frontend, API or database.

---

### Project Structure Issue

While updating the Codespace, the project ZIP was accidentally placed inside the source directories.

This could cause Next.js to scan unnecessary binary files and create build warnings.

I fixed it by removing the ZIP files from the project source and keeping only the extracted application files in the repository root.

The final structure is:

```text
app/
components/
lib/
prisma/
public/
```

---

## 11. Why This Structure Was Chosen

The application is intentionally simple enough for a small tiffin business but still separates the important business concepts.

The most important idea behind the solution is:

> Store what is planned, record what actually happened, and calculate the bill from the actual service history.

This makes the core billing logic reliable and also provides a clean foundation for the T1, T4 and T6 requirements.

---

## 12. Future Improvements

The current solution covers the main requirements and the three additional problem twists.

The next features I would build are:

1. Real WhatsApp or SMS integration for the notification outbox.
2. Online payment links and payment history.
3. A dedicated daily delivery screen for delivery staff.
4. Automated scheduled jobs instead of manually triggering `/clock`.
5. PostgreSQL for production deployment.
6. Delivery route planning and driver assignment.
7. Better reporting for monthly revenue, pending payments and customer history.
