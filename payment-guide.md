# Subscription System - Frontend Integration Guide

## Table of Contents
1. [Overview](#overview)
2. [Architecture & Flow](#architecture--flow)
3. [API Endpoints](#api-endpoints)
4. [Implementation Workflows](#implementation-workflows)
5. [Payment Integration](#payment-integration)
6. [Error Handling](#error-handling)
7. [UI/UX Recommendations](#uiux-recommendations)
8. [Testing Guide](#testing-guide)

---

## Overview

This guide provides complete documentation for integrating the Razorpay Subscription System into your frontend application. The system supports:

- ✅ Multiple subscription plans (Starter, Pro, Enterprise)
- ✅ Plan upgrades (immediate or at cycle end)
- ✅ Plan downgrades (always at cycle end)
- ✅ Subscription cancellation
- ✅ Subscription pause/resume
- ✅ Credit management with 2-month expiry
- ✅ Payment history tracking
- ✅ Multiple payment methods (Card, UPI, E-Mandate)

### Key Features

**Credit System:**
- Credits awarded when subscription activates
- 2-month expiry from award date (not billing cycle end)
- Credits preserved during plan changes
- Linked to userId (survives subscription changes)

**Plan Change Strategy:**
- **Upgrades:** Can be immediate or cycle-end
- **Downgrades:** Always at cycle end (prevents credit loss)
- **Cancel+Recreate:** Automatic fallback for payment method restrictions

**Payment Methods:**
- **Card:** E-Mandate token created automatically after first payment
- **UPI:** No token created (manual authorization each cycle)
- **E-Mandate/Nach:** Token-based recurring payments

---

## Architecture & Flow

### Subscription Lifecycle

```
1. User Selects Plan
   ↓
2. POST /api/subscriptions/create
   ↓
3. User Completes Payment (Razorpay Checkout)
   ↓
4. Webhook: subscription.authenticated
   ↓
5. Webhook: subscription.activated → Credits Awarded
   ↓
6. Subscription Active
   ↓
7. Monthly/Yearly Charge
   ↓
8. Webhook: subscription.charged → Credits Awarded
```

### Plan Change Workflow

```
Upgrade (Immediate):
1. POST /api/subscriptions/change-plan (changeMode: "immediate")
2. Razorpay processes proration
3. Plan changes immediately
4. Additional credits awarded based on proration

Downgrade (Cycle End):
1. POST /api/subscriptions/change-plan (changeMode: "cycle_end")
2. Old subscription continues until period end
3. New plan activates at next billing cycle
4. No credit adjustment (user keeps existing credits)
```

### Cancel+Recreate Fallback

When direct plan updates fail (UPI/Card restrictions):
```
1. Cancel old subscription at cycle end
2. Create new subscription with target plan
3. User keeps access until paid period ends
4. Credits automatically preserved (userId-based)
5. User completes payment for new subscription
6. New subscription activates seamlessly
```

---

## API Endpoints

### Base URL
```
http://localhost:3000/api/subscriptions
```

---

## 1. Get Available Plans

**Endpoint:** `GET /api/subscriptions/plans`

**Description:** Fetch all active subscription plans visible to users.

**Request:**
```http
GET /api/subscriptions/plans
```

**Response:**
```json
{
  "success": true,
  "plans": [
    {
      "id": 1,
      "name": "Starter Plan",
      "description": "Perfect for individuals getting started",
      "razorpayPlanId": "plan_xxx",
      "period": "monthly",
      "interval": 1,
      "price": 49900,
      "priceInRupees": 499,
      "pricePerMonth": 499,
      "currency": "INR",
      "creditsPerCycle": 1000,
      "trialPeriodDays": 0,
      "features": [
        "1000 credits/month",
        "Email support",
        "Basic features"
      ],
      "maxProjects": 5,
      "maxTeamMembers": 1,
      "tags": "starter",
      "isActive": true,
      "isVisible": true,
      "sortOrder": 1
    },
    {
      "id": 2,
      "name": "Pro Plan",
      "description": "For professionals who need more power",
      "period": "monthly",
      "interval": 1,
      "price": 99900,
      "priceInRupees": 999,
      "pricePerMonth": 999,
      "creditsPerCycle": 2500,
      "features": [
        "2500 credits/month",
        "Priority support",
        "Advanced features",
        "API access"
      ],
      "maxProjects": 20,
      "maxTeamMembers": 5,
      "tags": "popular"
    },
    {
      "id": 3,
      "name": "Enterprise Plan",
      "description": "For large teams with unlimited needs",
      "period": "monthly",
      "interval": 1,
      "price": 249900,
      "priceInRupees": 2499,
      "pricePerMonth": 2499,
      "creditsPerCycle": 10000,
      "features": [
        "10000 credits/month",
        "24/7 support",
        "All features",
        "Dedicated account manager"
      ],
      "maxProjects": 100,
      "maxTeamMembers": 50,
      "tags": "enterprise"
    }
  ]
}
```

**UI Display Example:**
```jsx
// Pricing Card Component
<div className="pricing-card">
  <h3>{plan.name}</h3>
  <p className="price">₹{plan.priceInRupees}/{plan.period}</p>
  <p className="credits">{plan.creditsPerCycle} credits per {plan.period === 'monthly' ? 'month' : 'year'}</p>
  <ul className="features">
    {plan.features.map(feature => (
      <li key={feature}>{feature}</li>
    ))}
  </ul>
  <button onClick={() => handleSelectPlan(plan.id)}>
    Choose {plan.name}
  </button>
</div>
```

---

## 2. Create Subscription

**Endpoint:** `POST /api/subscriptions/create`

**Description:** Create a new subscription for the user.

**Request:**
```json
{
  "clerkId": "user_2abc123def456",
  "planId": 1,
  "customerEmail": "user@example.com",
  "customerPhone": "+919876543210"
}
```

**Response:**
```json
{
  "success": true,
  "subscription": {
    "id": 123,
    "razorpaySubscriptionId": "sub_RTho5FHdXyP2bR",
    "razorpayCustomerId": "cust_RTOqkynvT3SxCa",
    "status": "created",
    "plan": {
      "id": 1,
      "name": "Starter Plan",
      "price": 49900,
      "priceInRupees": 499,
      "period": "monthly",
      "interval": 1,
      "creditsPerCycle": 1000
    },
    "shortUrl": "https://rzp.io/rzp/aBc123",
    "totalCount": 120,
    "createdAt": "2025-01-15T10:30:00Z"
  },
  "razorpayKeyId": "rzp_test_RSY3LkXrab6gQY",
  "tokenInfo": {
    "status": "pending",
    "message": "E-Mandate token will be created automatically after your first successful payment",
    "upgradeCapability": "Will be enabled after first payment",
    "maxAuthorizationTarget": "₹20,000",
    "benefits": [
      "Seamless plan upgrades without re-authorization",
      "Automatic recurring payments",
      "Upgrade to any plan up to ₹20,000/month"
    ]
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "User already has an active subscription",
  "subscriptionId": "sub_existing123"
}
```

**Frontend Implementation:**
```javascript
async function createSubscription(clerkId, planId) {
  try {
    const response = await fetch('http://localhost:3000/api/subscriptions/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        clerkId,
        planId,
        customerEmail: user.email,
        customerPhone: user.phone,
      }),
    });

    const data = await response.json();

    if (data.success) {
      // Redirect to payment
      window.location.href = data.subscription.shortUrl;
      // OR open Razorpay Checkout
      openRazorpayCheckout(data);
    } else {
      showError(data.error);
    }
  } catch (error) {
    console.error('Failed to create subscription:', error);
    showError('Failed to create subscription. Please try again.');
  }
}
```

---

## 3. Get Subscription Status

**Endpoint:** `GET /api/subscriptions/status?clerkId={clerkId}`

**Description:** Get user's current subscription status with token information.

**Request:**
```http
GET /api/subscriptions/status?clerkId=user_2abc123def456
```

**Response:**
```json
{
  "success": true,
  "hasActiveSubscription": true,
  "subscription": {
    "id": 123,
    "razorpaySubscriptionId": "sub_RTho5FHdXyP2bR",
    "status": "active",
    "isPending": false,
    "isActive": true,
    "currentPeriodStart": "2025-01-15T00:00:00Z",
    "currentPeriodEnd": "2025-02-15T00:00:00Z",
    "billingCycleCount": 3,
    "nextPaymentAt": "2025-02-15T00:00:00Z",
    "cancelAtPeriodEnd": false,
    "startedAt": "2024-11-15T00:00:00Z",
    "activatedAt": "2024-11-15T10:45:00Z",
    "createdAt": "2024-11-15T10:30:00Z",
    "plan": {
      "id": 1,
      "name": "Starter Plan",
      "priceInRupees": 499,
      "period": "monthly",
      "interval": 1,
      "creditsPerCycle": 1000
    },
    "remaining": {
      "cycles": 117,
      "total": 120,
      "paid": 3
    },
    "token": {
      "hasToken": true,
      "status": "confirmed",
      "maxAmount": 2000000,
      "maxAmountInRupees": 20000,
      "method": "card",
      "isValid": true,
      "isConfirmed": true,
      "hasMaxAmount": true,
      "canUpgrade": true,
      "validationReason": "Valid token with confirmed status and max amount",
      "createdAt": "2024-11-15T10:45:00Z",
      "confirmedAt": "2024-11-15T10:45:00Z"
    }
  }
}
```

**No Active Subscription Response:**
```json
{
  "success": true,
  "hasActiveSubscription": false,
  "subscription": null
}
```

**Frontend Implementation:**
```javascript
async function getSubscriptionStatus(clerkId) {
  try {
    const response = await fetch(`http://localhost:3000/api/subscriptions/status?clerkId=${clerkId}`);
    const data = await response.json();

    if (data.success && data.hasActiveSubscription) {
      return {
        isActive: true,
        plan: data.subscription.plan,
        status: data.subscription.status,
        nextBilling: new Date(data.subscription.nextPaymentAt),
        creditsPerCycle: data.subscription.plan.creditsPerCycle,
        canUpgrade: data.subscription.token.canUpgrade,
        cancelAtPeriodEnd: data.subscription.cancelAtPeriodEnd,
      };
    }

    return { isActive: false };
  } catch (error) {
    console.error('Failed to fetch subscription:', error);
    throw error;
  }
}
```

**UI Display:**
```jsx
// Subscription Status Component
<div className="subscription-status">
  <h2>Current Plan: {subscription.plan.name}</h2>
  <p className="price">₹{subscription.plan.priceInRupees}/{subscription.plan.period}</p>
  <p className="credits">{subscription.plan.creditsPerCycle} credits per billing cycle</p>

  {subscription.cancelAtPeriodEnd ? (
    <div className="alert warning">
      Your subscription will be cancelled on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
    </div>
  ) : (
    <p className="next-billing">
      Next billing: {new Date(subscription.nextPaymentAt).toLocaleDateString()}
    </p>
  )}

  <div className="actions">
    {subscription.token.canUpgrade && (
      <button onClick={handleUpgrade}>Upgrade Plan</button>
    )}
    <button onClick={handleCancel}>Cancel Subscription</button>
  </div>
</div>
```

---

## 4. Change Plan (Upgrade/Downgrade)

**Endpoint:** `POST /api/subscriptions/change-plan`

**Description:** Upgrade or downgrade subscription plan.

**Request (Immediate Upgrade):**
```json
{
  "clerkId": "user_2abc123def456",
  "subscriptionId": "sub_RTho5FHdXyP2bR",
  "newPlanId": 2,
  "changeMode": "immediate",
  "reason": "Need more credits for project"
}
```

**Request (Cycle-End Downgrade):**
```json
{
  "clerkId": "user_2abc123def456",
  "subscriptionId": "sub_RTho5FHdXyP2bR",
  "newPlanId": 1,
  "changeMode": "cycle_end",
  "reason": "Reducing costs"
}
```

**Response (Successful Direct Update):**
```json
{
  "success": true,
  "requiresReauthorization": false,
  "message": "Upgrade successful! You kept your 800 credits and received 500 additional credits from the new plan.",
  "changeDetails": {
    "fromPlan": {
      "id": 1,
      "name": "Starter Plan",
      "price": 49900,
      "priceInRupees": 499
    },
    "toPlan": {
      "id": 2,
      "name": "Pro Plan",
      "price": 99900,
      "priceInRupees": 999
    },
    "effectiveDate": "2025-01-15T10:30:00Z",
    "changeMode": "immediate",
    "requestedChangeMode": "immediate"
  },
  "proration": {
    "chargeAmount": 25000,
    "chargeAmountInRupees": 250,
    "refundAmount": 0,
    "refundAmountInRupees": 0,
    "unusedDays": 15,
    "totalDaysInCycle": 30,
    "effectiveDate": "2025-01-15T10:30:00Z"
  },
  "creditAdjustment": {
    "currentCredits": 800,
    "immediateCredits": 500,
    "nextCycleCredits": 2500,
    "description": "Prorated credits for remaining 15 days"
  },
  "summary": {
    "title": "Immediate Upgrade",
    "description": "Your plan will be upgraded immediately with prorated charges",
    "steps": [
      "You'll be charged ₹250 for the remaining 15 days",
      "You'll receive 500 additional credits immediately",
      "Next billing cycle will start with full 2500 credits"
    ]
  }
}
```

**Response (Cancel+Recreate Workflow):**
```json
{
  "success": true,
  "message": "Plan change successful! Your old subscription will be cancelled at the end of the current period (2/15/2025), and your new Pro Plan plan will start immediately after.",
  "workflow": "cancel+recreate",
  "changeDetails": {
    "fromPlan": {
      "id": 1,
      "name": "Starter Plan",
      "price": 49900,
      "priceInRupees": 499,
      "status": "cancelled_at_cycle_end"
    },
    "toPlan": {
      "id": 2,
      "name": "Pro Plan",
      "price": 99900,
      "priceInRupees": 999,
      "status": "created"
    },
    "oldSubscriptionId": "sub_RTho5FHdXyP2bR",
    "newSubscriptionId": "sub_RTiQrAOwmqR6Rj",
    "effectiveDate": "2025-02-15T00:00:00Z",
    "shortUrl": "https://rzp.io/rzp/2TZ5t5W"
  },
  "credits": {
    "preserved": true,
    "message": "Your existing credits are preserved and will remain available",
    "remainingCredits": 800
  },
  "nextSteps": [
    "Complete payment for your new Pro Plan subscription using the link provided",
    "Your old subscription will continue until 2/15/2025",
    "After that, your new subscription will take over automatically"
  ]
}
```

**Error Response:**
```json
{
  "success": false,
  "errors": [
    "Cannot downgrade in the middle of billing cycle with credits used"
  ],
  "warnings": [
    "You have used 200 credits. Downgrading now would lose these credits."
  ]
}
```

**Frontend Implementation:**
```javascript
async function changePlan(clerkId, subscriptionId, newPlanId, changeMode = 'immediate') {
  try {
    const response = await fetch('http://localhost:3000/api/subscriptions/change-plan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        clerkId,
        subscriptionId,
        newPlanId,
        changeMode, // 'immediate' or 'cycle_end'
        reason: 'User requested plan change',
      }),
    });

    const data = await response.json();

    if (data.success) {
      // Check if cancel+recreate workflow was used
      if (data.workflow === 'cancel+recreate') {
        // Show modal with payment link
        showPaymentModal({
          title: 'Complete Your Plan Change',
          message: data.message,
          paymentUrl: data.changeDetails.shortUrl,
          oldPlan: data.changeDetails.fromPlan.name,
          newPlan: data.changeDetails.toPlan.name,
          effectiveDate: new Date(data.changeDetails.effectiveDate),
          preservedCredits: data.credits.remainingCredits,
          nextSteps: data.nextSteps,
        });
      } else {
        // Direct plan change successful
        showSuccessMessage(data.message);

        // Show proration details if applicable
        if (data.proration.chargeAmount > 0) {
          showProrationDetails({
            charge: data.proration.chargeAmountInRupees,
            unusedDays: data.proration.unusedDays,
            totalDays: data.proration.totalDaysInCycle,
          });
        }

        // Refresh subscription status
        await refreshSubscriptionStatus();
      }
    } else {
      showError(data.errors.join(', '));

      // Show warnings if any
      if (data.warnings && data.warnings.length > 0) {
        showWarnings(data.warnings);
      }
    }
  } catch (error) {
    console.error('Failed to change plan:', error);
    showError('Failed to change plan. Please try again.');
  }
}
```

**UI Flow:**
```jsx
// Plan Change Component
function PlanChangeModal({ currentPlan, targetPlan, onConfirm, onCancel }) {
  const [changeMode, setChangeMode] = useState('immediate');
  const isUpgrade = targetPlan.priceInRupees > currentPlan.priceInRupees;

  return (
    <div className="modal">
      <h2>
        {isUpgrade ? 'Upgrade' : 'Downgrade'} to {targetPlan.name}
      </h2>

      <div className="plan-comparison">
        <div className="current-plan">
          <h3>Current: {currentPlan.name}</h3>
          <p>₹{currentPlan.priceInRupees}/{currentPlan.period}</p>
          <p>{currentPlan.creditsPerCycle} credits</p>
        </div>
        <div className="arrow">→</div>
        <div className="new-plan">
          <h3>New: {targetPlan.name}</h3>
          <p>₹{targetPlan.priceInRupees}/{targetPlan.period}</p>
          <p>{targetPlan.creditsPerCycle} credits</p>
        </div>
      </div>

      {isUpgrade && (
        <div className="change-mode">
          <label>
            <input
              type="radio"
              value="immediate"
              checked={changeMode === 'immediate'}
              onChange={(e) => setChangeMode(e.target.value)}
            />
            Upgrade Immediately (prorated charge applies)
          </label>
          <label>
            <input
              type="radio"
              value="cycle_end"
              checked={changeMode === 'cycle_end'}
              onChange={(e) => setChangeMode(e.target.value)}
            />
            Upgrade at Next Billing Cycle (no additional charge now)
          </label>
        </div>
      )}

      {!isUpgrade && (
        <div className="info">
          <p>Downgrades always happen at the end of your current billing cycle.</p>
          <p>You'll keep all your current benefits until then.</p>
        </div>
      )}

      <div className="actions">
        <button onClick={() => onConfirm(changeMode)}>Confirm Change</button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}
```

---

## 5. Cancel Subscription

**Endpoint:** `POST /api/subscriptions/cancel`

**Description:** Cancel user's subscription (immediate or at period end).

**Request (Cancel at Period End):**
```json
{
  "clerkId": "user_2abc123def456",
  "subscriptionId": "sub_RTho5FHdXyP2bR",
  "cancelAtPeriodEnd": true,
  "reason": "No longer needed"
}
```

**Request (Cancel Immediately):**
```json
{
  "clerkId": "user_2abc123def456",
  "subscriptionId": "sub_RTho5FHdXyP2bR",
  "cancelAtPeriodEnd": false,
  "reason": "Changed my mind"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Subscription will be cancelled at the end of the current billing period",
  "cancelledAt": "2025-02-15T00:00:00Z"
}
```

**Frontend Implementation:**
```javascript
async function cancelSubscription(clerkId, subscriptionId, immediate = false) {
  try {
    // Show confirmation dialog
    const confirmed = await showConfirmDialog({
      title: immediate ? 'Cancel Immediately?' : 'Cancel at Period End?',
      message: immediate
        ? 'Your subscription will be cancelled immediately and you will lose access.'
        : 'Your subscription will be cancelled at the end of your current billing period. You will keep access until then.',
      confirmText: 'Yes, Cancel',
      cancelText: 'No, Keep Subscription',
    });

    if (!confirmed) return;

    const response = await fetch('http://localhost:3000/api/subscriptions/cancel', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        clerkId,
        subscriptionId,
        cancelAtPeriodEnd: !immediate,
        reason: 'User requested cancellation',
      }),
    });

    const data = await response.json();

    if (data.success) {
      showSuccessMessage(data.message);

      if (!immediate) {
        showInfo(`You will keep access until ${new Date(data.cancelledAt).toLocaleDateString()}`);
      }

      await refreshSubscriptionStatus();
    } else {
      showError(data.error);
    }
  } catch (error) {
    console.error('Failed to cancel subscription:', error);
    showError('Failed to cancel subscription. Please try again.');
  }
}
```

**UI Component:**
```jsx
// Cancel Subscription Component
function CancelSubscriptionDialog({ subscription, onConfirm, onCancel }) {
  const [immediate, setImmediate] = useState(false);

  return (
    <div className="modal danger">
      <h2>Cancel Subscription</h2>

      <div className="current-plan-info">
        <p><strong>Current Plan:</strong> {subscription.plan.name}</p>
        <p><strong>Next Billing:</strong> {new Date(subscription.nextPaymentAt).toLocaleDateString()}</p>
        <p><strong>Remaining Credits:</strong> {subscription.remainingCredits}</p>
      </div>

      <div className="cancel-options">
        <label>
          <input
            type="radio"
            checked={!immediate}
            onChange={() => setImmediate(false)}
          />
          <div>
            <strong>Cancel at Period End (Recommended)</strong>
            <p>Keep access until {new Date(subscription.currentPeriodEnd).toLocaleDateString()}</p>
          </div>
        </label>

        <label>
          <input
            type="radio"
            checked={immediate}
            onChange={() => setImmediate(true)}
          />
          <div>
            <strong>Cancel Immediately</strong>
            <p>Lose access right away, no refund for unused time</p>
          </div>
        </label>
      </div>

      <div className="warning">
        {immediate ? (
          <p>⚠️ You will lose access immediately and forfeit any remaining credits.</p>
        ) : (
          <p>ℹ️ You will keep full access until your billing period ends.</p>
        )}
      </div>

      <div className="actions">
        <button className="danger" onClick={() => onConfirm(immediate)}>
          Confirm Cancellation
        </button>
        <button onClick={onCancel}>Keep Subscription</button>
      </div>
    </div>
  );
}
```

---

## 6. Pause Subscription

**Endpoint:** `POST /api/subscriptions/pause`

**Description:** Pause active subscription (now or at cycle end).

**Request:**
```json
{
  "clerkId": "user_2abc123def456",
  "subscriptionId": "sub_RTho5FHdXyP2bR",
  "pauseAt": "cycle_end"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Subscription will be paused at the end of the current billing period",
  "pausedAt": "2025-02-15T00:00:00Z"
}
```

---

## 7. Resume Subscription

**Endpoint:** `POST /api/subscriptions/resume`

**Description:** Resume paused subscription.

**Request:**
```json
{
  "clerkId": "user_2abc123def456",
  "subscriptionId": "sub_RTho5FHdXyP2bR",
  "resumeAt": "now"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Subscription resumed successfully",
  "resumedAt": "2025-01-15T10:30:00Z"
}
```

---

## 8. Get Payment History

**Endpoint:** `GET /api/subscriptions/history?clerkId={clerkId}&page=1&limit=10`

**Description:** Get user's subscription payment history.

**Request:**
```http
GET /api/subscriptions/history?clerkId=user_2abc123def456&page=1&limit=10
```

**Response:**
```json
{
  "success": true,
  "transactions": [
    {
      "id": 456,
      "razorpayPaymentId": "pay_RTho5FHdXyP2bR",
      "amount": 49900,
      "amountInRupees": 499,
      "currency": "INR",
      "status": "success",
      "creditsAwarded": 1000,
      "billingPeriodStart": "2025-01-15T00:00:00Z",
      "billingPeriodEnd": "2025-02-15T00:00:00Z",
      "billingCycle": 3,
      "paymentMethod": "card",
      "createdAt": "2025-01-15T10:45:00Z",
      "planName": "Starter Plan",
      "planPeriod": "monthly"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "hasMore": false
  }
}
```

**UI Component:**
```jsx
// Payment History Component
function PaymentHistory({ clerkId }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPaymentHistory();
  }, [clerkId]);

  async function fetchPaymentHistory() {
    const response = await fetch(
      `http://localhost:3000/api/subscriptions/history?clerkId=${clerkId}&page=1&limit=10`
    );
    const data = await response.json();

    if (data.success) {
      setTransactions(data.transactions);
    }
    setLoading(false);
  }

  return (
    <div className="payment-history">
      <h2>Payment History</h2>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Plan</th>
            <th>Amount</th>
            <th>Credits</th>
            <th>Status</th>
            <th>Payment ID</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map(tx => (
            <tr key={tx.id}>
              <td>{new Date(tx.createdAt).toLocaleDateString()}</td>
              <td>{tx.planName}</td>
              <td>₹{tx.amountInRupees}</td>
              <td>{tx.creditsAwarded} credits</td>
              <td className={`status-${tx.status}`}>{tx.status}</td>
              <td className="payment-id">{tx.razorpayPaymentId}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

## Implementation Workflows

### Workflow 1: New Subscription Purchase

```javascript
// Step 1: Display available plans
async function showPlansPage() {
  const plans = await fetchPlans();

  return (
    <div className="plans-grid">
      {plans.map(plan => (
        <PlanCard
          key={plan.id}
          plan={plan}
          onSelect={() => handlePlanSelection(plan.id)}
        />
      ))}
    </div>
  );
}

// Step 2: Create subscription
async function handlePlanSelection(planId) {
  try {
    const clerkId = getCurrentUserClerkId();

    // Create subscription
    const response = await fetch('http://localhost:3000/api/subscriptions/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clerkId,
        planId,
        customerEmail: user.email,
        customerPhone: user.phone,
      }),
    });

    const data = await response.json();

    if (data.success) {
      // Open Razorpay Checkout
      openRazorpayCheckout({
        key: data.razorpayKeyId,
        subscription_id: data.subscription.razorpaySubscriptionId,
        name: 'Your Company',
        description: data.subscription.plan.name,
        prefill: {
          email: user.email,
          contact: user.phone,
        },
        theme: {
          color: '#667eea',
        },
        handler: function (response) {
          // Payment successful
          console.log('Payment ID:', response.razorpay_payment_id);
          console.log('Subscription ID:', response.razorpay_subscription_id);

          // Redirect to success page
          window.location.href = '/subscription/success';
        },
        modal: {
          ondismiss: function() {
            console.log('Payment cancelled by user');
          }
        }
      });
    } else {
      showError(data.error);
    }
  } catch (error) {
    console.error('Subscription creation failed:', error);
    showError('Failed to create subscription');
  }
}

// Step 3: Payment completion (handled by Razorpay webhook)
// Your webhook handler will:
// - Receive subscription.activated event
// - Award credits to user
// - Update subscription status in database

// Step 4: Show success page
function SubscriptionSuccessPage() {
  useEffect(() => {
    // Fetch updated subscription status
    refreshSubscriptionStatus();
  }, []);

  return (
    <div className="success-page">
      <h1>✅ Subscription Activated!</h1>
      <p>Your credits have been added to your account.</p>
      <button onClick={() => navigate('/dashboard')}>
        Go to Dashboard
      </button>
    </div>
  );
}
```

---

### Workflow 2: Plan Upgrade (Immediate)

```javascript
async function handleImmediateUpgrade(newPlanId) {
  try {
    const clerkId = getCurrentUserClerkId();
    const currentSubscription = await getSubscriptionStatus(clerkId);

    // Show upgrade preview
    const confirmed = await showUpgradePreview({
      currentPlan: currentSubscription.plan,
      newPlan: await getPlanDetails(newPlanId),
      changeMode: 'immediate',
    });

    if (!confirmed) return;

    // Execute upgrade
    const response = await fetch('http://localhost:3000/api/subscriptions/change-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clerkId,
        subscriptionId: currentSubscription.razorpaySubscriptionId,
        newPlanId,
        changeMode: 'immediate',
        reason: 'User requested upgrade',
      }),
    });

    const data = await response.json();

    if (data.success) {
      // Check if cancel+recreate workflow was used
      if (data.workflow === 'cancel+recreate') {
        // Show payment modal
        showPaymentRequiredModal({
          message: data.message,
          paymentUrl: data.changeDetails.shortUrl,
          newPlan: data.changeDetails.toPlan,
          effectiveDate: data.changeDetails.effectiveDate,
          nextSteps: data.nextSteps,
        });
      } else {
        // Direct upgrade successful
        showSuccessMessage(
          `Upgraded to ${data.changeDetails.toPlan.name}! ` +
          `${data.creditAdjustment.immediateCredits} credits added.`
        );

        // Show proration details
        if (data.proration.chargeAmount > 0) {
          showInfo(
            `Prorated charge of ₹${data.proration.chargeAmountInRupees} ` +
            `for ${data.proration.unusedDays} remaining days.`
          );
        }

        // Refresh UI
        await refreshSubscriptionStatus();
      }
    } else {
      showError(data.errors.join(', '));
    }
  } catch (error) {
    console.error('Upgrade failed:', error);
    showError('Failed to upgrade plan');
  }
}
```

---

### Workflow 3: Plan Downgrade (Cycle End)

```javascript
async function handleDowngrade(newPlanId) {
  try {
    const clerkId = getCurrentUserClerkId();
    const currentSubscription = await getSubscriptionStatus(clerkId);

    // Show downgrade confirmation
    const confirmed = await showDowngradeConfirmation({
      currentPlan: currentSubscription.plan,
      newPlan: await getPlanDetails(newPlanId),
      effectiveDate: currentSubscription.currentPeriodEnd,
      remainingCredits: currentSubscription.remainingCredits,
    });

    if (!confirmed) return;

    // Execute downgrade (always cycle_end)
    const response = await fetch('http://localhost:3000/api/subscriptions/change-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clerkId,
        subscriptionId: currentSubscription.razorpaySubscriptionId,
        newPlanId,
        changeMode: 'cycle_end',
        reason: 'User requested downgrade',
      }),
    });

    const data = await response.json();

    if (data.success) {
      // Check if cancel+recreate workflow was used
      if (data.workflow === 'cancel+recreate') {
        showSuccessMessage(
          `Downgrade scheduled! Your current plan will continue until ` +
          `${new Date(data.changeDetails.effectiveDate).toLocaleDateString()}. ` +
          `Complete payment for your new plan using the link provided.`
        );

        // Show payment link
        showPaymentLink({
          url: data.changeDetails.shortUrl,
          newPlan: data.changeDetails.toPlan,
          effectiveDate: data.changeDetails.effectiveDate,
        });
      } else {
        showSuccessMessage(
          `Downgrade scheduled to ${data.changeDetails.toPlan.name}! ` +
          `Effective from ${new Date(data.changeDetails.effectiveDate).toLocaleDateString()}.`
        );
      }

      showInfo(
        `You'll keep your current ${currentSubscription.plan.name} benefits and ` +
        `${currentSubscription.remainingCredits} credits until then.`
      );

      // Refresh UI
      await refreshSubscriptionStatus();
    } else {
      showError(data.errors.join(', '));
    }
  } catch (error) {
    console.error('Downgrade failed:', error);
    showError('Failed to downgrade plan');
  }
}
```

---

## Payment Integration

### Razorpay Checkout Integration

**1. Include Razorpay Script:**
```html
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```

**2. Open Razorpay Checkout:**
```javascript
function openRazorpayCheckout(subscriptionData) {
  const options = {
    key: subscriptionData.razorpayKeyId,
    subscription_id: subscriptionData.subscription.razorpaySubscriptionId,
    name: 'Your Company Name',
    description: subscriptionData.subscription.plan.name,
    image: 'https://your-logo-url.com/logo.png',

    // Prefill customer details
    prefill: {
      email: user.email,
      contact: user.phone,
    },

    // Theme customization
    theme: {
      color: '#667eea',
    },

    // Success handler
    handler: function (response) {
      console.log('✅ Payment successful!');
      console.log('Payment ID:', response.razorpay_payment_id);
      console.log('Subscription ID:', response.razorpay_subscription_id);
      console.log('Signature:', response.razorpay_signature);

      // Show success message
      showSuccessMessage('Payment completed successfully!');

      // Redirect to dashboard
      window.location.href = '/dashboard';
    },

    // Payment modal dismissed
    modal: {
      ondismiss: function() {
        console.log('⚠️ Payment cancelled by user');
        showInfo('Payment was cancelled. You can try again anytime.');
      }
    }
  };

  // Create and open Razorpay instance
  const rzp = new Razorpay(options);

  // Handle payment failure
  rzp.on('payment.failed', function (response) {
    console.error('❌ Payment failed:', response.error);
    showError(
      `Payment failed: ${response.error.description}. ` +
      `Reason: ${response.error.reason || 'Payment declined'}`
    );
  });

  // Open checkout
  rzp.open();
}
```

**3. Local HTML Payment Page (Fallback):**

If Razorpay short URLs fail, use local HTML payment page:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Complete Payment</title>
  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
</head>
<body>
  <button id="payBtn" onclick="openRazorpayCheckout()">
    Pay ₹{amount}
  </button>

  <script>
    const subscriptionData = {
      razorpayKeyId: 'YOUR_KEY_ID',
      subscriptionId: 'sub_RTiQrAOwmqR6Rj', // Use NEW subscription ID
      customerId: 'cust_RTOqkynvT3SxCa',
      planName: 'Pro Plan',
      amount: 999
    };

    function openRazorpayCheckout() {
      const options = {
        key: subscriptionData.razorpayKeyId,
        subscription_id: subscriptionData.subscriptionId,
        name: 'Your Company',
        description: subscriptionData.planName,
        prefill: {
          email: 'user@example.com',
          contact: '+919876543210'
        },
        theme: {
          color: '#667eea'
        },
        handler: function (response) {
          console.log('Payment successful!', response);
          alert('Payment completed! Your subscription is now active.');
          window.location.href = '/dashboard';
        },
        modal: {
          ondismiss: function() {
            console.log('Payment cancelled');
          }
        }
      };

      const rzp = new Razorpay(options);
      rzp.open();
    }
  </script>
</body>
</html>
```

