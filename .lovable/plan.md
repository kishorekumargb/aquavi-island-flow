

# Subscription Email Enhancement Plan

## Summary

This plan enhances your existing email notification system to properly handle subscription orders. All changes are **strictly additive** - no existing functionality will be modified or removed. The current system will continue to work exactly as it does today for one-time orders.

---

## Current System Analysis

### What's Working (Unchanged)

| Component | Status | Notes |
|-----------|--------|-------|
| `send-order-confirmation` | Working | Handles one-time order emails perfectly |
| `send-delivery-confirmation` | Working | Handles delivery/pickup completion |
| `send-cancellation-notification` | Working | Handles order cancellations |
| Frontend subscription flow | Working | Already sends `isSubscription`, `frequency`, `subscriptionSummary` |
| Admin Subscriptions Tab | Working | Can pause/resume/cancel subscriptions |

### The Gap

The frontend already sends subscription data to the email function:
```javascript
// Currently sent (lines 1105-1107 in OrderModal.tsx)
isSubscription: orderData.frequency !== 'once',
frequency: orderData.frequency,
subscriptionSummary: orderData.frequency !== 'once' ? getSubscriptionSummary() : undefined
```

But the edge function interface (line 29-39) doesn't define these fields:
```typescript
interface OrderConfirmationRequest {
  orderNumber: string;
  customerName: string;
  // ... no subscription fields defined
}
```

Result: Subscription data is silently ignored. Emails look identical for one-time and recurring orders.

---

## Implementation Strategy

### Principle: Additive Only

- Add new optional fields to interfaces (backward compatible)
- Add new conditional sections to email templates (only render when data present)
- Create new edge function for subscription lifecycle (separate from orders)
- Existing one-time order flow remains 100% unchanged

---

## Phase 1: Enhance Order Confirmation Emails

### File: `supabase/functions/send-order-confirmation/index.ts`

#### Change 1: Extend Interface (Additive)

**Current (lines 29-39):**
```typescript
interface OrderConfirmationRequest {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  deliveryAddress: string;
  items: OrderItem[];
  totalAmount: number;
  paymentMethod: string;
  deliveryType: string;
}
```

**After (add 4 optional fields):**
```typescript
interface OrderConfirmationRequest {
  // ... all existing fields unchanged ...
  
  // NEW: Subscription fields (optional - backward compatible)
  isSubscription?: boolean;
  frequency?: string;  // 'biweekly' | 'monthly'
  subscriptionSummary?: string;
  nextDeliveryDate?: string;
}
```

This is backward compatible because:
- All new fields are optional (`?`)
- Existing calls without these fields continue to work
- Old emails continue to render exactly as before

#### Change 2: Add Subscription Detection (Additive)

**Add after line 117 (after `isPickup` detection):**
```typescript
// Subscription detection (backward compatible)
const isSubscription = orderData.isSubscription === true;
const subscriptionFrequency = orderData.frequency || '';
const subscriptionSummary = orderData.subscriptionSummary || '';
```

#### Change 3: Add Subscription Section to Customer Email (Conditional)

**Insert new section ONLY when `isSubscription` is true - between Status Banner and Greeting:**

```html
<!-- Subscription Badge - Only shows for recurring orders -->
${isSubscription ? `
<tr>
  <td style="padding: 16px 40px 0;">
    <div style="background: linear-gradient(135deg, #039C97 0%, #06B6D4 100%); 
                border-radius: 8px; padding: 12px 16px; text-align: center;">
      <span style="color: #ffffff; font-size: 14px; font-weight: 600;">
        RECURRING ${subscriptionFrequency.toUpperCase()} SUBSCRIPTION
      </span>
    </div>
  </td>
</tr>
` : ''}
```

**Add Schedule Section after Order Details (only for subscriptions):**

