import React from 'react';
import { StepIndicator } from './StepIndicator';
import { CompanyLogo, RefreshCw, ShoppingCartIcon, X, ExternalLinkIcon } from './Icons';
import Button from './common/Button';

interface SidebarProps {
  currentStep: number;
  onReset: () => void;
  onCartClick: () => void;
  cartItemCount: number;
  isOpen: boolean;
  onClose: () => void;
  showExternalLink?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
  currentStep,
  onReset,
  onCartClick,
  cartItemCount,
  isOpen,
  onClose,
  showExternalLink = true,
}) => {
  return (
    <aside className={`
      bg-slate-100 border-r border-slate-200/80 flex flex-col
      fixed inset-y-0 left-0 z-50 w-[350px] transition-transform duration-300 ease-in-out
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      lg:relative lg:translate-x-0 lg:w-full
    `}>
      {/* Scrollable content */}
      <div className="relative z-10 flex-1 overflow-y-auto p-8">
        {/* Top Section */}
        <div className="mb-12 flex items-center justify-between">
          <a href="https://dermatics.in" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 group">
            <CompanyLogo className="w-28 h-auto" />
          </a>
          <div className="flex items-center gap-2">
            {showExternalLink && (
              <a href="https://dermatics.in" target="_blank" rel="noopener noreferrer" title="Visit Dermatics.in" className="p-2 rounded-full hover:bg-slate-200 transition-colors">
                <ExternalLinkIcon className="w-6 h-6 text-slate-600" />
              </a>
            )}
            <button onClick={onCartClick} className="relative p-2 rounded-full hover:bg-slate-200 transition-colors">
              <ShoppingCartIcon className="w-6 h-6 text-slate-600" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-secondary text-xs font-bold text-white shadow-lg">
                  {cartItemCount}
                </span>
              )}
            </button>
          </div>
        </div>

        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-800 mb-2 leading-tight">
          AI Skincare Advisor
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mb-10 sm:mb-12">
          Your personalized path to healthier skin, powered by Dermatics India.
        </p>

        {/* Step Indicator */}
        <div className="mb-8">
          <StepIndicator currentStep={currentStep} />
        </div>

        {/* Start Over Button */}
        <div className="space-y-4">
          <Button
            onClick={onReset}
            variant="primary"
            size="sm"
            className="w-full gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Start Over
          </Button>

          {/* Footer */}
          <footer className="text-center text-xs text-slate-500 font-medium pt-4">
            <p>
              Powered by Dermatics India. For informational purposes only. Always consult a dermatologist for medical advice.
            </p>
          </footer>
        </div>
      </div>

      {/* Sticky bottom nav — Close button like YouTube */}
      <div className="relative z-10 p-4 border-t border-slate-200 lg:hidden">
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-slate-200 transition-colors"
          aria-label="Close menu"
        >
          <X className="w-6 h-6 text-slate-600" />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;