---

## Error Handling

### Common Errors

**1. User Already Has Active Subscription:**
```json
{
  "success": false,
  "error": "User already has an active subscription",
  "subscriptionId": "sub_existing123"
}
```
**UI Action:** Redirect to subscription management page or show current plan.

---

**2. Subscription Not Found:**
```json
{
  "success": false,
  "error": "Active subscription not found"
}
```
**UI Action:** Refresh subscription status or redirect to pricing page.

---

**3. Payment Method Restriction (UPI/Card):**
```json
{
  "success": true,
  "workflow": "cancel+recreate",
  "message": "Plan change successful! Complete payment for your new subscription.",
  "changeDetails": {
    "shortUrl": "https://rzp.io/rzp/xxx"
  }
}
```
**UI Action:** Show payment link modal with instructions.

---

**4. Invalid Plan Change:**
```json
{
  "success": false,
  "errors": [
    "Cannot downgrade in the middle of billing cycle with credits used"
  ],
  "warnings": [
    "You have used 200 credits. Downgrading now would lose these credits."
  ]
}
```
**UI Action:** Show error message with suggestions (e.g., "Try downgrading at cycle end instead").

---

### Error Handling Pattern

```javascript
async function apiRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      // Handle API errors
      if (data.error) {
        throw new Error(data.error);
      } else if (data.errors) {
        throw new Error(data.errors.join(', '));
      } else {
        throw new Error('Request failed');
      }
    }

    // Show warnings if any
    if (data.warnings && data.warnings.length > 0) {
      showWarnings(data.warnings);
    }

    return data;
  } catch (error) {
    console.error('API request failed:', error);

    // Show user-friendly error
    if (error.message.includes('subscription')) {
      showError('Subscription operation failed. Please try again.');
    } else if (error.message.includes('payment')) {
      showError('Payment processing failed. Please check your payment method.');
    } else {
      showError('Something went wrong. Please try again.');
    }

    throw error;
  }
}
```