```html
${isSubscription ? `
<!-- Subscription Schedule Section -->
<tr>
  <td style="padding: 16px 40px;">
    <div style="background-color: #f0fdfa; border: 1px solid #99f6e4; 
                border-radius: 8px; padding: 16px;">
      <h3 style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #0f766e;">
        Your Recurring Schedule
      </h3>
      <p style="margin: 0 0 12px; font-size: 14px; color: #374151;">
        ${subscriptionSummary}
      </p>
      <div style="background-color: #ccfbf1; border-radius: 4px; padding: 8px 12px;">
        <p style="margin: 0; font-size: 13px; color: #0d9488;">
          Need to pause or modify? Contact us at 1-284-443-4353 or reply to this email.
        </p>
      </div>
    </div>
  </td>
</tr>
` : ''}
```

#### Change 4: Modify Email Subject Line (Conditional)

**Current (line 586):**
```typescript
subject: `Order Confirmation - ${orderData.orderNumber}`,
```

**After:**
```typescript
subject: isSubscription 
  ? `Subscription Started - ${orderData.orderNumber}` 
  : `Order Confirmation - ${orderData.orderNumber}`,
```

#### Change 5: Add Subscription Badge to Business Email (Conditional)

**Add after Order Type badge in business email (line 522):**

```html
${isSubscription ? `
<p style="margin: 8px 0 0; font-size: 14px; color: #374151;">
  <strong>Subscription:</strong> 
  <span style="background-color: #ccfbf1; padding: 2px 8px; border-radius: 4px; 
               font-weight: bold; color: #0d9488;">
    RECURRING ${subscriptionFrequency.toUpperCase()}
  </span>
</p>
<p style="margin: 4px 0 0; font-size: 13px; color: #6b7280;">
  Schedule: ${subscriptionSummary}
</p>
` : ''}
```

**Modify business email subject (line 600):**
```typescript
subject: isSubscription
  ? `SUBSCRIPTION ${isPickup ? 'Pickup' : 'Delivery'}: ${orderData.orderNumber} - $${orderData.totalAmount.toFixed(2)}`
  : `New ${isPickup ? 'Pickup' : 'Delivery'} Order: ${orderData.orderNumber} - $${orderData.totalAmount.toFixed(2)}`,
```

---

## Phase 2: Create Subscription Lifecycle Edge Function

### New File: `supabase/functions/send-subscription-notification/index.ts`

This is an entirely new function - no changes to existing code.

**Purpose:** Handle subscription-specific lifecycle events:
- `paused` - When admin pauses a subscription
- `resumed` - When admin resumes a subscription  
- `cancelled` - When admin cancels a subscription

**Template Design:**

| Event | Banner Color | Icon | Message |
|-------|--------------|------|---------|
| Paused | Yellow/Amber | Pause icon | "Your subscription is paused" |
| Resumed | Teal/Cyan | Play icon | "Welcome back! Subscription active" |
| Cancelled | Red | X icon | "Subscription cancelled" |

**Interface:**
```typescript
interface SubscriptionNotificationRequest {
  eventType: 'paused' | 'resumed' | 'cancelled';
  subscriptionId: string;
  customerName: string;
  customerEmail: string;
  frequency: string;
  subscriptionSummary: string;
  nextDeliveryDate?: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  totalAmount: number;
}
```

**Config Addition (supabase/config.toml):**
```toml
[functions.send-subscription-notification]
verify_jwt = true
```

---

## Phase 3: Integrate Notifications into Admin Dashboard

### File: `src/components/admin/SubscriptionsTab.tsx`

**Change 1: Add notification function (after `updateSubscriptionStatus`):**

```typescript
const sendSubscriptionNotification = async (
  subscription: Subscription, 
  eventType: 'paused' | 'resumed' | 'cancelled'
) => {
  if (!subscription.customer_email) {
    console.log('No customer email, skipping notification');
    return;
  }
  
  try {
    await supabase.functions.invoke('send-subscription-notification', {
      body: {
        eventType,
        subscriptionId: subscription.id,
        customerName: subscription.customer_name,
        customerEmail: subscription.customer_email,
        frequency: subscription.frequency,
        subscriptionSummary: `${getFrequencyLabel(subscription.frequency)} on ${getDayLabel(subscription.preferred_day)}`,
        nextDeliveryDate: subscription.next_delivery_date,
        items: subscription.items,
        totalAmount: subscription.total_amount
      }
    });
    console.log(`Subscription ${eventType} notification sent`);
  } catch (error) {
    console.error('Failed to send subscription notification:', error);
    // Don't block the status update if email fails
  }
};
```

