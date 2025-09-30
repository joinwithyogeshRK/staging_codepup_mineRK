import React, { useCallback, useMemo, useState } from "react";
import { Check, Sparkles, Zap, Crown, Rocket, X } from "lucide-react";
import { useUser, useAuth } from "@clerk/clerk-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";

const defaultPackages = [
  {
    name: "Starter Pack",
    description: "Perfect for trying out CodePup",
    credits: 200,
    priceInRupees: 1000,
    isActive: true,
    icon: Sparkles,
    popular: false,
    features: [
      "200 AI credits",
      "Basic code generation",
      "Community support",
      "Standard processing speed",
    ],
  },
  {
    name: "Professional Pack",
    description: "For serious developers and teams",
    credits: 450,
    priceInRupees: 1999,
    isActive: true,
    icon: Crown,
    popular: false,
    features: [
      "450 AI credits",
      "Premium code generation",
      "24/7 Priority support",
      "Ultra-fast processing",
      "Advanced optimization",
      "Custom templates",
    ],
  },
  {
    name: "Advance Pack",
    description: "Maximum value for heavy usage",
    credits: 700,
    priceInRupees: 2999,
    isActive: true,
    icon: Rocket,
    popular: false,
    features: [
      "700 AI credits",
      "Unlimited code generation",
      "Dedicated support team",
      "Lightning-fast processing",
      "Custom AI models",
      "Team collaboration",
      "Analytics dashboard",
    ],
  },
];

interface PrizeModelProps {
  isOpen: boolean;
  onClose: () => void;
}

