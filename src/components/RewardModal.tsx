import React from "react";

type RewardModalProps = {
  message: React.ReactNode; // allow rich JSX instead of just string
  onClose: () => void;
};

const RewardModal: React.FC<RewardModalProps> = ({ message, onClose }) => {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-[90%] p-8 z-[201] animate-scaleIn">
        {/* Close */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 text-xl hover:cursor-pointer"
        >
          ×
        </button>

        <div className="mt-2 text-center space-y-4">
          {/* Main message */}
          <div className="text-xl text-slate-900 font-medium leading-relaxed">
            {message}
          </div>
        </div>
      </div>

      {/* Animations (can go to index.css) */}
      <style>
        {`
          @keyframes scaleIn {
            0% { transform: scale(0.8); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
          }
          .animate-scaleIn {
            animation: scaleIn 0.3s ease-out;
          }
        `}
      </style>
    </div>
  );
};

export default RewardModal;
