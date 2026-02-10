

# Fix Subscription Order Email Notifications

## Problem
Subscription order emails are being sent as plain "Order Confirmed" instead of "Subscription Started" with full recurring schedule details. Two root causes:

1. **Field name mismatch** in `generate-subscription-orders`: sends `isSubscriptionOrder` but email function expects `isSubscription`
2. **Missing `subscriptionSummary`**: the schedule description (e.g., "Every 2 weeks on Monday") is never constructed or sent

## What Already Exists (No Changes Needed)
The `send-order-confirmation` function already has complete subscription email templates:
- "Subscription Started!" banner and subject line
- Teal "RECURRING BIWEEKLY/MONTHLY SUBSCRIPTION" badge
- "Your Recurring Schedule" section with summary text and next delivery date
- Business email with "SUBSCRIPTION Delivery" subject

These just never activate due to the field mismatch.

## Changes

### File 1: `supabase/functions/generate-subscription-orders/index.ts`

Update the email payload (around lines 140-155) to:

- Rename `isSubscriptionOrder` to `isSubscription`
- Rename `subscriptionFrequency` to `frequency`
- Add `paymentMethod` from `subscription.payment_method`
- Add `customerPhone` from `subscription.customer_phone`
- **Construct `subscriptionSummary`** from the subscription's frequency, preferred day, and schedule fields (e.g., "Every 2 weeks on Monday" or "Monthly on the 2nd Tuesday")
- Pass `nextDeliveryDate` (already present, no change needed)

### File 2: `src/components/admin/SubscriptionsTab.tsx`

Add an AlertDialog confirmation before the "Generate Order" action:
- Warning text: "This will create an order for delivery on [next_delivery_date] and advance the schedule to the next cycle."
- Cancel and Confirm buttons
- Prevents accidental date advancement

### Deployment
Redeploy `generate-subscription-orders` edge function.

---

## Expected Result After Fix

**Customer email will show:**
- Subject: "Subscription Started - AQVI..."
- Banner: "Subscription Started! Your recurring delivery is set up"
- Badge: "RECURRING MONTHLY SUBSCRIPTION"
- Schedule section: "Monthly on the 2nd Tuesday" with next delivery date
- Payment method and phone number included

**Business email will show:**
- Subject: "SUBSCRIPTION Delivery: AQVI... - $89.99"
- Full subscription details with schedule

## Files Modified
| File | Change |
|------|--------|
| `supabase/functions/generate-subscription-orders/index.ts` | Fix field names, add subscriptionSummary construction |
| `src/components/admin/SubscriptionsTab.tsx` | Add confirmation dialog for Generate Order |

