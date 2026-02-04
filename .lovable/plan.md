# Automated Recurring Order Generation System

## Status: Phase 1 & 2 Complete ✅

---

## Completed Implementation

### ✅ Phase 1: Automated Order Generation (Core)

#### 1.1 Database Function Created
- **RPC Function**: `generate_order_from_subscription(p_subscription_id uuid)`
- Creates order from subscription template
- Calculates and updates `next_delivery_date` using existing logic
- Updates `last_order_id` reference
- Returns complete order details

#### 1.2 Edge Function Deployed
- **File**: `supabase/functions/generate-subscription-orders/index.ts`
- Queries active subscriptions where `next_delivery_date <= today + 2 days`
- Supports manual trigger via `subscription_id` parameter
- Supports `dry_run` mode for testing
- Sends order confirmation emails automatically
- Comprehensive logging for troubleshooting

#### 1.3 Edge Function Config
- Added to `supabase/config.toml`
- `verify_jwt = false` (for cron job access)

### ✅ Phase 2: Admin Dashboard Enhancements

#### 2.1 Due Date Indicators
- Color-coded badges: Red (overdue/today), Orange (1-2 days), Yellow (3-7 days)
- "Due This Week" filter option with count
- New summary card showing subscriptions due this week

#### 2.2 Order History in Details Modal
- Shows all orders linked to subscription
- Displays order number, date, amount, and status

#### 2.3 Manual Order Generation
- "Generate Next Order" button (Package icon) in table actions
- Full-width button in subscription details modal
- Calls edge function, updates UI after success

---

## Pending: Enable Cron Job (Requires Supabase Dashboard)

### Step 1: Enable Extensions
In Supabase Dashboard → SQL Editor, run:
```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
```

### Step 2: Schedule Daily Job
After extensions are enabled, run:
```sql
SELECT cron.schedule(
  'generate-subscription-orders-daily',
  '0 6 * * *',  -- Daily at 6:00 AM UTC
  $$
  SELECT net.http_post(
    url := 'https://qscyapmuiqaijvuitlyv.supabase.co/functions/v1/generate-subscription-orders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := '{"lead_days": 2}'::jsonb
  );
  $$
);
```

### Step 3: Verify Cron Job
```sql
SELECT * FROM cron.job;
```

---

## How It Works

### Automated Flow (When Cron Enabled)
```
[Daily at 6 AM UTC]
        ↓
[pg_cron triggers HTTP call]
        ↓
[Edge Function: generate-subscription-orders]
        ↓
  For each active subscription with next_delivery_date <= today + 2:
        → Call RPC: generate_order_from_subscription(id)
        → Create order record
        → Calculate new next_delivery_date
        → Update subscription
        → Send confirmation email (if email exists)
        ↓
[Return summary with results]
```

### Manual Flow (Available Now)
Staff can click the Package icon on any active subscription to:
1. Generate an order immediately
2. Advance the next_delivery_date
3. Send confirmation email to customer

---

## API Reference

### Edge Function: generate-subscription-orders

**Endpoint**: `POST /functions/v1/generate-subscription-orders`

**Parameters** (JSON body):
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `lead_days` | number | 2 | Days before delivery to generate orders |
| `dry_run` | boolean | false | Simulate without creating orders |
| `subscription_id` | string | null | Generate for specific subscription only |

**Response**:
```json
{
  "success": true,
  "message": "Generated 3 orders, 0 failed",
  "generated": 3,
  "failed": 0,
  "results": [
    {
      "subscription_id": "...",
      "customer_name": "...",
      "order_id": "...",
      "order_number": "AQVI...",
      "success": true,
      "email_sent": true
    }
  ],
  "execution_time_ms": 1234
}
```

---

## Future Enhancements (Phase 3)

### 3.1 Upcoming Delivery Reminder Email
- Send customer reminder 3 days before delivery
- Include items, date, and contact info

### 3.2 Subscription Edit Capability
- Allow modifying items, frequency, or delivery details
- Track changes in subscription history

---

## Notes for Team

- **Lead Time**: Orders generate 2 days before delivery date
- **Email Notifications**: Customers with email receive confirmations
- **Manual Override**: Staff can generate orders anytime via admin panel
- **Paused Subscriptions**: Skipped by automated system
- **Cancelled Subscriptions**: Never processed
- **Logs**: Check edge function logs for troubleshooting
