
# Phase 3: Future Enhancements Implementation

## Overview

This plan implements the two optional features identified in the subscription system:
1. **Upcoming Delivery Reminder Email** - Automated reminder sent 3 days before delivery
2. **Subscription Edit Capability** - Allow modifying items, frequency, and delivery details after creation

---

## Feature 1: Upcoming Delivery Reminder Email

### What It Does
Sends customers an email reminder 3 days before their scheduled delivery, confirming what will be delivered and when.

### Implementation

#### 1.1 New Edge Function: `send-upcoming-delivery-reminder`

Create `supabase/functions/send-upcoming-delivery-reminder/index.ts`:
- Query active subscriptions where `next_delivery_date = today + 3 days`
- For each subscription with an email:
  - Send a friendly reminder email with:
    - Items being delivered
    - Delivery date and time window
    - Delivery address (if applicable)
    - Contact info for changes
- Track sent reminders in logs

**Email Template:**
- Blue/Teal gradient header (consistent with brand)
- Icon: Calendar/Clock symbol
- Subject: "Upcoming Delivery Reminder - Aqua VI"
- Content: Friendly reminder about what's coming and when
- Call to action: Contact info if changes needed

#### 1.2 Daily Cron Job for Reminders

Add to the existing pg_cron schedule:
- Schedule: `0 7 * * *` (7:00 AM daily, 1 hour after order generation)
- Job name: `send-delivery-reminders-daily`
- Calls the reminder edge function

#### 1.3 Update Config

Add function to `supabase/config.toml`:
```toml
[functions.send-upcoming-delivery-reminder]
verify_jwt = false
```

---

## Feature 2: Subscription Edit Capability

### What It Does
Allow admin/staff to modify subscription details after creation:
- Edit items (add, remove, change quantities)
- Change frequency (bi-weekly to monthly or vice versa)
- Update delivery address
- Modify preferred day and schedule

### Implementation

#### 2.1 Edit Subscription Modal Component

Create a new `EditSubscriptionModal` component with:
- Product selection (same as OrderModal)
- Frequency selection with schedule options
- Delivery address field
- Payment method selection
- Real-time total calculation

#### 2.2 Update SubscriptionsTab.tsx

Add to the subscription management:
- Edit button (Pencil icon) in actions column
- Edit button in details modal
- State management for edit modal
- Form validation before save

#### 2.3 Database Update Logic

Update subscription via direct Supabase update:
- Recalculate total_amount based on new items
- If frequency changed, recalculate next_delivery_date
- Send notification email to customer about changes (optional)

#### 2.4 Customer Notification (Optional)

Create a new event type in `send-subscription-notification`:
- `modified`: Notify customer of subscription changes
- Include: What changed, new schedule, next delivery

---

## Technical Details

### New Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/send-upcoming-delivery-reminder/index.ts` | Reminder email function |
| `src/components/admin/EditSubscriptionModal.tsx` | Modal for editing subscriptions |

### Files to Modify

| File | Changes |
|------|---------|
| `supabase/config.toml` | Add new edge function |
| `src/components/admin/SubscriptionsTab.tsx` | Add edit button and modal integration |
| `supabase/functions/send-subscription-notification/index.ts` | Add 'modified' event type |

### Database Changes

No database schema changes required - all fields already exist in the subscriptions table.

### Cron Job Addition

SQL to add reminder job:
```sql
SELECT cron.schedule(
  'send-delivery-reminders-daily',
  '0 7 * * *',
  $$
  SELECT net.http_post(
    url := 'https://qscyapmuiqaijvuitlyv.supabase.co/functions/v1/send-upcoming-delivery-reminder',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer [ANON_KEY]"}'::jsonb,
    body := '{"reminder_days": 3}'::jsonb
  ) AS request_id;
  $$
);
```

---

## Edit Subscription Modal Design

```text
+------------------------------------------+
|  Edit Subscription                    X  |
+------------------------------------------+
|  Customer: [Name]                        |
|  Phone: [Phone] | Email: [Email]         |
+------------------------------------------+
|  DELIVERY TYPE                           |
|  [Delivery ▼]                            |
|                                          |
|  DELIVERY ADDRESS                        |
|  [_____________________________________] |
|                                          |
|  FREQUENCY                               |
|  ( ) Bi-weekly   ( ) Monthly             |
|                                          |
|  PREFERRED DAY                           |
|  [Wednesday ▼]                           |
|                                          |
|  [Week of Month ▼] (if monthly)          |
+------------------------------------------+
|  PRODUCTS                                |
|  +--------------------------------------+|
|  | Aqua VI 5 Gal    $6.00   [-] 2 [+]  ||
|  | Aqua VI 3 Gal    $4.50   [-] 0 [+]  ||
|  | Aqua VI 1 Liter  $1.00   [-] 0 [+]  ||
|  +--------------------------------------+|
|  Total: $12.00                           |
+------------------------------------------+
|  PAYMENT METHOD                          |
|  [Cash ▼]                                |
+------------------------------------------+
|            [Cancel]  [Save Changes]      |
+------------------------------------------+
```

---

## Reminder Email Template Design

```text
+------------------------------------------+
|            [AQUA VI LOGO]                |
+------------------------------------------+
|  +--------------------------------------+|
|  | Calendar Icon  UPCOMING DELIVERY     ||
|  |                Your order is coming  ||
|  +--------------------------------------+|
|                                          |
|  Hi [Customer Name],                     |
|                                          |
|  This is a friendly reminder that your   |
|  recurring water delivery is scheduled   |
|  for [Date].                             |
|                                          |
|  +--------------------------------------+|
|  | DELIVERY DETAILS                     ||
|  | Date: [Next Delivery Date]           ||
|  | Time: 11:00 AM - 2:30 PM             ||
|  | Address: [Delivery Address]          ||
|  +--------------------------------------+|
|                                          |
|  +--------------------------------------+|
|  | YOUR ITEMS                           ||
|  | Item        Qty   Price   Total      ||
|  | Aqua VI 5G   2   $6.00   $12.00      ||
|  +--------------------------------------+|
|                                          |
|  Need to make changes? Contact us:       |
|  Phone: 1-284-443-4353                   |
|  Email: aquavidistributor@gmail.com      |
+------------------------------------------+
```

---

## Rollout Sequence

1. **Create reminder edge function** - Build and test the email template
2. **Update config.toml** - Add new function configuration
3. **Deploy and test reminder function** - Verify emails send correctly
4. **Add reminder cron job** - Schedule daily at 7 AM
5. **Create EditSubscriptionModal** - Build the edit form component
6. **Integrate edit modal into SubscriptionsTab** - Add buttons and state
7. **Add subscription change notification** - Optional email on edit
8. **Test full flow** - Verify edit saves correctly and recalculates dates

---

## Success Criteria

- Customers receive reminder emails 3 days before delivery
- Reminders only sent to subscriptions with valid email addresses
- Admin can edit any active or paused subscription
- Editing items correctly recalculates total amount
- Changing frequency correctly recalculates next delivery date
- All changes logged in updated_at timestamp
- Optional: Customer notified of subscription changes

---

## Notes

- Reminder cron runs 1 hour after order generation (7 AM vs 6 AM)
- Edit modal reuses product selection logic from OrderModal
- Cancelled subscriptions cannot be edited (must create new)
- Next delivery date auto-recalculates when frequency changes
