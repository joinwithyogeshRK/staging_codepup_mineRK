import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";

import { amplitude } from "../utils/amplitude";

const Hackathon: React.FC = () => {
  useEffect(() => {
    amplitude.logEvent('Hackathon_Page_View', { page: 'Hackathon' });
  }, []);
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <header className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-2 text-slate-800 hover:opacity-80"
        >
          <img src="/favicon.ico" alt="CodePup" className="w-8 h-8" />
          <span className="text-lg font-semibold">CodePup</span>
        </Link>
        <Link
          to="/"
          className="px-3 py-2 rounded-lg border border-slate-300 text-slate-800 hover:bg-slate-100 transition-colors"
        >
          Back to Home
        </Link>
      </header>

      <main className="max-w-6xl mx-auto px-4 pb-16">Main</main>
    </div>
  );
};

export default Hackathon;
