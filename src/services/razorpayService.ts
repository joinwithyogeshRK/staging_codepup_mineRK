import type {
  RazorpayCheckoutOptions,
  RazorpayResponse,
  CreateSubscriptionResponse,
} from '../types/subscription.types';

// Extend Window interface to include Razorpay
declare global {
  interface Window {
    Razorpay?: any;
  }
}

/**
 * Load Razorpay checkout script dynamically
 */
export async function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    // Check if script is already loaded
    if (document.getElementById('razorpay-checkout-script')) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.id = 'razorpay-checkout-script';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;

    script.onload = () => {
      console.log('Razorpay script loaded successfully');
      resolve(true);
    };

    script.onerror = () => {
      console.error('Failed to load Razorpay script');
      resolve(false);
    };

    document.body.appendChild(script);
  });
}

/**
 * Open Razorpay Checkout for subscription payment
 */
export async function openRazorpayCheckout(
  subscriptionData: CreateSubscriptionResponse,
  userEmail: string,
  userPhone: string,
  onSuccess: (response: RazorpayResponse) => void,
  onDismiss?: () => void,
  onError?: (error: any) => void
): Promise<void> {
  try {
    // Load script if not already loaded
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      throw new Error('Failed to load Razorpay payment gateway');
    }

    // Check if Razorpay is available
    if (!window.Razorpay) {
      throw new Error('Razorpay is not available');
    }

    const options: RazorpayCheckoutOptions = {
      key: subscriptionData.razorpayKeyId,
      subscription_id: subscriptionData.subscription.razorpaySubscriptionId,
      name: 'CodePup',
      description: subscriptionData.subscription.plan.name,
      prefill: {
        email: userEmail,
        contact: userPhone,
      },
      theme: {
        color: '#3b82f6', // Subtle blue
      },
      handler: (response: RazorpayResponse) => {
        console.log('Payment successful:', response);
        onSuccess(response);
      },
      modal: {
        ondismiss: () => {
          console.log('Payment cancelled by user');
          if (onDismiss) {
            onDismiss();
          }
        },
      },
    };

    // Create Razorpay instance
    const razorpayInstance = new window.Razorpay(options);

    // Handle payment failure
    razorpayInstance.on('payment.failed', (response: any) => {
      console.error('Payment failed:', response.error);
      if (onError) {
        onError(response.error);
      }
    });

    // Open checkout
    razorpayInstance.open();
  } catch (error) {
    console.error('Error opening Razorpay checkout:', error);
    if (onError) {
      onError(error);
    }
    throw error;
  }
}

/**
 * Open payment link in new tab (fallback for cancel+recreate workflow)
 */
export function openPaymentLink(url: string): void {
  const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
  if (!newWindow) {
    // Fallback if popup is blocked
    window.location.href = url;
  }
}

/**
 * Format amount in rupees for display
 */
export function formatAmountInRupees(amountInPaise: number): string {
  const rupees = amountInPaise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(rupees);
}

/**
 * Get user-friendly payment method name
 */
export function getPaymentMethodName(method: string): string {
  const methodMap: Record<string, string> = {
    card: 'Credit/Debit Card',
    upi: 'UPI',
    netbanking: 'Net Banking',
    wallet: 'Wallet',
    emandate: 'E-Mandate',
    nach: 'NACH',
  };
  return methodMap[method.toLowerCase()] || method;
}

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format date with time for display
 */
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Calculate days remaining until date
 */
export function getDaysRemaining(dateString: string): number {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}