---

## UI/UX Recommendations

### 1. Subscription Status Display

**Always Show:**
- Current plan name
- Billing amount and period
- Next billing date
- Credits per cycle
- Remaining credits (if applicable)
- Cancellation status (if scheduled)

**Example:**
```jsx
<div className="subscription-card">
  <div className="plan-header">
    <h3>{subscription.plan.name}</h3>
    {subscription.cancelAtPeriodEnd && (
      <span className="badge danger">Cancels on {cancelDate}</span>
    )}
  </div>

  <div className="plan-details">
    <div className="detail">
      <span className="label">Billing:</span>
      <span className="value">₹{subscription.plan.priceInRupees}/{subscription.plan.period}</span>
    </div>

    <div className="detail">
      <span className="label">Next Payment:</span>
      <span className="value">{nextPaymentDate}</span>
    </div>

    <div className="detail">
      <span className="label">Credits:</span>
      <span className="value">{subscription.plan.creditsPerCycle} per cycle</span>
    </div>
  </div>

  <div className="actions">
    <button onClick={handleUpgrade}>Upgrade Plan</button>
    <button onClick={handleCancel}>Cancel Subscription</button>
  </div>
</div>
```

---

### 2. Plan Comparison

**Show Side-by-Side:**
- All available plans
- Price per month (even for yearly plans)
- Credits per cycle
- Key features
- Current plan indicator

