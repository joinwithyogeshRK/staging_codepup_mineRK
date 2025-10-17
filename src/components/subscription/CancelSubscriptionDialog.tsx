import React from 'react';
import { AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface CancelSubscriptionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  subscriptionEndDate?: string;
  isProcessing?: boolean;
}

const CancelSubscriptionDialog: React.FC<CancelSubscriptionDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  subscriptionEndDate,
  isProcessing = false,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <DialogTitle className="text-xl font-semibold text-gray-900">
              Cancel Subscription?
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm text-gray-600 text-left">
            Are you sure you want to cancel your subscription? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-gray-700">
              <span className="font-medium">What happens next:</span>
            </p>
            <ul className="mt-2 space-y-1 text-sm text-gray-700">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>
                  You'll keep access until{' '}
                  {subscriptionEndDate ? (
                    <span className="font-medium">{subscriptionEndDate}</span>
                  ) : (
                    'the end of your billing period'
                  )}
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Your credits will remain available until they expire</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>No further charges will be made</span>
              </li>
            </ul>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium disabled:opacity-50"
          >
            Keep Subscription
          </button>
          <button
            onClick={onConfirm}
            disabled={isProcessing}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50"
          >
            {isProcessing ? 'Cancelling...' : 'Yes, Cancel'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CancelSubscriptionDialog;
