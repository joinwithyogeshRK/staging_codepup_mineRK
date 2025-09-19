import React, { useState, useCallback } from "react";
import { Loader2, Send } from "lucide-react";

type FeedbackInputProps = {
  onSubmit: (feedback: string) => void;
  isLoading: boolean;
  placeholder?: string;
};

const FeedbackInput: React.FC<FeedbackInputProps> = React.memo(
  ({ onSubmit, isLoading, placeholder }) => {
    const [feedback, setFeedback] = useState("");

    const handleSubmit = useCallback(
      (e: React.FormEvent) => {
        e.preventDefault();
        if (feedback.trim() && !isLoading) {
          onSubmit(feedback.trim());
          setFeedback("");
        }
      },
      [feedback, isLoading, onSubmit]
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          handleSubmit(e as any);
        }
        // Allow Shift+Enter for newline
      },
      [handleSubmit]
    );

    return (
      <form onSubmit={handleSubmit} className="flex gap-2">
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || "Share your feedback or ask questions..."}
          className="flex-1 px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 resize-none"
          rows={1}
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={!feedback.trim() || isLoading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors duration-200 flex items-center gap-2"
        >
          {isLoading ? (
            <Loader2 className="size-icon-small animate-spin" />
          ) : (
            <Send className="size-icon-small" />
          )}
        </button>
      </form>
    );
  }
);

export default FeedbackInput;
