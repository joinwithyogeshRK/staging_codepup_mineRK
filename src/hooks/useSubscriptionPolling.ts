import { useCallback, useRef } from 'react';
import { getSubscriptionStatus } from '../services/subscriptionService';

interface PollingOptions {
  clerkId: string;
  token: string | null;
  onSuccess: () => void;
  onTimeout: () => void;
  initialWaitSeconds?: number;
  pollingIntervalSeconds?: number;
  maxPollingAttempts?: number;
}

export const useSubscriptionPolling = () => {
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);
  const initialTimeout = useRef<NodeJS.Timeout | null>(null);
  const attemptCount = useRef(0);

  const stopPolling = useCallback(() => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
    }
    if (initialTimeout.current) {
      clearTimeout(initialTimeout.current);
      initialTimeout.current = null;
    }
    attemptCount.current = 0;
  }, []);

  const startPolling = useCallback(
    async ({
      clerkId,
      token,
      onSuccess,
      onTimeout,
      initialWaitSeconds = 60,
      pollingIntervalSeconds = 3,
      maxPollingAttempts = 20,
    }: PollingOptions) => {
      // Clear any existing polling
      stopPolling();
      attemptCount.current = 0;

      console.log(`Starting subscription polling (initial wait: ${initialWaitSeconds}s)`);

      // Wait for initial period before starting to poll
      initialTimeout.current = setTimeout(async () => {
        console.log('Initial wait complete, starting to poll subscription status...');

        // Start polling
        pollingInterval.current = setInterval(async () => {
          attemptCount.current++;
          console.log(`Polling attempt ${attemptCount.current}/${maxPollingAttempts}`);

          try {
            const statusData = await getSubscriptionStatus(clerkId, token);

            if (statusData.hasActiveSubscription && statusData.subscription?.isActive) {
              console.log('Subscription is now active!', statusData.subscription);
              stopPolling();
              onSuccess();
              return;
            }

            console.log('Subscription not yet active, continuing to poll...', {
              hasActive: statusData.hasActiveSubscription,
              isActive: statusData.subscription?.isActive,
              status: statusData.subscription?.status,
            });

            // Check if we've exceeded max attempts
            if (attemptCount.current >= maxPollingAttempts) {
              console.warn('Max polling attempts reached, timing out');
              stopPolling();
              onTimeout();
            }
          } catch (error) {
            console.error('Error polling subscription status:', error);
            // Continue polling even on error (could be temporary network issue)

            // But stop if we've exceeded max attempts
            if (attemptCount.current >= maxPollingAttempts) {
              console.warn('Max polling attempts reached with errors, timing out');
              stopPolling();
              onTimeout();
            }
          }
        }, pollingIntervalSeconds * 1000);
      }, initialWaitSeconds * 1000);
    },
    [stopPolling]
  );

  return {
    startPolling,
    stopPolling,
  };
};
