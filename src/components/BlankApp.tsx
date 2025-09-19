import React from "react";
import { useAuth } from "@clerk/clerk-react";
import { Loader2, Zap } from "lucide-react";

type Toast = {
  id: string;
  message: string;
  type: "success" | "error";
  duration?: number;
};

type BlankAppProps = {
  projectId: number | null | undefined;
  disableActivate?: boolean;
  onActivationStateChange?: (isActivating: boolean) => void;
};

const BlankApp: React.FC<BlankAppProps> = ({ projectId, disableActivate, onActivationStateChange }) => {
  const { getToken } = useAuth();
  const [isActivating, setIsActivating] = React.useState(false);
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const [activationCompleted, setActivationCompleted] = React.useState(false);
  const [timerStarted, setTimerStarted] = React.useState(false);
  const [countdownTime, setCountdownTime] = React.useState(150); // 2m 30s

  const showToast = (
    message: string,
    type: "success" | "error",
    duration: number = 4000
  ) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: Toast = { id, message, type, duration };
    setToasts((prev) => [...prev, newToast]);
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      duration
    );
  };

  const handleActivate = async () => {
    if (!projectId) {
      showToast("Missing project id", "error");
      return;
    }

    try {
      setIsActivating(true);
      onActivationStateChange?.(true);
      // Start timer on click
      setTimerStarted(true);
      setCountdownTime(150);
      const token = await getToken();
      const baseUrl = import.meta.env.VITE_BASE_URL;

      const response = await fetch(`${baseUrl}/api/container/open`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ projectId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Check if response is streaming
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("text/event-stream")) {
        // Handle streaming response
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("No response body");
        }

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (
              line.startsWith("event: ") &&
              lines[lines.indexOf(line) + 1]?.startsWith("data: ")
            ) {
              const eventType = line.slice(7).trim();
              const dataLine = lines[lines.indexOf(line) + 1];

              try {
                const eventData = JSON.parse(dataLine.slice(6));

                if (eventType === "complete") {
                  showToast(
                    "✅ Your preview will be shown shortly. Please wait...",
                    "success"
                  );
                  setActivationCompleted(true);
                  setTimerStarted(false);
                  setTimeout(() => {
                    window.location.reload();
                  }, 15000);
                  break;
                } else if (eventType === "error") {
                  throw new Error(eventData.error || "Activation failed");
                }
              } catch (e) {
              }
            }
          }
        }
      } else {
        // Handle regular JSON response
        const data = await response.json();
        if (data.success) {
          showToast(
            "✅ Your preview will be shown shortly. Please wait...",
            "success"
          );
          setActivationCompleted(true);
          setTimeout(() => {
            window.location.reload();
          }, 15000);
        } else {
          throw new Error(data.error || "Activation failed");
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Activation failed";
      showToast(msg, "error");
    } finally {
      setIsActivating(false);
      onActivationStateChange?.(false);
    }
  };

  // Countdown timer effect (starts when timerStarted is true)
  React.useEffect(() => {
    if (!timerStarted) return;
    let interval: number | undefined;
    interval = window.setInterval(() => {
      setCountdownTime((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => {
      if (interval) window.clearInterval(interval);
    };
  }, [timerStarted]);

  const formatCountdown = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="w-full h-full flex items-center justify-center bg-placeholder relative">
      {/* Toasts */}
      <div className="fixed top-4 right-4 z-50 space-y-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${
              toast.type === "success"
                ? "bg-green-50 border border-green-200 text-green-800"
                : "bg-red-600 border text-white"
            }`}
          >
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        ))}
      </div>

      <div className="text-center max-w-3xl px-6">
        {/* Icon */}
        <div className="w-20 h-20 rounded-2xl mx-auto flex items-center justify-center ">
          <img src="/main.png" alt="Codepup Logo" className="w-14" />
        </div>

        {/* Main heading */}
        <h2 className="text-3xl font-bold text-slate-800 mb-4 leading-tight">
          Your agent is sleeping
        </h2>

        {/* Description */}
        <p className="text-lg text-slate-600 mb-8 leading-relaxed max-w-2xl mx-auto">
          Due to more than 30 mins of inactivity, your Codepup Agent went to
          Sleep. Please click the button to wake up your Codepup agent!
        </p>

        {/* Action button */}
        <button
          onClick={handleActivate}
          disabled={disableActivate || isActivating || activationCompleted}
          className={`inline-flex items-center gap-3 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 ${
            disableActivate || isActivating
              ? "bg-slate-300 text-slate-500 cursor-not-allowed"
              : activationCompleted
              ? "bg-slate-300 text-slate-500 cursor-not-allowed"
              : "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          }`}
        >
          {isActivating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Activating Agent...
            </>
          ) : activationCompleted ? (
            <>Activated</>
          ) : (
            <>
              <Zap className="w-5 h-5" />
              Activate Agent
            </>
          )}
        </button>
        {/* Countdown Timer (2m 30s) */}
        {timerStarted && (
          <div className="text-center mt-8">
            <div className="text-muted text-sm mb-3 uppercase tracking-wide">
              Time Remaining
            </div>
            <div className="bg-surface-overlay backdrop-blur-sm border border-default-weak rounded-xl shadow-lg p-6 mx-auto w-fit mb-4 timer-breathe">
              <div className="text-6xl font-mono font-black text-strong tracking-wider">
                {formatCountdown(countdownTime)}
              </div>
            </div>
            <div className="w-32 h-1 bg-subtle rounded-full mx-auto overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-1000"
                style={{ width: `${((150 - countdownTime) / 150) * 100}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlankApp;
