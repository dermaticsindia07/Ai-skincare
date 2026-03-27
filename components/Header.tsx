import React from 'react';
import { CompanyLogo, RefreshCw, ShoppingCartIcon, MenuIcon, ExternalLinkIcon } from './Icons';
import Button from './common/Button';

interface HeaderProps {
    onReset: () => void;
    onCartClick: () => void;
    cartItemCount: number;
    onMenuClick: () => void;
    showExternalLink?: boolean;
}

const Header: React.FC<HeaderProps> = ({ onReset, onCartClick, cartItemCount, onMenuClick, showExternalLink = true }) => {
  return (
    <header className="w-full mx-auto p-4 flex items-center justify-between lg:hidden shrink-0 bg-white/90 backdrop-blur-md z-20 border-b border-slate-200">
      <div className="flex items-center gap-2">
        <button onClick={onMenuClick} className="p-2 -ml-2 rounded-full hover:bg-black/10 transition-colors" aria-label="Open menu">
          <MenuIcon className="w-6 h-6 text-brand-text-muted" />
        </button>
        <a href="https://dermatics.in" target="_blank" rel="noopener noreferrer">
          <CompanyLogo className="w-24 h-auto" />
        </a>
      </div>
      <div className="flex items-center gap-2">
        <Button onClick={onReset} variant="secondary" size="sm" className="gap-1.5 px-3">
            <RefreshCw className="w-4 h-4" />
            Reset
        </Button>
        {showExternalLink && (
          <Button
              as="a"
              href="https://dermatics.in"
              target="_blank"
              rel="noopener noreferrer"
              title="Visit Dermatics.in"
              variant="secondary"
              size="sm"
              className="relative !rounded-full !p-2"
          >
              <ExternalLinkIcon className="w-6 h-6" />
          </Button>
        )}
        <Button onClick={onCartClick} variant="secondary" size="sm" className="relative !rounded-full !p-2">
            <ShoppingCartIcon className="w-6 h-6" />
            {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-secondary text-xs font-bold text-white shadow-lg">
                    {cartItemCount}
                </span>
            )}
        </Button>
      </div>
    </header>
  );
};

export default Header;