**Example:**
```jsx
<div className="plans-comparison">
  {plans.map(plan => (
    <div
      key={plan.id}
      className={`plan-card ${plan.id === currentPlan?.id ? 'current' : ''}`}
    >
      {plan.tags === 'popular' && (
        <div className="badge popular">Most Popular</div>
      )}

      <h3>{plan.name}</h3>
      <p className="price">
        ₹{plan.priceInRupees}
        <span className="period">/{plan.period}</span>
      </p>

      {plan.period === 'yearly' && (
        <p className="price-per-month">₹{plan.pricePerMonth}/month</p>
      )}

      <p className="credits">{plan.creditsPerCycle} credits</p>

      <ul className="features">
        {plan.features.map(feature => (
          <li key={feature}>✓ {feature}</li>
        ))}
      </ul>

      {plan.id === currentPlan?.id ? (
        <button disabled>Current Plan</button>
      ) : plan.priceInRupees > (currentPlan?.priceInRupees || 0) ? (
        <button onClick={() => handleUpgrade(plan.id)}>Upgrade</button>
      ) : (
        <button onClick={() => handleDowngrade(plan.id)}>Downgrade</button>
      )}
    </div>
  ))}
</div>
```

---

### 3. Cancel+Recreate Workflow Modal

**When cancel+recreate workflow triggers, show clear instructions:**

