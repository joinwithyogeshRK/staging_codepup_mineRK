import React from "react";
import { motion } from "framer-motion";
import { Home } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function NotFoundPage() {
  const navigate = useNavigate();

  function goHome() {
    navigate("/");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-rose-50 to-amber-50 p-6 relative overflow-hidden">
      {/* Decorative paw prints */}
      <div className="pointer-events-none absolute inset-0 opacity-10">
        <div className="absolute -left-10 top-16 rotate-12">
          <img src="/favicon.ico" alt="Paw" className="w-12 h-12" />
        </div>
        <div className="absolute left-24 top-40 -rotate-6">
          <img src="/favicon.ico" alt="Paw" className="w-10 h-10" />
        </div>
        <div className="absolute right-10 bottom-24 rotate-6">
          <img src="/favicon.ico" alt="Paw" className="w-14 h-14" />
        </div>
        <div className="absolute right-24 top-10 -rotate-12">
          <img src="/favicon.ico" alt="Paw" className="w-9 h-9" />
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl w-full bg-white/80 backdrop-blur-md shadow-xl rounded-2xl p-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-center border border-white/60"
      >
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 px-3 flex items-center justify-center rounded-xl bg-gradient-to-r from-sky-500 to-pink-500 text-white text-2xl font-bold">
              404
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold">Oops! Our pup got distracted chasing a squirrel 🐕💨</h1>
              <p className="text-sm text-slate-600">The page you’re sniffing for isn’t here.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <p className="text-slate-700">Let’s get you back to a comfy spot.</p>
          </div>

          <div className="pt-2">
            <button
              onClick={goHome}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl shadow-sm hover:shadow-md transition bg-sky-600 text-white hover:bg-sky-700"
            >
              <Home size={16} /> Take me home
            </button>
          </div>
        </div>

        <motion.div
          initial={{ scale: 0.98 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 80 }}
          className="flex-1 flex flex-col items-center justify-center"
        >
          {/* Lost bot animation (kept) */}
          <motion.div
            whileHover={{ y: -8 }}
            className="relative w-64 h-64 rounded-2xl bg-gradient-to-tr from-sky-50 to-pink-50 flex items-center justify-center"
          >
            <motion.div
              animate={{ rotate: [0, -6, 6, 0] }}
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
              className="w-40 h-40 rounded-xl bg-white/90 shadow-lg flex items-center justify-center flex-col"
            >
              {/* <div className="text-4xl">🤖</div> */}
              <img src="/main.png" className="h-24" />
              <div className="text-sm text-slate-600">Lost puppy</div>
            </motion.div>

            <motion.span
              animate={{ x: [ -60, -40, -20, -60 ] }}
              transition={{ repeat: Infinity, duration: 4 }}
              className="absolute left-6 top-6 w-3 h-3 rounded-full bg-sky-300"
            />
            <motion.span
              animate={{ x: [ 40, 20, 10, 40 ] }}
              transition={{ repeat: Infinity, duration: 5 }}
              className="absolute right-6 bottom-10 w-4 h-4 rounded-full bg-pink-300"
            />
          </motion.div>

          {/* Small puppy hint */}
          <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
            <img src="/favicon.ico" alt="Paw" className="w-4 h-4" />
            <span>Tip: Head home — we’ll guide you from there.</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}