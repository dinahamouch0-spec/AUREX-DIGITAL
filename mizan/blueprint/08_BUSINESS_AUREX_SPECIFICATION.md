# MIZAN — BUSINESS / AUREX Specification
Version: 1.0

## 1. Purpose
A private business operations workspace for the owner's ventures, including AUREX. It is not the customer-facing AUREX website or CRM service product.

## 2. Projects management
Project profile:
- name, description, status
- phase and milestones
- tasks and deadlines
- client link
- budget and currency
- costs/revenue links
- risks/notes
- progress and archive

## 3. CRM / clients
Client records:
- person/company name
- contact details (private)
- lead source
- status/category
- interaction timeline
- notes
- follow-up date
- linked deals/projects
- relationship history

Never send messages automatically. Drafting and sending require explicit user action and a connected service with appropriate permission.

## 4. Sales pipeline
Configurable stages, e.g.:
- New lead
- Contacted
- Discovery
- Proposal
- Negotiation
- Won
- Lost

Each deal:
- client
- title
- expected value and currency
- stage
- probability (optional, user-set or evidence-based)
- expected close date
- follow-up
- lost reason
- quotation/proposal reference

Forecasts must distinguish weighted pipeline estimates from cash received.

## 5. Finance and cash flow
Track:
- income and expenses
- project/client association
- invoices
- partial payments
- outstanding receivables
- budgets
- cash flow
- profit/loss
- USD and LBP with explicit currency per transaction

Never add unlike currencies without a disclosed exchange rate and conversion timestamp. Distinguish:
- cash received
- accounts receivable
- planned/forecast revenue
- expenses paid
- unpaid liabilities

Use decimal-safe money representation. No direct bank transactions or investment execution in v1.

## 6. Tasks and productivity
Tasks support priority, subtasks, due dates, estimate/actual time, recurring schedule, project/client/deal links, status, history, and workload summaries.

## 7. Goals and growth
Goals may include:
- revenue target
- first client target
- active projects
- conversion rate
- delivery quality
- growth milestones

User sets targets. AI can suggest milestones but cannot approve or change them.

## 8. Business intelligence
Dashboard:
- active projects
- leads by stage
- deal pipeline
- revenue received
- outstanding invoices
- expenses
- cash position (based only on entered records)
- task deadlines
- trends and forecasts with confidence labels

Lost-deal analysis and lead-source analytics only when enough data exists.

## 9. Notifications and automation
Support reminders and user-defined rules. External actions (email, client messages, invoices) require explicit review/approval. Include automation history and failure states.

## 10. Privacy and acceptance
Client contact and financial records are highly sensitive. Apply strict RLS, no public sharing, no plaintext secrets, audit sensitive actions, export/delete. Verify financial arithmetic with tests, including partial payments, refunds/adjustments, currencies, and date boundaries.
