import React from "react";
import { Check } from "lucide-react";
import type { SubscriptionPlan } from "../../types/subscription.types";

interface PlanCardProps {
  plan: SubscriptionPlan;
  isCurrentPlan?: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
  actionButton?: React.ReactNode;
  className?: string;
  showDiscount?: boolean;
}

const PlanCard: React.FC<PlanCardProps> = ({
  plan,
  isCurrentPlan = false,
  isSelected = false,
  onSelect,
  actionButton,
  className = "",
  showDiscount = false,
}) => {
  const isPopular = plan.tags === "popular";

  return (
    <div
      className={`
        relative p-6 rounded-lg border bg-white transition-all duration-200
        ${
          isSelected
            ? "border-blue-500 shadow-lg ring-2 ring-blue-100"
            : "border-gray-200"
        }
        ${
          onSelect ? "cursor-pointer hover:border-gray-300 hover:shadow-md" : ""
        }
        ${className}
      `}
      onClick={onSelect}
    >
      {/* Popular badge */}
      {isPopular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="px-3 py-1 text-xs font-medium bg-blue-500 text-white rounded-full">
            Most Popular
          </span>
        </div>
      )}

      {/* Discount badge */}
      {showDiscount && (
        <div className={`absolute ${isCurrentPlan ? 'top-4' : 'top-4'} right-4`}>
          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded">
            20% OFF
          </span>
        </div>
      )}

      {/* Current plan badge */}
      {isCurrentPlan && (
        <div className={`absolute ${showDiscount ? 'top-12' : 'top-4'} right-4`}>
          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
            Current Plan
          </span>
        </div>
      )}

      {/* Plan name and description */}
      <div className="mb-4">
        <h3 className="text-xl font-semibold text-gray-900">{plan.name}</h3>
        <p className="mt-1 text-sm text-gray-600">{plan.description}</p>
      </div>

      {/* Pricing */}
      <div className="mb-6">
        <div className="flex items-baseline">
          <span className="text-3xl font-bold text-gray-900">
            ₹{plan.priceInRupees}
          </span>
          <span className="ml-2 text-sm text-gray-500">
            /{plan.period === "monthly" ? "month" : "year"}
          </span>
        </div>

        {plan.period === "yearly" && plan.pricePerMonth && (
          <p className="mt-1 text-sm text-gray-600">
            ₹{plan.pricePerMonth}/month billed annually
          </p>
        )}

        {/* Credits */}
        <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full bg-blue-50">
          <span className="text-sm font-medium text-blue-700">
            {plan.creditsPerCycle.toLocaleString()} credits per{" "}
            {plan.period === "monthly" ? "month" : "month"}
          </span>
        </div>
      </div>

      {/* Features */}
      <div className="mb-6 space-y-3">
        {Array.isArray(plan.features) &&
          plan.features.map((feature, index) => (
            <div key={index} className="flex items-start">
              <Check className="w-4 h-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-gray-700">{feature}</span>
            </div>
          ))}

        {/* Additional info */}
        {(plan.maxProjects || plan.maxTeamMembers) && (
          <>
            {plan.maxProjects && (
              <div className="flex items-start">
                <Check className="w-4 h-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700">
                  Up to {plan.maxProjects} projects
                </span>
              </div>
            )}
            {plan.maxTeamMembers && (
              <div className="flex items-start">
                <Check className="w-4 h-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700">
                  {plan.maxTeamMembers} team{" "}
                  {plan.maxTeamMembers === 1 ? "member" : "members"}
                </span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Action button */}
      {actionButton && <div className="mt-6">{actionButton}</div>}
    </div>
  );
};

export default PlanCard;