**Change 2: Call notification after successful status update:**

In `updateSubscriptionStatus` function, after the successful database update:

```typescript
// After: toast({ title: "Success", ... })

// Send notification email
await sendSubscriptionNotification(
  subscriptions.find(s => s.id === subscriptionId)!, 
  newStatus as 'paused' | 'resumed' | 'cancelled'
);
```

---

## Safety Guarantees

### What Will NOT Change

| Component | Guarantee |
|-----------|-----------|
| One-time order emails | Identical output - new fields are optional and conditionally rendered |
| Order creation flow | No changes - RPC functions unchanged |
| Delivery confirmation | No changes to this function |
| Cancellation notification | No changes to this function |
| Admin Orders tab | No changes |
| Database schema | No changes |

### Backward Compatibility

```text
Scenario: One-time order (no subscription fields sent)
  - isSubscription = undefined -> false
  - All conditional subscription sections = empty string
  - Email renders exactly as before
  
Scenario: Subscription order (fields sent)
  - isSubscription = true
  - Conditional sections render with subscription info
  - Email shows enhanced subscription content
```

---

## Testing Checklist

After implementation, verify:

1. **One-time order email** - Place a one-time order, confirm email looks identical to current
2. **Subscription confirmation email** - Create bi-weekly subscription, verify:
   - Subject line says "Subscription Started"
   - Teal "RECURRING BIWEEKLY" badge appears
   - Schedule section shows delivery frequency
   - Management instructions appear
3. **Business notification** - Verify internal alert shows "SUBSCRIPTION" badge
4. **Pause notification** - Pause subscription from admin, verify email sent
5. **Resume notification** - Resume subscription, verify email sent
6. **Cancel notification** - Cancel subscription, verify email sent

---

## File Changes Summary

| File | Action | Risk Level |
|------|--------|------------|
| `supabase/functions/send-order-confirmation/index.ts` | Modify (additive) | Low |
| `supabase/functions/send-subscription-notification/index.ts` | Create (new) | None |
| `supabase/config.toml` | Add function config | None |
| `src/components/admin/SubscriptionsTab.tsx` | Add notification calls | Low |

---

## Visual Reference: Email Differences

### One-Time Order (Unchanged)
```text
+------------------------------------------+
| [Logo]                                   |
+------------------------------------------+
| [Blue/Teal Banner] Order Confirmed!      |
+------------------------------------------+
| Order #AQ123...                          |
| Status Timeline                          |
| Order Details                            |
| Items Table                              |
| Support Info                             |
+------------------------------------------+
```

### Subscription Order (Enhanced)
```text
+------------------------------------------+
| [Logo]                                   |
+------------------------------------------+
| [Blue/Teal Banner] Order Confirmed!      |
+------------------------------------------+
| [Teal Badge] RECURRING BIWEEKLY          |  <-- NEW
+------------------------------------------+
| Order #AQ123...                          |
| Status Timeline                          |
+------------------------------------------+
| [Teal Box] Your Recurring Schedule       |  <-- NEW
| Deliver every 2 weeks on Wednesday       |
| [Pause/modify instructions]              |
+------------------------------------------+
| Order Details                            |
| Items Table                              |
| Support Info                             |
+------------------------------------------+
```

---

## Ready to Proceed

This plan ensures:
- Zero breaking changes to existing functionality
- All modifications are additive and conditional
- New edge function is completely separate
- Existing emails continue to work identically
- Subscription emails get proper visual distinction

Approve to begin implementation with Phase 1.

