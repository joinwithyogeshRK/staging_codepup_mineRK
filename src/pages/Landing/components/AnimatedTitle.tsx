import React from "react";
import { motion } from "framer-motion";

const AnimatedTitle: React.FC = () => {
  return (
    <motion.div
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{
        duration: 1.2,
        ease: "easeOut",
        delay: 0.3,
      }}
      className="flex flex-col items-center justify-center md:flex-row mb-8 mt-10 "
      // className="flex flex-col items-center justify-center mb-8 mt-10 "
    >
      {/* Logo */}
      <motion.div
        animate={{
          filter: [
            "drop-shadow(0 0 0px rgba(255,255,255,0))",
            "drop-shadow(0 0 20px rgba(255,255,255,0.3))",
            "drop-shadow(0 0 0px rgba(255,255,255,0))",
          ],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <img
          src="/main.png"
          alt="CodePup Logo"
          className="w-24 h-24 md:w-32 md:h-32 object-contain"
        />
      </motion.div>

      {/* Title */}
      <motion.h1
        className="text-6xl px-2 md:text-8xl text-gray-800 font-bold tracking-tighter"
        animate={{
          textShadow: [
            "0 0 0px rgba(255,255,255,0)",
            "0 0 20px rgba(255,255,255,0.1)",
            "0 0 0px rgba(255,255,255,0)",
          ],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        CodePup
      </motion.h1>
    </motion.div>
  );
};

export default AnimatedTitle;
