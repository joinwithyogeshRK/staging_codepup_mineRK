import type {
  SubscriptionPlan,
  CreateSubscriptionRequest,
  CreateSubscriptionResponse,
  SubscriptionStatusResponse,
  ChangePlanRequest,
  ChangePlanResponse,
  CancelSubscriptionRequest,
  CancelSubscriptionResponse,
  PaymentHistoryResponse,
  ApiError,
} from '../types/subscription.types';

const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:3000';

/**
 * Get authorization token from Clerk
 */
async function getAuthToken(): Promise<string | null> {
  // This will be called from components that have access to Clerk's getToken
  // We return null here as a placeholder - actual token will be passed from components
  return null;
}

/**
 * Fetch all available subscription plans
 */
export async function fetchPlans(): Promise<SubscriptionPlan[]> {
  try {
    const response = await fetch(`${BASE_URL}/api/subscriptions/plans`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Failed to fetch plans`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch plans');
    }

    return data.plans;
  } catch (error) {
    console.error('Error fetching plans:', error);
    throw error;
  }
}

/**
 * Create a new subscription
 */
export async function createSubscription(
  request: CreateSubscriptionRequest,
  token: string | null
): Promise<CreateSubscriptionResponse> {
  try {
    const response = await fetch(`${BASE_URL}/api/subscriptions/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(request),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to create subscription');
    }

    return data;
  } catch (error) {
    console.error('Error creating subscription:', error);
    throw error;
  }
}

/**
 * Get user's subscription status
 */
export async function getSubscriptionStatus(
  clerkId: string,
  token: string | null
): Promise<SubscriptionStatusResponse> {
  try {
    const response = await fetch(
      `${BASE_URL}/api/subscriptions/status?clerkId=${encodeURIComponent(clerkId)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Failed to fetch subscription status`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch subscription status');
    }

    return data;
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    throw error;
  }
}

/**
 * Change subscription plan (upgrade or downgrade)
 */
export async function changePlan(
  request: ChangePlanRequest,
  token: string | null
): Promise<ChangePlanResponse> {
  try {
    const response = await fetch(`${BASE_URL}/api/subscriptions/change-plan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(request),
    });

    const data = await response.json();

    if (!response.ok) {
      if (data.errors) {
        throw new Error(data.errors.join(', '));
      }
      throw new Error(data.error || 'Failed to change plan');
    }

    return data;
  } catch (error) {
    console.error('Error changing plan:', error);
    throw error;
  }
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(
  request: CancelSubscriptionRequest,
  token: string | null
): Promise<CancelSubscriptionResponse> {
  try {
    const response = await fetch(`${BASE_URL}/api/subscriptions/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(request),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to cancel subscription');
    }

    return data;
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    throw error;
  }
}

/**
 * Pause subscription
 */
export async function pauseSubscription(
  clerkId: string,
  subscriptionId: string,
  pauseAt: 'now' | 'cycle_end',
  token: string | null
): Promise<{ success: boolean; message: string; pausedAt?: string }> {
  try {
    const response = await fetch(`${BASE_URL}/api/subscriptions/pause`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        clerkId,
        subscriptionId,
        pauseAt,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to pause subscription');
    }

    return data;
  } catch (error) {
    console.error('Error pausing subscription:', error);
    throw error;
  }
}

/**
 * Resume subscription
 */
export async function resumeSubscription(
  clerkId: string,
  subscriptionId: string,
  resumeAt: 'now' | 'cycle_end',
  token: string | null
): Promise<{ success: boolean; message: string; resumedAt?: string }> {
  try {
    const response = await fetch(`${BASE_URL}/api/subscriptions/resume`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        clerkId,
        subscriptionId,
        resumeAt,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to resume subscription');
    }

    return data;
  } catch (error) {
    console.error('Error resuming subscription:', error);
    throw error;
  }
}

/**
 * Get payment history
 */
export async function getPaymentHistory(
  clerkId: string,
  page: number = 1,
  limit: number = 10,
  token: string | null
): Promise<PaymentHistoryResponse> {
  try {
    const response = await fetch(
      `${BASE_URL}/api/subscriptions/history?clerkId=${encodeURIComponent(clerkId)}&page=${page}&limit=${limit}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Failed to fetch payment history`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch payment history');
    }

    return data;
  } catch (error) {
    console.error('Error fetching payment history:', error);
    throw error;
  }
}
