# Subscription System Implementation

## Overview

This document describes the newly implemented subscription system that replaces the old one-time credit purchase system (PrizeModel) with a comprehensive Razorpay-based subscription management system.

## What Changed

### Old System (PrizeModel.tsx)
- One-time credit purchases
- Non-functional "Coming soon" placeholder
- Simple pricing cards

### New System (SubscriptionModal)
- Full subscription management with Razorpay
- Monthly/yearly recurring subscriptions
- Plan upgrades and downgrades
- Subscription cancellation and pause/resume
- Payment history tracking
- Token-based recurring payments
- Clean, minimal UI design

## Architecture

### File Structure

```
src/
├── components/
│   └── subscription/
│       ├── SubscriptionModal.tsx       # Main subscription interface
│       ├── SubscriptionStatus.tsx      # Current plan display
│       ├── PlanCard.tsx                # Reusable plan cards
│       ├── PaymentModal.tsx            # Cancel+recreate workflow
│       ├── PaymentHistory.tsx          # Transaction history
│       └── index.ts                    # Exports
├── services/
│   ├── subscriptionService.ts          # API integration
│   └── razorpayService.ts             # Razorpay payment integration
└── types/
    └── subscription.types.ts           # TypeScript definitions
```

## Components

### 1. SubscriptionModal
Main component that handles the entire subscription flow:
- Displays available plans
- Shows current subscription status
- Manages plan changes
- Integrates Razorpay checkout
- Three view modes: Plans, Status, History

**Usage:**
```tsx
import { SubscriptionModal, useSubscriptionModal } from '@/components/subscription';

const MyComponent = () => {
  const { isOpen, openModal, closeModal } = useSubscriptionModal();

  return (
    <>
      <button onClick={openModal}>Subscribe</button>
      <SubscriptionModal isOpen={isOpen} onClose={closeModal} />
    </>
  );
};
```

### 2. SubscriptionStatus
Displays current subscription details:
- Plan information
- Billing cycle
- Next payment date
- Credits per cycle
- Auto-renewal status
- Action buttons (Upgrade, Cancel, View History)

### 3. PlanCard
Reusable component for displaying subscription plans:
- Plan name and description
- Pricing (monthly/yearly)
- Credits per cycle
- Feature list
- Popular badge
- Current plan indicator
- Customizable action button

### 4. PaymentModal
Handles the cancel+recreate workflow when direct plan updates aren't supported:
- Shows plan comparison
- Displays preserved credits
- Lists next steps
- Payment link button

### 5. PaymentHistory
Displays transaction history:
- Date and plan name
- Amount and credits awarded
- Payment method
- Status indicators
- Responsive design (table on desktop, cards on mobile)
- Pagination support

## Services

### subscriptionService.ts
API integration for all subscription operations:
- `fetchPlans()` - Get available plans
- `createSubscription()` - Create new subscription
- `getSubscriptionStatus()` - Get user's subscription
- `changePlan()` - Upgrade/downgrade
- `cancelSubscription()` - Cancel subscription
- `pauseSubscription()` - Pause subscription
- `resumeSubscription()` - Resume subscription
- `getPaymentHistory()` - Get transaction history

### razorpayService.ts
Razorpay payment integration:
- `loadRazorpayScript()` - Load Razorpay SDK
- `openRazorpayCheckout()` - Open payment modal
- `openPaymentLink()` - Open payment URL in new tab
- Utility functions for formatting dates and amounts

## API Endpoints

The frontend integrates with the following backend endpoints:

- `GET /api/subscriptions/plans` - Fetch available plans
- `POST /api/subscriptions/create` - Create new subscription
- `GET /api/subscriptions/status` - Get subscription status
- `POST /api/subscriptions/change-plan` - Change plan
- `POST /api/subscriptions/cancel` - Cancel subscription
- `POST /api/subscriptions/pause` - Pause subscription
- `POST /api/subscriptions/resume` - Resume subscription
- `GET /api/subscriptions/history` - Get payment history

## Key Features

### 1. Plan Selection
Users can browse available subscription plans and select one that fits their needs. Plans display:
- Name and description
- Price (monthly/yearly)
- Credits per billing cycle
- Feature list
- "Most Popular" badge (if applicable)

### 2. Subscription Creation
When a user selects a plan:
1. Frontend calls `/api/subscriptions/create`
2. Backend creates Razorpay subscription
3. Razorpay Checkout modal opens
4. User completes payment
5. Webhook activates subscription and awards credits

