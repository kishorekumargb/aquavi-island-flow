

# Recurring Order System - Updated Implementation Plan

## Overview

This plan implements a subscription-based recurring order system for Aqua VI water delivery, supporting **bi-weekly** and **monthly** frequency options with preferred delivery day selection (Monday-Friday only).

---

## Key Changes from Previous Plan

Based on your feedback, the following adjustments have been made:

| Item | Previous | Updated |
|------|----------|---------|
| Preferred Days | Monday-Sunday | **Monday-Friday only** (weekends off) |
| Preferred Time | Manual selection | **Automatic** based on delivery type |
| Delivery Time Window | User selects | Fixed: 11:00 AM - 2:30 PM |
| Pickup Time Window | User selects | Fixed: 9:00 AM - 6:30 PM |
| Pickup/Delivery | Mentioned in plan | Explicitly supported for subscriptions |

---

## User Experience Flow

### Step 2 of OrderModal - Updated Fields

**Frequency Options:**
- One-time Order (existing behavior)
- Bi-weekly
- Monthly

**For One-time Orders:**
- Preferred Date (date picker)
- Time: Auto-set based on delivery type

**For Bi-weekly:**
- Preferred Day: Dropdown with Monday, Tuesday, Wednesday, Thursday, Friday
- Start Date: Date picker (for first delivery)
- Time: Auto-set based on delivery type
- Display: "Deliver every 2 weeks on [Day], starting [Date]"

**For Monthly:**
- Preferred Day: Dropdown with Monday, Tuesday, Wednesday, Thursday, Friday
- Week of Month: 1st, 2nd, 3rd, 4th
- Time: Auto-set based on delivery type
- Display: "Deliver on the [1st/2nd/3rd/4th] [Day] of each month"

### Delivery Type Impact on Subscriptions
- **Delivery subscriptions**: Address required, time window 11:00 AM - 2:30 PM
- **Pickup subscriptions**: No address needed, time window 9:00 AM - 6:30 PM

---

## Database Schema Changes

### New Table: `subscriptions`

```text
+---------------------+-------------+------------------------------------------+
| Column              | Type        | Description                              |
+---------------------+-------------+------------------------------------------+
| id                  | uuid        | Primary key                              |
| customer_name       | text        | Customer full name                       |
| customer_email      | text        | Customer email (nullable)                |
| customer_phone      | text        | Customer phone                           |
| delivery_address    | text        | Delivery address (null for pickup)       |
| delivery_type       | text        | 'delivery' or 'pickup'                   |
| frequency           | text        | 'biweekly' or 'monthly'                  |
| preferred_day       | text        | 'monday'-'friday' only                   |
| week_of_month       | integer     | For monthly: 1-4 (null for biweekly)     |
| items               | jsonb       | Product items configuration              |
| total_amount        | numeric     | Order total                              |
| status              | text        | 'active', 'paused', 'cancelled'          |
| next_delivery_date  | date        | Calculated next delivery                 |
| start_date          | date        | When subscription starts                 |
| payment_method      | text        | 'cash' (future: card)                    |
| created_at          | timestamp   | Creation time                            |
| updated_at          | timestamp   | Last update                              |
| last_order_id       | uuid        | Reference to last generated order        |
+---------------------+-------------+------------------------------------------+
```

### Orders Table Enhancement
Add column: `subscription_id` (uuid, nullable) - links recurring orders to parent subscription

---

## Next Delivery Date Calculation

### Bi-weekly Logic
```text
Given: preferred_day = 'wednesday', start_date = 2026-02-05
1st delivery: 2026-02-05 (or next Wednesday if start_date is not Wednesday)
2nd delivery: 2026-02-19 (14 days later)
3rd delivery: 2026-03-05 (14 days later)
...
```

### Monthly Logic
```text
Given: preferred_day = 'monday', week_of_month = 2
Find the 2nd Monday of each month:
- February 2026: 2026-02-09
- March 2026: 2026-03-09
- April 2026: 2026-04-13
...
```

### Weekend Handling
Since preferred days are Monday-Friday only, no weekend adjustments needed.

---

## Implementation Phases

### Phase 1: Database Foundation
1. Create `subscriptions` table with RLS policies
2. Add `subscription_id` column to `orders` table
3. Create database function `calculate_next_delivery_date(frequency, preferred_day, week_of_month, current_date)`

### Phase 2: OrderModal UI Updates
1. Update frequency dropdown options: One-time, Bi-weekly, Monthly
2. Add conditional fields based on frequency:
   - Bi-weekly: Day selector (Mon-Fri) + Start date picker
   - Monthly: Day selector (Mon-Fri) + Week selector (1st/2nd/3rd/4th)
3. Remove manual time selection - auto-set based on delivery type
4. Add subscription summary display for recurring orders

### Phase 3: Subscription Creation Logic
1. Create `create_subscription` RPC function with server-side validation
2. Calculate initial `next_delivery_date`
3. Generate first order immediately on subscription creation
4. Create subscription confirmation email template

### Phase 4: Admin Dashboard - Subscriptions Tab
1. Add new "Subscriptions" tab to admin dashboard
2. Build subscription list with columns:
   - Customer info
   - Schedule description (e.g., "Every 2 weeks on Wednesday")
   - Delivery type
   - Next delivery date
   - Status
3. Implement actions: View history, Pause/Resume, Cancel
4. Add subscription indicator badge to orders list

### Phase 5: Automated Order Generation
1. Create `generate-subscription-orders` edge function
2. Logic:
   - Find active subscriptions where next_delivery_date is within 3 days
   - Generate pending order for each
   - Calculate and update next_delivery_date
   - Send reminder notification
3. Set up daily execution (manual trigger initially, pg_cron later if available)

### Phase 6: Notification System
1. Create subscription confirmation email template
2. Create upcoming delivery reminder email (sent 3 days before)
3. Create subscription paused/resumed/cancelled emails
4. Update existing order emails to indicate if order is part of subscription

---

## Technical Details

### RLS Policies for Subscriptions Table
- Public INSERT: Allow anyone to create subscriptions
- Authenticated SELECT/UPDATE: Allow admins and authenticated users
- Admin DELETE: Only admins can delete subscriptions

### Time Window Auto-Assignment
```typescript
// When creating subscription or order
const timeWindow = deliveryType === 'delivery' 
  ? '11:00-14:30'  // 11:00 AM - 2:30 PM
  : '09:00-18:30'; // 9:00 AM - 6:30 PM
```

### Day of Week Mapping
```typescript
const weekdays = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' }
];
```

---

## Edge Cases Handled

| Scenario | Solution |
|----------|----------|
| 5th week of month for monthly | Skip to 1st occurrence in next month |
| Customer cancels before first delivery | Mark subscription as cancelled, no orders generated |
| Product becomes unavailable | Flag subscription for admin review |
| Order receiving globally disabled | Skip order generation, send notification |
| Start date is on weekend | Adjust to next valid weekday |

---

## Summary

This implementation provides a robust recurring order system with:
- **Clear frequency options**: One-time, Bi-weekly, Monthly
- **Weekday-only scheduling**: Monday through Friday
- **Automatic time windows**: Based on delivery/pickup type
- **Both delivery and pickup**: Full support for subscription fulfillment types
- **Parent-child model**: Subscriptions generate individual orders
- **Admin management**: Full lifecycle control via dashboard
- **Proactive notifications**: Reminders before each scheduled delivery

Ready to begin Phase 1 upon your approval.

