// Subscription System Types

export interface SubscriptionPlan {
  id: number;
  name: string;
  description: string;
  razorpayPlanId: string;
  period: 'monthly' | 'yearly';
  interval: number;
  price: number; // in paise
  priceInRupees: number;
  pricePerMonth: number;
  currency: string;
  creditsPerCycle: number;
  trialPeriodDays: number;
  features: string[];
  maxProjects?: number;
  maxTeamMembers?: number;
  tags?: string;
  isActive: boolean;
  isVisible: boolean;
  sortOrder?: number;
}

export interface TokenInfo {
  hasToken: boolean;
  status: string;
  maxAmount?: number;
  maxAmountInRupees?: number;
  method?: string;
  isValid: boolean;
  isConfirmed: boolean;
  hasMaxAmount: boolean;
  canUpgrade: boolean;
  validationReason?: string;
  createdAt?: string;
  confirmedAt?: string;
}

export interface Subscription {
  id: number;
  razorpaySubscriptionId: string;
  razorpayCustomerId: string;
  status: string;
  isPending: boolean;
  isActive: boolean;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  billingCycleCount: number;
  nextPaymentAt: string;
  cancelAtPeriodEnd: boolean;
  startedAt?: string;
  activatedAt?: string;
  createdAt: string;
  plan: SubscriptionPlan;
  remaining?: {
    cycles: number;
    total: number;
    paid: number;
  };
  token: TokenInfo;
}

export interface CreateSubscriptionRequest {
  clerkId: string;
  planId: number;
  customerEmail: string;
  customerPhone: string;
}

export interface CreateSubscriptionResponse {
  success: boolean;
  subscription: {
    id: number;
    razorpaySubscriptionId: string;
    razorpayCustomerId: string;
    status: string;
    plan: SubscriptionPlan;
    shortUrl: string;
    totalCount: number;
    createdAt: string;
  };
  razorpayKeyId: string;
  tokenInfo?: {
    status: string;
    message: string;
    upgradeCapability: string;
    maxAuthorizationTarget: string;
    benefits: string[];
  };
}

export interface SubscriptionStatusResponse {
  success: boolean;
  hasActiveSubscription: boolean;
  subscription: Subscription | null;
}

export interface ChangePlanRequest {
  clerkId: string;
  subscriptionId: string;
  newPlanId: number;
  changeMode: 'immediate' | 'cycle_end';
  reason?: string;
}

export interface ProrationDetails {
  chargeAmount: number;
  chargeAmountInRupees: number;
  refundAmount: number;
  refundAmountInRupees: number;
  unusedDays: number;
  totalDaysInCycle: number;
  effectiveDate: string;
}

export interface CreditAdjustment {
  currentCredits: number;
  immediateCredits: number;
  nextCycleCredits: number;
  description: string;
}

export interface ChangePlanResponse {
  success: boolean;
  requiresReauthorization?: boolean;
  message: string;
  workflow?: 'direct' | 'cancel+recreate';
  razorpayKeyId?: string; // Added for cancel+recreate workflow
  changeDetails: {
    fromPlan: {
      id: number;
      name: string;
      price: number;
      priceInRupees: number;
      status?: string;
    };
    toPlan: {
      id: number;
      name: string;
      price: number;
      priceInRupees: number;
      status?: string;
    };
    effectiveDate: string;
    changeMode: string;
    requestedChangeMode: string;
    oldSubscriptionId?: string;
    newSubscriptionId?: string;
    shortUrl?: string;
  };
  proration?: ProrationDetails;
  creditAdjustment?: CreditAdjustment;
  credits?: {
    preserved: boolean;
    message: string;
    remainingCredits: number;
  };
  summary?: {
    title: string;
    description: string;
    steps: string[];
  };
  nextSteps?: string[];
  errors?: string[];
  warnings?: string[];
}

export interface CancelSubscriptionRequest {
  clerkId: string;
  subscriptionId: string;
  cancelAtPeriodEnd: boolean;
  reason?: string;
}

export interface CancelSubscriptionResponse {
  success: boolean;
  message: string;
  cancelledAt?: string;
  error?: string;
}

export interface PaymentTransaction {
  id: number;
  razorpayPaymentId: string;
  amount: number;
  amountInRupees: number;
  currency: string;
  status: string;
  creditsAwarded: number;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  billingCycle: number;
  paymentMethod: string;
  createdAt: string;
  planName: string;
  planPeriod: string;
}

export interface PaymentHistoryResponse {
  success: boolean;
  transactions: PaymentTransaction[];
  pagination: {
    page: number;
    limit: number;
    hasMore: boolean;
  };
}

export interface RazorpayCheckoutOptions {
  key: string;
  subscription_id?: string;
  amount?: number;
  currency?: string;
  order_id?: string;
  name: string;
  description: string;
  image?: string;
  prefill?: {
    email?: string;
    contact?: string;
    name?: string;
  };
  notes?: Record<string, any>;
  theme?: {
    color: string;
  };
  handler?: (response: RazorpayResponse) => void;
  modal?: {
    ondismiss?: () => void;
  };
}

export interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
}

export interface ApiError {
  success: false;
  error: string;
  errors?: string[];
  warnings?: string[];
}
