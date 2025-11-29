import React from 'react';

const PlanSelector = ({ 
  plans, 
  selectedPlan, 
  setSelectedPlan, 
  className = "", 
  variant = "desktop"
}) => {
  if (variant === "mobile") {
    return (
      <div className={`lg:hidden bg-gray-800/80 rounded-xl p-4 border border-gray-700 shadow-sm ${className}`}>
        <h3 className="font-medium text-white mb-3">Training Focus</h3>
        <div className="grid grid-cols-2 gap-2">
          {plans.map((plan) => {
            const IconComponent = plan.icon;
            return (
              <button
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className={`flex items-center space-x-2 p-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  selectedPlan === plan.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <IconComponent className="h-4 w-4" />
                <span>{plan.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className={`hidden lg:flex items-center space-x-1 bg-gray-50 rounded-lg p-1 ${className}`}>
      {plans.map((plan) => {
        const IconComponent = plan.icon;
        const isSelected = selectedPlan === plan.id;
        return (
          <button
            key={plan.id}
            onClick={() => setSelectedPlan(plan.id)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              isSelected
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
            }`}
          >
            <IconComponent className="h-4 w-4" />
            <span>{plan.name}</span>
          </button>
        );
      })}
    </div>
  );
};

export default PlanSelector;