```jsx
function PaymentRequiredModal({ data, onClose }) {
  return (
    <div className="modal">
      <h2>🎉 Plan Change Confirmed!</h2>

      <div className="info-box success">
        <p>{data.message}</p>
      </div>

      <div className="plan-change-summary">
        <div className="old-plan">
          <h4>Current Plan</h4>
          <p>{data.changeDetails.fromPlan.name}</p>
          <p>₹{data.changeDetails.fromPlan.priceInRupees}</p>
          <span className="badge">Cancels at cycle end</span>
        </div>

        <div className="arrow">→</div>

        <div className="new-plan">
          <h4>New Plan</h4>
          <p>{data.changeDetails.toPlan.name}</p>
          <p>₹{data.changeDetails.toPlan.priceInRupees}</p>
          <span className="badge success">Starts after payment</span>
        </div>
      </div>

      {data.credits.preserved && (
        <div className="info-box">
          <p>✅ Your {data.credits.remainingCredits} existing credits are preserved!</p>
        </div>
      )}

      <div className="next-steps">
        <h4>Next Steps:</h4>
        <ol>
          {data.nextSteps.map((step, idx) => (
            <li key={idx}>{step}</li>
          ))}
        </ol>
      </div>

      <div className="actions">
        <button
          className="primary"
          onClick={() => window.open(data.changeDetails.shortUrl, '_blank')}
        >
          Complete Payment Now
        </button>
        <button onClick={onClose}>I'll Pay Later</button>
      </div>
    </div>
  );
}
```

