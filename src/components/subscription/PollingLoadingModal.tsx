import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle, RefreshCw } from 'lucide-react';

interface PollingLoadingModalProps {
  isOpen: boolean;
  onComplete: () => void;
  initialWaitSeconds?: number;
}

const PollingLoadingModal: React.FC<PollingLoadingModalProps> = ({
  isOpen,
  onComplete,
  initialWaitSeconds = 60,
}) => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'waiting' | 'polling' | 'success' | 'timeout'>('waiting');
  const [timeRemaining, setTimeRemaining] = useState(initialWaitSeconds);
  const [message, setMessage] = useState('Processing your payment...');

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes
      setProgress(0);
      setStatus('waiting');
      setTimeRemaining(initialWaitSeconds);
      setMessage('Processing your payment...');
      return;
    }

    // Start countdown during initial wait
    if (status === 'waiting') {
      const interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setStatus('polling');
            setMessage('Activating your subscription...');
            return 0;
          }
          // Update progress based on time remaining (0-50% during wait phase)
          const waitProgress = ((initialWaitSeconds - prev) / initialWaitSeconds) * 50;
          setProgress(Math.round(waitProgress));
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }

    // Progress animation during polling phase
    if (status === 'polling') {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 95) {
            return 95; // Cap at 95% until we get confirmation
          }
          // Slow progression from 50% to 95%
          return prev + 1;
        });
      }, 2000);

      return () => clearInterval(interval);
    }

    // Success state
    if (status === 'success') {
      setProgress(100);
      setMessage('Subscription activated successfully!');
      // Auto-close after showing success
      const timeout = setTimeout(() => {
        onComplete();
      }, 2000);

      return () => clearTimeout(timeout);
    }
  }, [isOpen, status, initialWaitSeconds, onComplete]);

  const handleManualCheck = () => {
    setStatus('polling');
    setTimeRemaining(0);
    setMessage('Checking subscription status...');
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'waiting':
        return `Processing payment... (${timeRemaining}s)`;
      case 'polling':
        return 'Activating your subscription...';
      case 'success':
        return 'Subscription activated successfully!';
      case 'timeout':
        return 'Taking longer than expected...';
      default:
        return 'Processing...';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl p-8">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          {status === 'success' ? (
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            </div>
          )}
        </div>

        {/* Title */}
        <h2 className="text-2xl font-semibold text-gray-900 text-center mb-2">
          {status === 'success' ? 'Success!' : 'Almost There!'}
        </h2>

        {/* Message */}
        <p className="text-center text-gray-600 mb-6">
          {message}
        </p>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                status === 'success' ? 'bg-green-500' : 'bg-blue-600'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Status */}
        <p className="text-center text-sm text-gray-600 mb-4">
          {getStatusMessage()}
        </p>

        {/* Info message */}
        {status === 'waiting' && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800 text-center">
              We're processing your payment and setting up your subscription.
              This usually takes about 1-2 minutes.
            </p>
          </div>
        )}

        {/* Manual check button */}
        {(status === 'waiting' || status === 'timeout') && timeRemaining > 10 && (
          <button
            onClick={handleManualCheck}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            Check Status Now
          </button>
        )}

        {/* Timeout message */}
        {status === 'timeout' && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-800 text-center">
              Your payment was successful, but activation is taking longer than expected.
              You can close this and check your subscription status from your dashboard.
            </p>
            <button
              onClick={onComplete}
              className="mt-3 w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium"
            >
              Close and Check Later
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PollingLoadingModal;
