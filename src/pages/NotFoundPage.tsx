import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Home, Search, RefreshCw } from "lucide-react";

import { useNavigate } from "react-router-dom";

export default function NotFoundPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [hintIndex, setHintIndex] = useState(0);

  const hints = [
    "Try the homepage — it's usually a good start",
    "Check the URL for typos",
    "Use the site search to find a similar page",
  ];

  useEffect(() => {
    const t = setInterval(() => setHintIndex((i) => (i + 1) % hints.length), 4200);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!query.trim()) return setSuggestions([]);
    const q = query.toLowerCase();
    const pool = [
      "/",
      "/login",
      "/signup",
      "/dashboard",
      "/blog",
      "/pricing",
    ];
    setSuggestions(pool.filter((p) => p.includes(q)).slice(0, 5));
  }, [query]);

  function goHome() {
    navigate("/");
  }

  function trySuggestion(path: string) {
    navigate(path);
  }

  function refresh() {
    setQuery("");
    setSuggestions([]);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl w-full bg-white shadow-xl rounded-2xl p-8 grid grid-cols-1 md:grid-cols-2 gap-6 items-center"
      >
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-pink-500 text-white text-2xl font-bold">
              404
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold">Page not found</h1>
              <p className="text-sm text-slate-500">We couldn't find the page you're looking for.</p>
            </div>
          </div>

          <p className="text-slate-600">{hints[hintIndex]}</p>

          <div className="flex gap-3 flex-wrap">
            <button
              onClick={goHome}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl shadow-sm hover:shadow-md transition"
            >
              <Home size={16} /> Take me home
            </button>

            <button
              onClick={refresh}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border hover:bg-slate-50 transition"
            >
              <RefreshCw size={14} /> Try again
            </button>
          </div>

          <div className="mt-2">
            <label className="text-xs text-slate-500">Search this site</label>
            <div className="mt-2 flex items-center gap-2">
              <Search size={16} className="opacity-70" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search pages, e.g. 'blog' or 'pricing'"
                className="flex-1 outline-none px-3 py-2 rounded-lg border focus:border-indigo-400"
              />
            </div>

            {suggestions.length > 0 && (
              <motion.ul
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-2 space-y-2 bg-slate-50 p-3 rounded-lg"
              >
                {suggestions.map((s) => (
                  <li key={s}>
                    <button
                      onClick={() => trySuggestion(s)}
                      className="w-full text-left p-2 rounded-md hover:bg-white/60"
                    >
                      {s}
                    </button>
                  </li>
                ))}
              </motion.ul>
            )}
          </div>

          <div className="text-xs text-slate-400">If you're a dev: check your routes — sometimes the path changed.</div>
        </div>

        <motion.div
          initial={{ scale: 0.98 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 80 }}
          className="flex-1 flex flex-col items-center justify-center"
        >
          <motion.div
            whileHover={{ y: -8 }}
            className="relative w-64 h-64 rounded-2xl bg-gradient-to-tr from-indigo-50 to-pink-50 flex items-center justify-center"
          >
            <motion.div
              animate={{ rotate: [0, -6, 6, 0] }}
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
              className="w-40 h-40 rounded-xl bg-white/90 shadow-lg flex items-center justify-center flex-col"
            >
              <div className="text-4xl font-extrabold">🤖</div>
              <div className="text-sm text-slate-600">Lost bot</div>
            </motion.div>

            <motion.span
              animate={{ x: [ -60, -40, -20, -60 ] }}
              transition={{ repeat: Infinity, duration: 4 }}
              className="absolute left-6 top-6 w-3 h-3 rounded-full bg-indigo-300"
            />
            <motion.span
              animate={{ x: [ 40, 20, 10, 40 ] }}
              transition={{ repeat: Infinity, duration: 5 }}
              className="absolute right-6 bottom-10 w-4 h-4 rounded-full bg-pink-300"
            />
          </motion.div>

          <div className="mt-6 w-full text-center text-sm text-slate-500">
            Tip: Press <kbd className="border rounded px-2 py-1 bg-white">Esc</kbd> to focus search
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}