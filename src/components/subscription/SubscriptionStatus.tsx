import React from 'react';
import { Calendar, CreditCard, AlertCircle } from 'lucide-react';
import type { Subscription } from '../../types/subscription.types';
import { formatDate, getDaysRemaining } from '../../services/razorpayService';

interface SubscriptionStatusProps {
  subscription: Subscription;
  onManagePlan?: () => void;
  onCancel?: () => void;
  onViewHistory?: () => void;
}

const SubscriptionStatus: React.FC<SubscriptionStatusProps> = ({
  subscription,
  onManagePlan,
  onCancel,
  onViewHistory,
}) => {
  const daysUntilRenewal = getDaysRemaining(subscription.nextPaymentAt);
  const isActive = subscription.isActive;
  const willCancel = subscription.cancelAtPeriodEnd;

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Current Subscription
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {subscription.plan.name}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isActive && !willCancel && (
              <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                Active
              </span>
            )}
            {willCancel && (
              <span className="px-3 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                Cancels on {formatDate(subscription.currentPeriodEnd)}
              </span>
            )}
            {subscription.isPending && (
              <span className="px-3 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full">
                Pending
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6">
        {/* Cancellation warning */}
        {willCancel && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-900">
                Your subscription will be cancelled
              </p>
              <p className="text-sm text-red-700 mt-1">
                You'll keep access until {formatDate(subscription.currentPeriodEnd)}.
                Your credits will remain available until they expire.
              </p>
            </div>
          </div>
        )}

        {/* Subscription details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Billing cycle */}
          <div className="flex items-start">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center mr-3 flex-shrink-0">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Billing Cycle</p>
              <p className="text-sm text-gray-600 mt-1 capitalize">
                {subscription.plan.period}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Cycle {subscription.billingCycleCount} of {subscription.remaining?.total || 'unlimited'}
              </p>
            </div>
          </div>

          {/* Next payment */}
          <div className="flex items-start">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center mr-3 flex-shrink-0">
              <CreditCard className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Next Payment</p>
              <p className="text-sm text-gray-600 mt-1">
                ₹{subscription.plan.priceInRupees}
              </p>
              {!willCancel && (
                <p className="text-xs text-gray-500 mt-1">
                  {formatDate(subscription.nextPaymentAt)} ({daysUntilRenewal} days)
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Credits */}
        <div className="p-4 bg-blue-50 rounded-lg mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Credits Per Cycle</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {subscription.plan.creditsPerCycle.toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-600">Current period</p>
              <p className="text-sm text-gray-900 mt-1">
                {formatDate(subscription.currentPeriodStart)} - {formatDate(subscription.currentPeriodEnd)}
              </p>
            </div>
          </div>
        </div>

        {/* Token info */}
        {subscription.token.hasToken && (
          <div className="p-3 bg-gray-50 rounded-lg mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                <p className="text-sm text-gray-700">
                  Auto-renewal enabled
                  {subscription.token.method && (
                    <span className="text-gray-500"> • {subscription.token.method.toUpperCase()}</span>
                  )}
                </p>
              </div>
              {subscription.token.canUpgrade && (
                <span className="text-xs text-green-600 font-medium">
                  Seamless upgrades available
                </span>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-4">
          {/* Primary action buttons */}
          <div className="flex flex-wrap gap-3">
            {onManagePlan && (
              <button
                onClick={onManagePlan}
                className="flex-1 min-w-[140px] px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                {willCancel ? 'Browse Plans' : 'Manage Plan'}
              </button>
            )}
            {onViewHistory && (
              <button
                onClick={onViewHistory}
                className="flex-1 min-w-[140px] px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                View History
              </button>
            )}
          </div>

          {/* Subtle cancellation link */}
          {onCancel && !willCancel && (
            <div className="text-center pt-2">
              <button
                onClick={onCancel}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors underline"
              >
                Need to cancel your subscription?
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionStatus;
