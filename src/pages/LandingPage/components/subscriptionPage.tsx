import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { SignedIn, SignedOut, SignInButton, useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";

const PricingSection = () => {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "monthly"
  );
  const { user } = useUser();
  const navigate = useNavigate();

  const plans = {
    monthly: [
      {
        name: "Starter",
        description: "Perfect for testing the waters.",
        price: "₹499",
        period: "/month",
        credits: "250 credits per month",
        cta: "Get Started",
      },
      {
        name: "Pro",
        description: "For growing teams and creators.",
        price: "₹999",
        period: "/month",
        credits: "500 credits per month",
        cta: "Get Started",
        popular: true,
      },
    ],
    yearly: [
      {
        name: "Pro Yearly",
        description: "Get 20% off when billed annually.",
        price: "₹9,999",
        period: "/year",
        credits: "500 credits per month",
        subtitle: "₹833/month billed annually",
        cta: "Get Started",
        tag: "20% OFF",
      },
    ],
  };

  const currentPlans = plans[billingCycle];

  // Handle Get Started click
  const handleGetStarted = (planName: string) => {
    if (user) {
      // User is signed in, redirect to home with selected plan
      navigate("/home", { state: { selectedPlan: planName } });
    }
    // If not signed in, SignInButton will handle showing the modal
  };

  return (
    <section
      id="pricing"
      className="relative w-full py-20 -mb-32 bg-[radial-gradient(circle_at_center,_rgba(147,200,253,1.6)_0%,_rgba(219,234,254,0.15)_40%,_white_100%)] text-black overflow-hidden"
    >
      <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-14"
        >
          <h2 className="text-3xl sm:text-5xl font-montserrat   text-gray-800/80  font-bold mb-6">
            Choose Your Plan
          </h2>
          <p className="text-gray-600 font-montserrat italic max-w-2xl mx-auto font-extralight sm:text-base">
            Find the right plan that matches your pace. Switch anytime between
            monthly or yearly billing.
          </p>
        </motion.div>

        {/* Billing Toggle */}
        <div className="flex justify-center -mt-4 mb-12">
          <div className="flex bg-gray-100 border font-extrabold border-gray-200 rounded-full p-1">
            {["monthly", "yearly"].map((type) => (
              <button
                key={type}
                onClick={() => setBillingCycle(type as "monthly" | "yearly")}
                className={`relative px-5 py-2 font-semibold text-sm   rounded-full transition-all ${
                  billingCycle === type
                    ? "bg-blue-400 text-white shadow-sm"
                    : "text-gray-600 hover:text-black"
                }`}
              >
                {type === "yearly" ? (
                  <>
                    Yearly{" "}
                    <span className="ml-1 text-xs text-green-700  font-bold">
                      Save 20%
                    </span>
                  </>
                ) : (
                  "Monthly"
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Plans */}
        <AnimatePresence mode="wait">
          <motion.div
            key={billingCycle}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.35 }}
            className={`grid ${
              billingCycle === "monthly"
                ? "grid-cols-1 sm:grid-cols-2 gap-6"
                : "grid-cols-1 max-w-sm mx-auto"
            } justify-center`}
          >
            {currentPlans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative rounded-2xl border border-gray-200 bg-white hover:shadow-lg transition-all duration-300 scale-[0.96] hover:scale-[0.99]"
              >
                <div className="p-6 flex flex-col justify-between h-full text-left">
                  {plan.tag && (
                    <span className="absolute top-3 right-3 text-[10px] font-medium bg-black text-white px-2 py-0.5 rounded-md">
                      {plan.tag}
                    </span>
                  )}
                  {plan.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-400 text-white text-[10px] font-medium px-2.5 py-1 rounded-full shadow-md">
                      Most Popular
                    </span>
                  )}

                  <div>
                    <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                    <p className="text-gray-600 mb-4 text-sm">
                      {plan.description}
                    </p>

                    <div className="mb-2 flex items-end gap-1">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      <span className="text-gray-500 text-sm font-medium">
                        {plan.period}
                      </span>
                    </div>

                    {plan.subtitle && (
                      <p className="text-gray-500 text-xs mb-3">
                        {plan.subtitle}
                      </p>
                    )}

                    <p className="text-blue-500 bg-blue-100 w-44  p-2 text-center rounded-2xl font-bold text-sm mb-6 mt-5 ">
                      {plan.credits}
                    </p>
                  </div>

                  {/* Get Started Button with Auth */}
                  <SignedOut>
                    <SignInButton mode="modal">
                      <button className="w-full bg-blue-500 text-white py-2.5 rounded-lg font-semibold text-sm hover:scale-105 transition-all">
                        {plan.cta}
                      </button>
                    </SignInButton>
                  </SignedOut>

                  <SignedIn>
                    <button
                      onClick={() => handleGetStarted(plan.name)}
                      className="w-full bg-blue-500 text-white py-2.5 rounded-lg font-semibold text-sm hover:scale-105 transition-all"
                    >
                      {plan.cta}
                    </button>
                  </SignedIn>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
};

export default PricingSection;
