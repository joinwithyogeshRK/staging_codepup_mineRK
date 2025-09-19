import { useEffect, useState, useCallback } from "react";

type CreditPayload = {
  signup?: number;
  daily?: number;
};

type UserPayload = {
  newUser?: boolean;
  updatedAt?: string;
};

interface UseEvaluateRewardsOptions {
  userPayload?: UserPayload;
  creditsPayload?: CreditPayload;
  didSyncUser: boolean;
  fetchCredits: () => void;
  MAX_CREDITS_RETRIES?: number;
}

export function useEvaluateRewards({
  userPayload,
  creditsPayload,
  didSyncUser,
  fetchCredits,
  MAX_CREDITS_RETRIES = 5,
}: UseEvaluateRewardsOptions) {
  const [rewardsEvaluated, setRewardsEvaluated] = useState(false);
  const [activeReward, setActiveReward] = useState<React.ReactNode | null>(null);
  const [creditsRetryCount, setCreditsRetryCount] = useState(0);

  useEffect(() => {
    if (rewardsEvaluated) return;
    if (!didSyncUser) return;
    if (!userPayload || !creditsPayload) return;

    const u = userPayload;
    const c = creditsPayload;

    if (
      u?.newUser &&
      typeof c?.signup === "number" &&
      c.signup <= 0 &&
      creditsRetryCount < MAX_CREDITS_RETRIES
    ) {
      setTimeout(() => {
        fetchCredits();
        setCreditsRetryCount((prev) => prev + 1);
      }, 800);
      return;
    }

    if (u && typeof u === "object") {
      if (u.newUser) {
        if (c && typeof c === "object" && typeof c.signup === "number") {
          setActiveReward(
            <>
              🎉 Welcome to{" "}
              <span className="font-semibold text-blue-600">CodePup AI</span>!
              <br />
              Congrats! You’ve received{" "}
              <span className="font-bold text-green-600">{c.signup} tokens</span>{" "}
              as signup bonus.
            </>
          );
        } else if (
          c &&
          typeof c === "object" &&
          typeof c.daily === "number" &&
          c.daily > 0
        ) {
          setActiveReward(
            <>
              ✨ Congratulations! You are awarded{" "}
              <span className="font-bold text-green-600">{c.daily} tokens</span>{" "}
              as your daily login bonus.
            </>
          );
        }
      } else if (u.updatedAt) {
        const updatedAtUtc = new Date(u.updatedAt);
        const nowUtc = new Date();
        const d1 = Date.UTC(
          updatedAtUtc.getUTCFullYear(),
          updatedAtUtc.getUTCMonth(),
          updatedAtUtc.getUTCDate()
        );
        const d2 = Date.UTC(
          nowUtc.getUTCFullYear(),
          nowUtc.getUTCMonth(),
          nowUtc.getUTCDate()
        );
        if (
          d1 !== d2 &&
          c &&
          typeof c === "object" &&
          typeof c.daily === "number" &&
          c.daily > 0
        ) {
          setActiveReward(
            <>
              ✨ Congratulations! You are awarded{" "}
              <span className="font-bold text-green-600">{c.daily} tokens</span>{" "}
              as your daily login bonus.
            </>
          );
        }
      } else {
        // Fallback: after retries, still no credits for new user
        if (
          u.newUser &&
          creditsRetryCount >= MAX_CREDITS_RETRIES &&
          !(c && typeof c === "object" && typeof c.signup === "number" && c.signup > 0) &&
          !(c && typeof c === "object" && typeof c.daily === "number" && c.daily > 0)
        ) {
          setActiveReward(
            <>
              Arf! 🐶 Your account is all set. <br />
              Our pup is still fetching your{" "}
              <span className="font-bold text-green-600"> signup bonus.</span>{" "}
              Don’t worry it’ll show up soon! 🐾
            </>
          );
        }
      }
    }

    setRewardsEvaluated(true);
  }, [
    userPayload,
    creditsPayload,
    rewardsEvaluated,
    didSyncUser,
    creditsRetryCount,
    fetchCredits,
    MAX_CREDITS_RETRIES,
  ]);

  // Expose activeReward and a function to clear it (close reward popup)
  return {
    activeReward,
    setActiveReward,
    rewardsEvaluated,
    resetRewards: () => setRewardsEvaluated(false),
  };
}
