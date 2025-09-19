import React, { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";

type ToastType = "success" | "error";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
}

interface ToastContextType {
  showToast: (message: string, type: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback(
    (message: string, type: ToastType, duration?: number) => {
      const id = Math.random().toString(36).substr(2, 9);
      const autoDuration = duration ?? Math.min(6000, Math.max(2500, message.length * 60));
      const newToast: Toast = { id, message, type, duration: autoDuration };

      setToasts(prev => {
        if (prev.some(t => t.message === message && t.type === type)) {
          return prev;
        }
        return [...prev, newToast];
      });

      setTimeout(() => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
      }, autoDuration);
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      <div className="fixed top-5 right-5 w-80 z-[9999]">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.3 }}
              className={`mb-3 p-3 rounded-lg shadow-md cursor-pointer ${
                toast.type === "success" ? "bg-green-600 text-white" : "bg-red-500 text-white"
              }`}
              onClick={() => removeToast(toast.id)}
              title="Click to dismiss"
            >
              {toast.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
};