---

### 4. Loading States

**Show loading indicators for:**
- Fetching plans
- Creating subscription
- Changing plans
- Cancelling subscription
- Processing payment

**Example:**
```jsx
function SubscriptionManager() {
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  if (loading) {
    return <LoadingSpinner message="Loading subscription details..." />;
  }

  return (
    <div>
      {processing && (
        <div className="overlay">
          <LoadingSpinner message="Processing your request..." />
        </div>
      )}

      {/* Subscription content */}
    </div>
  );
}
```

---

### 5. Confirmation Dialogs

**Always confirm destructive actions:**
- Plan downgrades
- Subscription cancellations
- Immediate cancellations

**Example:**
```jsx
async function showConfirmDialog({ title, message, confirmText, cancelText }) {
  return new Promise((resolve) => {
    // Show modal
    const modal = createModal({
      title,
      message,
      buttons: [
        {
          text: cancelText || 'Cancel',
          onClick: () => {
            closeModal();
            resolve(false);
          },
        },
        {
          text: confirmText || 'Confirm',
          className: 'danger',
          onClick: () => {
            closeModal();
            resolve(true);
          },
        },
      ],
    });

    showModal(modal);
  });
}
```

---

## Testing Guide

### Test Scenarios

#### 1. New Subscription Creation
- [ ] Select plan from pricing page
- [ ] Complete payment with Card
- [ ] Complete payment with UPI
- [ ] Verify credits awarded after activation
- [ ] Check subscription status shows correct plan
- [ ] Verify token creation (Card only)