const PrizeModel: React.FC<PrizeModelProps> = ({ isOpen, onClose }) => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
  const [isHovered, setIsHovered] = useState<number | null>(null);
  const [loadingIndex, setLoadingIndex] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successOpen, setSuccessOpen] = useState(false);
  const [successData, setSuccessData] = useState<{
    paymentId: string;
    orderId: string;
    signature: string;
    packName: string;
    amountInRupees: number;
  } | null>(null);

  const BASE_URL = useMemo(() => import.meta.env.VITE_BASE_URL as string, []);

  const packageIdByIndex = useMemo<Record<number, number>>(
    () => ({ 0: 1, 1: 2, 2: 3 }),
    []
  );

  const loadRazorpayScript = useCallback(async (): Promise<boolean> => {
    if (document.getElementById("razorpay-script")) return true;
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.id = "razorpay-script";
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }, []);

  const handleSelectPackage = (index: number) => {
    setSelectedPackage(index);
  };

  const handleBuyClick = useCallback(
    async (index: number) => {
      try {
        setErrorMessage(null);
        setLoadingIndex(index);

        const scriptOk = await loadRazorpayScript();
        if (!scriptOk) {
          setErrorMessage("Failed to load payment gateway. Please try again.");
          setLoadingIndex(null);
          return;
        }

        const clerkId = user?.id;
        if (!clerkId) {
          setErrorMessage("Please sign in to purchase a pack.");
          setLoadingIndex(null);
          return;
        }
        const token = await getToken();
        const pkgId = packageIdByIndex[index];
        const res = await fetch(`${BASE_URL}/api/payments/create-order`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ clerkId, packageId: pkgId }),
        });

        if (!res.ok) {
          setErrorMessage("Unable to create order. Please try again.");
          setLoadingIndex(null);
          return;
        }

        const data = await res.json();
        if (!data?.success || !data?.order || !data?.razorpayKeyId) {
          setErrorMessage("Invalid order response. Please try again.");
          setLoadingIndex(null);
          return;
        }

        const options: any = {
          key: data.razorpayKeyId,
          amount: data.order.amount,
          currency: data.order.currency,
          order_id: data.order.id,
          name: "CodePup",
          description: `${data.order.package?.name ?? "CodePup Pack"}`,
          handler: (response: any) => {
            // Payment success callback (show dialog)
            setSuccessData({
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              signature: response.razorpay_signature,
              packName: data.order.package?.name ?? "CodePup Pack",
              amountInRupees: Math.round((data.order.amount / 100) * 100) / 100,
            });
            setSuccessOpen(true);
          },
          prefill: {
            name: user?.fullName ?? "",
            email: user?.primaryEmailAddress?.emailAddress ?? "",
          },
          notes: {
            clerkId,
            packageId: pkgId,
          },
          theme: { color: "#4f46e5" },
        };
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } catch (err) {
        console.error(err);
        setErrorMessage("Something went wrong. Please try again.");
      } finally {
        setLoadingIndex(null);
      }
    },
    [BASE_URL, loadRazorpayScript, packageIdByIndex, user, getToken]
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-7xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-blue-50 via-white to-purple-50 rounded-2xl shadow-2xl border border-gray-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>

        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-2xl">
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-200 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-pulse"></div>
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-200 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-pulse animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-cyan-200 rounded-full mix-blend-multiply filter blur-2xl opacity-20 animate-pulse animation-delay-4000"></div>
        </div>

        <div className="relative z-10 p-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
              Choose Your Perfect Plan
            </h1>
            <p className="text-xl text-gray-700">
              Unlock the full potential of CodePup with our flexible pricing options
            </p>
          </div>

          {/* Pricing Cards Container */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {defaultPackages.map((pkg, index) => {
            const Icon = pkg.icon;
            const isSelected = selectedPackage === index;
            const isHoveredCard = isHovered === index;

            return (
              <div
                key={index}
                className="relative group"
                onMouseEnter={() => setIsHovered(index)}
                onMouseLeave={() => setIsHovered(null)}
              >
                {/* Popular Badge */}
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-20">
                    <span className="bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg">
                      MOST POPULAR
                    </span>
                  </div>
                )}

                {/* Card */}
                <div
                  className={`
                    relative h-full p-6 rounded-2xl border transition-all duration-500 cursor-pointer
                    ${
                      isSelected
                        ? "bg-white/90 border-blue-400 shadow-[0_0_40px_rgba(59,130,246,0.4)] scale-105"
                        : isHoveredCard
                        ? "bg-white/80 border-blue-300 shadow-[0_0_30px_rgba(59,130,246,0.2)] scale-102"
                        : "bg-white/70 border-gray-300 shadow-xl"
                    }
                    backdrop-blur-xl backdrop-saturate-150
                  `}
                  onClick={() => handleSelectPackage(index)}
                >
                  {/* Glow effect on hover */}
                  {isHoveredCard && (
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 blur-xl"></div>
                  )}

                  <div className="relative z-10">
                    {/* Icon */}
                    <div
                      className={`
                      w-14 h-14 rounded-xl flex items-center justify-center mb-4
                      ${
                        pkg.popular
                          ? "bg-gradient-to-br from-amber-400 to-orange-500"
                          : "bg-gradient-to-br from-blue-500 to-purple-500"
                      }
                    `}
                    >
                      <Icon className="w-8 h-8 text-white" />
                    </div>

                    {/* Package Name */}
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">
                      {pkg.name}
                    </h3>

                    {/* Description */}
                    <p className="text-gray-600 text-sm mb-4">
                      {pkg.description}
                    </p>

                    {/* Credits */}
                    <div className="mb-6">
                      <div className="flex items-baseline">
                        <span className="text-4xl font-bold text-gray-800">
                          ₹{pkg.priceInRupees}
                        </span>
                        <span className="text-gray-500 ml-2">/month</span>
                      </div>
                      <div className="mt-2 text-blue-600 font-semibold">
                        {pkg.credits.toLocaleString()} Credits
                      </div> 
                    </div>

                      {/* Buy Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBuyClick(index);
                      }}
                      disabled={loadingIndex === index}
                      className={`w-full py-3 px-4 mb-3 rounded-xl font-semibold transition-all duration-300 border 
                        ${
                          loadingIndex === index
                            ? "bg-gray-200 text-gray-500 cursor-not-allowed border-gray-300"
                            : "bg-blue-600 text-white hover:bg-blue-700 border-blue-700"
                        }`}
                    >
                      {loadingIndex === index ? "Processing..." : "Buy Now"}
                    </button>

                    {/* Features */}
                    <div className="space-y-3 mb-6">
                      {pkg.features.map((feature, idx) => (
                        <div key={idx} className="flex items-start">
                          <Check className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700 text-sm">
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>

                    
                  </div>
                </div>
              </div>
            );
          })}
        </div>

          {errorMessage && (
            <div className="mt-8 text-center animate-fadeIn">
              <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-red-50 border border-red-200">
                <div className="text-red-700 font-semibold">{errorMessage}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Success Dialog */}
      <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>🐾 Woof-tastic! Payment Successful</DialogTitle>
            <DialogDescription>
              Our pup fetched your pack successfully. Here are your payment details.
            </DialogDescription>
          </DialogHeader>
          {successData && (
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Pack</span>
                <span className="font-medium">{successData.packName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Amount</span>
                <span className="font-medium">₹{successData.amountInRupees}</span>
              </div>
              <div className="flex items-center justify-between break-all">
                <span className="text-gray-600">Payment ID</span>
                <span className="font-mono">{successData.paymentId}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <button
              className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-white font-semibold hover:bg-blue-700 transition-colors"
              onClick={() => setSuccessOpen(false)}
            >
              Got it 🐶
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Export both the component and a hook for easy usage
export const usePrizeModal = () => {
  const [isOpen, setIsOpen] = useState(false);

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  return { isOpen, openModal, closeModal };
};

export default PrizeModel;
