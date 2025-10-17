import React from 'react';
import { X, ArrowRight, CheckCircle, ExternalLink } from 'lucide-react';
import { Dialog, DialogContent } from '../ui/dialog';
import type { ChangePlanResponse } from '../../types/subscription.types';
import { formatDate, openPaymentLink } from '../../services/razorpayService';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  planChangeData: ChangePlanResponse;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  planChangeData,
}) => {
  const handleCompletePayment = () => {
    if (planChangeData.changeDetails.shortUrl) {
      openPaymentLink(planChangeData.changeDetails.shortUrl);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <div className="relative">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-0 right-0 p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="mb-6">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900">
              Plan Change Confirmed!
            </h2>
            <p className="text-sm text-gray-600 mt-2">
              {planChangeData.message}
            </p>
          </div>

          {/* Plan comparison */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              {/* From plan */}
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-500 mb-1">Current Plan</p>
                <p className="text-base font-semibold text-gray-900">
                  {planChangeData.changeDetails.fromPlan.name}
                </p>
                <p className="text-sm text-gray-600">
                  ₹{planChangeData.changeDetails.fromPlan.priceInRupees}
                </p>
                {planChangeData.changeDetails.fromPlan.status && (
                  <span className="inline-block mt-2 px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded">
                    Cancels at cycle end
                  </span>
                )}
              </div>

              {/* Arrow */}
              <div className="mx-6">
                <ArrowRight className="w-6 h-6 text-gray-400" />
              </div>

              {/* To plan */}
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-500 mb-1">New Plan</p>
                <p className="text-base font-semibold text-gray-900">
                  {planChangeData.changeDetails.toPlan.name}
                </p>
                <p className="text-sm text-gray-600">
                  ₹{planChangeData.changeDetails.toPlan.priceInRupees}
                </p>
                {planChangeData.changeDetails.toPlan.status && (
                  <span className="inline-block mt-2 px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
                    Starts after payment
                  </span>
                )}
              </div>
            </div>

            {/* Effective date */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Effective Date:</span>{' '}
                {formatDate(planChangeData.changeDetails.effectiveDate)}
              </p>
            </div>
          </div>

          {/* Credits info */}
          {planChangeData.credits?.preserved && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-900">
                    Your credits are preserved!
                  </p>
                  <p className="text-sm text-green-700 mt-1">
                    {planChangeData.credits.message}
                  </p>
                  <p className="text-sm font-semibold text-green-900 mt-2">
                    Remaining: {planChangeData.credits.remainingCredits} credits
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Next steps */}
          {planChangeData.nextSteps && planChangeData.nextSteps.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                What happens next:
              </h3>
              <ol className="space-y-2">
                {planChangeData.nextSteps.map((step, index) => (
                  <li key={index} className="flex items-start text-sm text-gray-700">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs font-medium mr-2 flex-shrink-0 mt-0.5">
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleCompletePayment}
              className="flex-1 flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Complete Payment Now
              <ExternalLink className="w-4 h-4 ml-2" />
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              I'll Pay Later
            </button>
          </div>

          {/* Footer note */}
          <p className="mt-4 text-xs text-gray-500 text-center">
            You can complete the payment anytime before {formatDate(planChangeData.changeDetails.effectiveDate)}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;