#### 2. Immediate Upgrade
- [ ] Upgrade to higher plan with "immediate" mode
- [ ] Check proration charge applied correctly
- [ ] Verify additional credits awarded
- [ ] Test cancel+recreate workflow for UPI

#### 3. Cycle-End Downgrade
- [ ] Downgrade to lower plan with "cycle_end" mode
- [ ] Verify current plan continues until period end
- [ ] Check new plan activates after period end
- [ ] Confirm credits preserved

#### 4. Subscription Cancellation
- [ ] Cancel at period end
- [ ] Cancel immediately
- [ ] Verify access continues (period end)
- [ ] Verify access revoked (immediate)

#### 5. Payment Failure Handling
- [ ] Test failed payment
- [ ] Verify error messages displayed
- [ ] Check retry flow works

#### 6. Token-Based Upgrades
- [ ] Verify Card subscriptions have token after first payment
- [ ] Test seamless upgrade with valid token
- [ ] Test UPI upgrade triggers cancel+recreate

### Test Data

**Test Razorpay Credentials:**
```
Key ID: rzp_test_RSY3LkXrab6gQY
Key Secret: [Get from Razorpay Dashboard]
```

**Test Card Numbers:**
```
Success: 4111 1111 1111 1111
Failure: 4242 4242 4242 4242
CVV: Any 3 digits
Expiry: Any future date
```

