import React from "react";
import { motion } from "framer-motion";
import {
    SignedOut,
    SignInButton,
  } from "@clerk/clerk-react";
import * as amplitude from "@amplitude/analytics-browser"; // Adjust import if needed

const SignedOutMessage: React.FC = () => {
  return (
    <SignedOut>
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{
          duration: 1,
          ease: "easeOut",
          delay: 1.2,
        }}
        className="signed-out-container"
      >
        <p className="signed-out-text">
          Please sign in to start building your projects
        </p>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <SignInButton>
            <button
              className="btn-signin"
              onClick={() => amplitude.track("Get Started Clicked")}
            >
              Sign In
            </button>
          </SignInButton>
        </motion.div>
      </motion.div>
    </SignedOut>
  );
};

export default SignedOutMessage;
