

# Automated Recurring Order Generation System

## Overview

This plan implements a fully automated system that generates orders from active subscriptions based on their `next_delivery_date`. The system will also address identified gaps in the subscription module.

---

## Current State Analysis

### What Works Now
- Subscription creation correctly generates the **first order** immediately
- `next_delivery_date` is properly calculated using the `calculate_next_delivery_date()` database function
- Admin dashboard allows pause, resume, and cancel with email notifications
- Order confirmation emails include subscription schedule info

### Identified Gaps

| Gap | Severity | Description |
|-----|----------|-------------|
| No automated order generation | Critical | Subsequent orders after the first are not created automatically |
| No upcoming delivery alerts | Medium | Staff have no visual indicator of which subscriptions need orders soon |
| No subscription edit capability | Low | Cannot modify items, frequency, or delivery details after creation |
| No order history on subscription | Low | Details modal doesn't show past orders linked to subscription |
| `next_delivery_date` not updated | Critical | After generating an order, the next delivery date isn't recalculated |

---

## Implementation Plan

### Phase 1: Automated Order Generation (Core)

#### 1.1 Enable Required Extensions

Enable `pg_cron` and `pg_net` extensions in Supabase to allow scheduled database jobs that can call edge functions.

```text
Extensions to enable:
+-------------+------------------------------------------+
| Extension   | Purpose                                  |
+-------------+------------------------------------------+
| pg_cron     | Schedule recurring database jobs         |
| pg_net      | HTTP calls from database to edge func    |
+-------------+------------------------------------------+
```

#### 1.2 Create Order Generation Edge Function

New edge function: `supabase/functions/generate-subscription-orders/index.ts`

**Responsibilities:**
1. Query all active subscriptions where `next_delivery_date <= today + 2 days`
2. For each subscription:
   - Create a new order with subscription items
   - Update `next_delivery_date` using `calculate_next_delivery_date()`
   - Update `last_order_id` reference
   - Send order confirmation email (optional, configurable)
3. Log results and any failures

**Flow Diagram:**
```text
[pg_cron: Daily 6 AM]
        |
        v
[Edge Function: generate-subscription-orders]
        |
        +---> Query active subscriptions due soon
        |
        v
  For each subscription:
        +---> Create new order record
        +---> Calculate next delivery date
        +---> Update subscription record
        +---> Send confirmation email (if email exists)
        |
        v
[Return: Summary of orders generated]
```

#### 1.3 Database Function for Order Generation

Create an RPC function `generate_order_from_subscription(subscription_id)` that:
- Validates subscription is active
- Creates order with correct items/amounts
- Calculates and updates next delivery date
- Returns the new order details

This keeps business logic in the database for consistency.

#### 1.4 Schedule the Cron Job

Configure pg_cron to call the edge function daily at 6:00 AM:
- Lead time: 2 days before `next_delivery_date`
- This gives staff time to prepare orders

---

### Phase 2: Admin Dashboard Enhancements

#### 2.1 Upcoming Deliveries Alert

Add visual indicators in the Subscriptions tab:
- Badge showing "Due in X days" for subscriptions with upcoming deliveries
- Filter option: "Due This Week" to quickly see what needs attention
- Color coding: Yellow (3-7 days), Orange (1-2 days), Red (overdue/today)

#### 2.2 Subscription Order History

In the subscription details modal, add a section showing:
- All orders linked to this subscription
- Order status, date, and amount
- Quick link to view order details

#### 2.3 Manual Order Generation Button

Add a "Generate Next Order" button for staff to manually trigger order creation:
- Useful for testing or one-off needs
- Calls the same RPC function as the automated system
- Updates next delivery date automatically

---

### Phase 3: Notification System (Enhancement)

#### 3.1 Upcoming Delivery Reminder

New edge function: `send-upcoming-delivery-reminder`

Sends email to customers 2-3 days before scheduled delivery:
- Reminder of what's being delivered
- Delivery date and time window
- Option to contact if changes needed

#### 3.2 Order Generated Notification

When automated system creates an order:
- Send customer the standard order confirmation
- Flag it as "Recurring Order" in the email
- Show next scheduled delivery date

---

## Technical Details

### New Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/generate-subscription-orders/index.ts` | Main automation function |
| Migration for `generate_order_from_subscription` RPC | Database function |
| Migration for pg_cron job setup | Schedule the daily job |

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/admin/SubscriptionsTab.tsx` | Add due date indicators, order history, manual generate button |
| `supabase/config.toml` | Add new edge function configuration |

### Database Changes

1. **RPC Function**: `generate_order_from_subscription(p_subscription_id uuid)`
   - Creates order from subscription template
   - Updates `next_delivery_date` and `last_order_id`
   - Returns order details

2. **Cron Job** (via SQL insert after enabling extensions):
   - Schedule: `0 6 * * *` (daily at 6 AM)
   - Calls edge function via `pg_net.http_post()`

### Edge Function Logic

```text
generate-subscription-orders:

1. Auth: Verify service role (cron context)
2. Query: SELECT * FROM subscriptions 
          WHERE status = 'active' 
          AND next_delivery_date <= CURRENT_DATE + 2
3. For each subscription:
   a. Call RPC generate_order_from_subscription(id)
   b. If customer has email, send confirmation
   c. Log success/failure
4. Return summary: { generated: N, failed: M, details: [...] }
```

---

## Rollout Sequence

1. **Deploy database function** - `generate_order_from_subscription` RPC
2. **Deploy edge function** - `generate-subscription-orders`
3. **Enable extensions** - pg_cron, pg_net (requires Supabase dashboard)
4. **Create cron job** - Schedule via SQL
5. **Update admin UI** - Add due indicators and manual trigger
6. **Test end-to-end** - Verify with existing active subscription
7. **Monitor** - Check logs for first few automated runs

---

## Success Criteria

- Active subscriptions automatically generate orders 2 days before `next_delivery_date`
- `next_delivery_date` correctly advances after each order generation
- Customers receive order confirmation emails for automated orders
- Admin dashboard shows upcoming deliveries clearly
- Staff can manually trigger order generation when needed
- System logs all automation activity for troubleshooting

---

## Notes for the Team

- **Lead Time**: Orders generate 2 days before delivery date, giving staff time to prepare
- **Email Notifications**: Customers with email addresses receive confirmations automatically
- **Manual Override**: Staff can always generate orders manually from the admin panel
- **Paused Subscriptions**: Only "active" subscriptions are processed; paused ones are skipped
- **Cancelled Subscriptions**: Never processed by the automated system