### 3. Plan Changes

#### Upgrades (Immediate or Cycle-End)
- User selects higher-tier plan
- Can choose immediate upgrade (prorated charge) or cycle-end upgrade
- Token-based subscriptions allow seamless upgrades
- UPI/Card restrictions trigger cancel+recreate workflow

#### Downgrades (Always Cycle-End)
- User selects lower-tier plan
- Always scheduled for end of current billing period
- Existing credits preserved
- No immediate charge

### 4. Cancel+Recreate Workflow
When direct plan updates aren't supported (UPI, certain card types):
1. Old subscription cancelled at cycle end
2. New subscription created with target plan
3. User keeps access until paid period ends
4. Credits automatically preserved (userId-based)
5. User completes payment for new subscription
6. PaymentModal guides user through process

### 5. Subscription Cancellation
Users can cancel subscriptions:
- **At Period End (Recommended)**: Keep access until billing cycle ends
- **Immediately**: Lose access right away, no refund

### 6. Payment History
Complete transaction history with:
- Date and time
- Plan name and period
- Amount paid and credits awarded
- Payment method
- Status (success, failed, pending)
- Razorpay payment ID

## Design Philosophy

### Clean & Minimal
- Neutral color palette (grays, whites, subtle blue)
- No excessive colors or gradients
- Simple card-based layouts
- Clear typography hierarchy
- Spacious padding and margins

### User Experience
- Progressive disclosure (show details when needed)
- Clear status indicators
- Helpful error messages
- Loading states for all async operations
- Confirmation dialogs for destructive actions
- Mobile-responsive design

## Environment Variables

Required environment variables:
```
VITE_BASE_URL=http://localhost:3000  # Backend API URL
VITE_CLERK_PUBLISHABLE_KEY=pk_...    # Clerk authentication
```

## Backend Requirements

The backend must implement:
1. All subscription API endpoints (see payment-guide.md)
2. Razorpay subscription integration
3. Webhook handlers for subscription events
4. Credit management system
5. User authentication with Clerk

Refer to `/Users/manmindersingh/Desktop/stading-frontend/payment-guide.md` for complete backend implementation details.

## Testing

### Test Flow
1. Open subscription modal
2. Select a plan
3. Complete payment (use Razorpay test cards)
4. Verify subscription status displays correctly
5. Try upgrading plan
6. Check payment history
7. Test cancellation

### Razorpay Test Cards
```
Success: 4111 1111 1111 1111
Failure: 4242 4242 4242 4242
CVV: Any 3 digits
Expiry: Any future date
```

### Test UPI IDs
```
Success: success@razorpay
Failure: failure@razorpay
```

## Migration Notes

### Breaking Changes
The new system completely replaces PrizeModel.tsx. The following changes were made:

1. **Component Name**: `PrizeModel` → `SubscriptionModal`
2. **Hook Name**: `usePrizeModal()` → `useSubscriptionModal()`
3. **Functionality**: One-time purchases → Recurring subscriptions

### Updated Files
- `/src/pages/Landing/Index.tsx` - Updated to use SubscriptionModal
- All imports updated from `PrizeModel` to `SubscriptionModal`

### Old Files
The old `PrizeModel.tsx` is still present in `/src/components/` but is no longer used. It can be removed if desired.

## Troubleshooting

### Razorpay Script Not Loading
- Check network tab for script load errors
- Verify Razorpay CDN is accessible
- Check browser console for errors

### Payment Fails
- Verify backend API is running
- Check Razorpay API keys are correct
- Ensure webhooks are configured in Razorpay Dashboard
- Check backend logs for errors

### Subscription Status Not Updating
- Verify webhooks are firing (check Razorpay Dashboard)
- Check backend webhook handler logs
- Ensure user ID is correct

### Cancel+Recreate Not Working
- Verify shortUrl is returned from backend
- Check payment link is valid
- Ensure popup blockers aren't blocking new tab

## Future Enhancements

Potential improvements:
- Proration preview before upgrading
- Annual plan discount badges
- Team subscription support
- Custom plan creation
- Subscription gifting
- Trial periods
- Coupon codes
- Invoice generation

## Support

For issues or questions:
1. Check browser console for errors
2. Verify backend API is responding
3. Check Razorpay Dashboard for webhook logs
4. Review backend logs for API errors
5. Refer to payment-guide.md for backend implementation details

---

**Last Updated**: January 2025
**Version**: 1.0.0