**Test UPI IDs:**
```
Success: success@razorpay
Failure: failure@razorpay
```

### Postman Collection

Import the provided Postman collection for API testing:
```
/Users/manmindersingh/Desktop/codeppup/production-backend-codepup/Razorpay_Subscriptions.postman_collection.json
```

---

## Important Notes

### 1. Credit Expiry Policy
- Credits expire 2 MONTHS from award date (not billing cycle end)
- Provides buffer time beyond billing period
- Consistent with purchased credits policy

### 2. Plan Change Restrictions
- **Downgrades:** Always cycle-end to prevent credit loss
- **Upgrades:** Can be immediate or cycle-end (user choice)
- **Cancel+Recreate:** Automatic fallback for payment method restrictions

### 3. Payment Method Differences

**Card:**
- Token created automatically after first payment
- Seamless recurring charges
- Direct plan updates may fail (cancel+recreate fallback)

**UPI:**
- No token creation
- Manual authorization each cycle
- Plan updates always trigger cancel+recreate workflow

**E-Mandate/Nach:**
- Token-based recurring
- Supports scheduled plan updates
- Highest authorization limits

### 4. Cancel+Recreate Workflow
This is NOT an error - it's the industry-standard approach for handling plan changes when direct API updates aren't supported by the payment method. Benefits:
- Works universally for all payment methods
- User keeps access until paid period ends
- Credits automatically preserved (userId-based)
- Full audit trail maintained
- Similar to Stripe's recommended approach

### 5. Webhook Dependencies
The subscription system relies on webhooks for:
- Credit allocation (subscription.activated, subscription.charged)
- Token extraction (subscription.activated)
- Status updates (subscription.cancelled, subscription.paused, etc.)

Ensure webhooks are properly configured in Razorpay Dashboard.

---

## Support & Troubleshooting

### Common Issues

**Issue 1: "User already has an active subscription"**
- **Cause:** User trying to create second subscription
- **Solution:** Redirect to subscription management page, allow plan change instead

**Issue 2: Token fields are null/false**
- **Cause:** UPI payment method (expected behavior)
- **Solution:** No action needed - cancel+recreate handles plan changes

**Issue 3: Plan change requires new payment**
- **Cause:** Cancel+recreate workflow triggered (payment method restriction)
- **Solution:** Show payment link modal with clear instructions

**Issue 4: Credits not awarded after payment**
- **Cause:** Webhook not received or failed
- **Solution:** Check webhook logs in Razorpay Dashboard, verify endpoint is accessible

**Issue 5: Razorpay short URL not working**
- **Cause:** Razorpay hosted page error or configuration issue
- **Solution:** Use local HTML payment page as fallback (see Payment Integration section)

---

## Backend Developer Contact

For any backend-related questions or issues:
- Review this guide thoroughly
- Check Postman collection for API examples
- Verify webhook logs in Razorpay Dashboard
- Contact: [Your Backend Contact Info]

---

## Additional Resources

- **Razorpay Subscriptions API:** https://razorpay.com/docs/api/subscriptions/
- **Razorpay Checkout:** https://razorpay.com/docs/checkout/
- **Webhook Events:** https://razorpay.com/docs/webhooks/
- **Test Cards:** https://razorpay.com/docs/payments/payments/test-card-details/

---

**Last Updated:** January 2025
**Version:** 1.0.0
