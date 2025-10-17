import React, { useState, useEffect, useCallback } from 'react';
import { X, Loader2, AlertCircle } from 'lucide-react';
import { useUser, useAuth } from '@clerk/clerk-react';
import PlanCard from './PlanCard';
import SubscriptionStatus from './SubscriptionStatus';
import PaymentModal from './PaymentModal';
import PaymentHistory from './PaymentHistory';
import PollingLoadingModal from './PollingLoadingModal';
import CancelSubscriptionDialog from './CancelSubscriptionDialog';
import type {
  SubscriptionPlan,
  Subscription,
  ChangePlanResponse,
  RazorpayResponse,
} from '../../types/subscription.types';
import {
  fetchPlans,
  getSubscriptionStatus,
  createSubscription,
  changePlan,
  cancelSubscription,
} from '../../services/subscriptionService';
import { openRazorpayCheckout } from '../../services/razorpayService';
import { useSubscriptionPolling } from '../../hooks/useSubscriptionPolling';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ViewMode = 'plans' | 'status' | 'history';

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ isOpen, onClose }) => {
  const { user } = useUser();
  const { getToken } = useAuth();

  // State
  const [viewMode, setViewMode] = useState<ViewMode>('plans');
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentModalData, setPaymentModalData] = useState<ChangePlanResponse | null>(null);
  const [showPollingModal, setShowPollingModal] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'monthly' | 'yearly'>('monthly');

  // Polling hook
  const { startPolling, stopPolling } = useSubscriptionPolling();

  // Fetch initial data
  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  // Cleanup polling when modal closes
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch plans
      const plansData = await fetchPlans();
      console.log('Fetched plans:', plansData);

      // Ensure features is an array for each plan
      const normalizedPlans = plansData.map(plan => ({
        ...plan,
        features: Array.isArray(plan.features)
          ? plan.features
          : typeof plan.features === 'string'
          ? [plan.features]
          : []
      }));

      setPlans(normalizedPlans);

      // Check subscription status if user is logged in
      if (user?.id) {
        const token = await getToken();
        const statusData = await getSubscriptionStatus(user.id, token);

        if (statusData.hasActiveSubscription && statusData.subscription) {
          setSubscription(statusData.subscription);
          setViewMode('status');
        } else {
          setViewMode('plans');
        }
      }
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError(err.message || 'Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  };

  // Create new subscription
  const handleCreateSubscription = async (planId: number) => {
    if (!user?.id || !user?.primaryEmailAddress?.emailAddress) {
      setError('Please sign in to subscribe');
      return;
    }

    try {
      setProcessing(true);
      setError(null);

      const token = await getToken();
      const response = await createSubscription(
        {
          clerkId: user.id,
          planId,
          customerEmail: user.primaryEmailAddress.emailAddress,
          customerPhone: user.phoneNumbers?.[0]?.phoneNumber || '',
        },
        token
      );

      // Open Razorpay checkout
      await openRazorpayCheckout(
        response,
        user.primaryEmailAddress.emailAddress,
        user.phoneNumbers?.[0]?.phoneNumber || '',
        async (razorpayResponse: RazorpayResponse) => {
          // Payment successful
          console.log('Payment successful:', razorpayResponse);

          // Show polling modal and start polling for subscription activation
          setShowPollingModal(true);

          const token = await getToken();
          startPolling({
            clerkId: user.id,
            token,
            onSuccess: () => {
              console.log('Subscription activated successfully!');
              setShowPollingModal(false);
              // Reload subscription status
              loadData();
            },
            onTimeout: () => {
              console.warn('Subscription activation timed out');
              setShowPollingModal(false);
              setError(
                'Your payment was successful, but subscription activation is taking longer than expected. Please refresh the page or check back in a few minutes.'
              );
              // Still try to reload data
              loadData();
            },
            initialWaitSeconds: 60,
            pollingIntervalSeconds: 3,
            maxPollingAttempts: 20,
          });
        },
        () => {
          // Payment dismissed
          console.log('Payment cancelled by user');
        },
        (error: any) => {
          // Payment failed
          setError(`Payment failed: ${error.description || 'Unknown error'}`);
        }
      );
    } catch (err: any) {
      console.error('Error creating subscription:', err);
      setError(err.message || 'Failed to create subscription');
    } finally {
      setProcessing(false);
    }
  };

  // Handle plan change (upgrade/downgrade)
  const handleChangePlan = async (newPlanId: number, isUpgrade: boolean) => {
    if (!user?.id || !subscription || !user?.primaryEmailAddress?.emailAddress) {
      return;
    }

    try {
      setProcessing(true);
      setError(null);

      const token = await getToken();
      const changeMode = isUpgrade ? 'immediate' : 'cycle_end';

      const response = await changePlan(
        {
          clerkId: user.id,
          subscriptionId: subscription.razorpaySubscriptionId,
          newPlanId,
          changeMode,
          reason: 'User requested plan change',
        },
        token
      );

      if (response.workflow === 'cancel+recreate') {
        // For cancel+recreate, we need to open Razorpay checkout for the new subscription
        console.log('Cancel+recreate workflow triggered:', response);

        // Check if backend returned razorpayKeyId
        const razorpayKeyId = (response as any).razorpayKeyId || import.meta.env.VITE_RAZORPAY_KEY_ID;

        if (!razorpayKeyId) {
          setError('Razorpay key not configured. Please contact support.');
          return;
        }

        // Find the new plan details
        const newPlan = plans.find(p => p.id === newPlanId);

        if (!newPlan) {
          setError('Plan details not found');
          return;
        }

        // Construct subscription response similar to createSubscription
        const checkoutData = {
          success: true,
          razorpayKeyId,
          subscription: {
            id: 0, // Not needed for checkout
            razorpaySubscriptionId: response.changeDetails.newSubscriptionId || '',
            razorpayCustomerId: subscription.razorpayCustomerId,
            status: 'created',
            plan: newPlan,
            shortUrl: response.changeDetails.shortUrl || '',
            totalCount: subscription.remaining?.total || 0,
            createdAt: new Date().toISOString(),
          },
        };

        // Open Razorpay checkout modal
        await openRazorpayCheckout(
          checkoutData,
          user.primaryEmailAddress.emailAddress,
          user.phoneNumbers?.[0]?.phoneNumber || '',
          async (razorpayResponse: RazorpayResponse) => {
            // Payment successful
            console.log('Upgrade payment successful:', razorpayResponse);

            // Show polling modal and start polling for subscription activation
            setShowPollingModal(true);

            const token = await getToken();
            startPolling({
              clerkId: user.id,
              token,
              onSuccess: () => {
                console.log('Plan upgrade activated successfully!');
                setShowPollingModal(false);
                // Reload subscription status
                loadData();
              },
              onTimeout: () => {
                console.warn('Plan upgrade activation timed out');
                setShowPollingModal(false);
                setError(
                  'Your payment was successful, but plan activation is taking longer than expected. Please refresh the page or check back in a few minutes.'
                );
                // Still try to reload data
                loadData();
              },
              initialWaitSeconds: 60,
              pollingIntervalSeconds: 3,
              maxPollingAttempts: 20,
            });
          },
          () => {
            // Payment dismissed
            console.log('Payment cancelled by user');
            setError('Payment was cancelled. You can try upgrading again anytime.');
          },
          (error: any) => {
            // Payment failed
            console.error('Payment failed:', error);
            setError(`Payment failed: ${error.description || 'Unknown error'}`);
          }
        );
      } else {
        // Direct plan change successful
        alert(response.message);
        // Reload subscription status
        loadData();
      }
    } catch (err: any) {
      console.error('Error changing plan:', err);
      setError(err.message || 'Failed to change plan');
    } finally {
      setProcessing(false);
    }
  };

  // Handle opening cancel dialog
  const handleCancelClick = () => {
    setShowCancelDialog(true);
  };

  // Handle actual subscription cancellation
  const handleConfirmCancel = async () => {
    if (!user?.id || !subscription) {
      return;
    }

    try {
      setProcessing(true);
      setError(null);
      setShowCancelDialog(false);

      const token = await getToken();
      const response = await cancelSubscription(
        {
          clerkId: user.id,
          subscriptionId: subscription.razorpaySubscriptionId,
          cancelAtPeriodEnd: true,
          reason: 'User requested cancellation',
        },
        token
      );

      // Show success message
      setError(null);
      // Reload subscription status to show updated state
      await loadData();
    } catch (err: any) {
      console.error('Error cancelling subscription:', err);
      setError(err.message || 'Failed to cancel subscription');
    } finally {
      setProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Main modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative w-full max-w-6xl max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-xl">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>

          {/* Content */}
          <div className="p-8">
            {/* Header */}
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {viewMode === 'plans' && 'Choose Your Plan'}
                {viewMode === 'status' && 'Your Subscription'}
                {viewMode === 'history' && 'Payment History'}
              </h1>
              <p className="text-gray-600">
                {viewMode === 'plans' &&
                  'Select the perfect plan for your needs with flexible billing options'}
                {viewMode === 'status' && 'Manage your subscription and view details'}
                {viewMode === 'history' && 'View all your past transactions'}
              </p>

              {/* Period toggle switch - only show in plans view */}
              {viewMode === 'plans' && (
                <div className="mt-8 flex justify-center">
                  <div className="inline-flex items-center bg-white rounded-full p-1 shadow-sm border border-gray-200">
                    <button
                      onClick={() => setSelectedPeriod('monthly')}
                      className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                        selectedPeriod === 'monthly'
                          ? 'bg-white text-gray-900 shadow-md'
                          : 'bg-transparent text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      onClick={() => setSelectedPeriod('yearly')}
                      className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                        selectedPeriod === 'yearly'
                          ? 'bg-white text-gray-900 shadow-md'
                          : 'bg-transparent text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Yearly{' '}
                      <span className="text-green-600 font-semibold">Save 20%</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Error message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
                <AlertCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-900">Error</p>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            )}

            {/* Loading state */}
            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                <span className="ml-3 text-gray-600">Loading...</span>
              </div>
            )}

            {/* Processing overlay */}
            {processing && (
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-20 rounded-lg">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-700">Processing...</p>
                </div>
              </div>
            )}

            {/* Content based on view mode */}
            {!loading && (
              <>
                {/* Plans view */}
                {viewMode === 'plans' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {plans
                      .filter(plan => plan.period === selectedPeriod)
                      .map((plan) => {
                    const isCurrentPlan = subscription?.plan.id === plan.id;
                    const canUpgrade =
                      subscription &&
                      plan.priceInRupees > subscription.plan.priceInRupees;
                    const canDowngrade =
                      subscription &&
                      plan.priceInRupees < subscription.plan.priceInRupees;

                    return (
                      <PlanCard
                        key={plan.id}
                        plan={plan}
                        isCurrentPlan={isCurrentPlan}
                        isSelected={selectedPlanId === plan.id}
                        onSelect={() => setSelectedPlanId(plan.id)}
                        showDiscount={plan.period === 'yearly'}
                        actionButton={
                          isCurrentPlan ? (
                            <button
                              disabled
                              className="w-full px-6 py-3 bg-gray-100 text-gray-500 rounded-lg font-medium cursor-not-allowed text-sm"
                            >
                              Current Plan
                            </button>
                          ) : subscription ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleChangePlan(plan.id, !!canUpgrade);
                              }}
                              disabled={processing}
                              className="w-full px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium text-sm disabled:opacity-50"
                            >
                              Get Started
                            </button>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCreateSubscription(plan.id);
                              }}
                              disabled={processing}
                              className="w-full px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium text-sm disabled:opacity-50"
                            >
                              Get Started
                            </button>
                          )
                        }
                      />
                    );
                  })}
                  </div>
                )}

                {/* Subscription status view */}
                {viewMode === 'status' && subscription && (
                  <SubscriptionStatus
                    subscription={subscription}
                    onManagePlan={() => setViewMode('plans')}
                    onCancel={handleCancelClick}
                    onViewHistory={() => setViewMode('history')}
                  />
                )}

                {/* Payment history view */}
                {viewMode === 'history' && user?.id && (
                  <PaymentHistory clerkId={user.id} />
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Payment modal for cancel+recreate workflow */}
      {paymentModalData && (
        <PaymentModal
          isOpen={true}
          onClose={() => {
            setPaymentModalData(null);
            loadData();
          }}
          planChangeData={paymentModalData}
        />
      )}

      {/* Polling loading modal for subscription activation */}
      <PollingLoadingModal
        isOpen={showPollingModal}
        onComplete={() => {
          setShowPollingModal(false);
          stopPolling();
          onClose(); // Close parent subscription modal as well
        }}
        initialWaitSeconds={60}
      />

      {/* Cancel subscription confirmation dialog */}
      <CancelSubscriptionDialog
        isOpen={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        onConfirm={handleConfirmCancel}
        subscriptionEndDate={
          subscription?.currentPeriodEnd
            ? new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })
            : undefined
        }
        isProcessing={processing}
      />
    </>
  );
};

// Export hook for easy usage
export const useSubscriptionModal = () => {
  const [isOpen, setIsOpen] = useState(false);

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  return { isOpen, openModal, closeModal };
};

export default SubscriptionModal;
