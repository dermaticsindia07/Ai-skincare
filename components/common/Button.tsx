import React from 'react';

// FIX: Added anchor element attributes to allow the Button component to be used polymorphically as a link.
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  as?: React.ElementType;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: React.ReactNode;
  href?: string;
  target?: string;
  rel?: string;
}

const Button: React.FC<ButtonProps> = ({ as: Component = 'button', variant = 'primary', size = 'md', isLoading = false, children, className, ...props }) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60 disabled:pointer-events-none active:scale-[0.98]';
  
  const sizeClasses = {
    sm: 'px-4 py-2 text-xs sm:px-5 sm:py-2.5 sm:text-sm',
    md: 'px-6 py-2.5 text-sm sm:px-7 sm:py-3.5 sm:text-base',
    lg: 'px-7 py-3 text-sm sm:px-9 sm:py-4 sm:text-base',
  };

  const variantClasses = {
    primary: 'bg-brand-primary text-white shadow-interactive hover:bg-brand-primary-hover hover:shadow-interactive-hover focus-visible:ring-brand-primary focus-visible:ring-offset-brand-bg transform hover:-translate-y-0.5',
    secondary: 'bg-brand-primary text-white shadow-interactive hover:bg-brand-primary-hover hover:shadow-interactive-hover focus-visible:ring-brand-primary focus-visible:ring-offset-brand-bg transform hover:-translate-y-0.5',
    ghost: 'bg-transparent text-brand-primary hover:bg-brand-primary/10 shadow-none focus-visible:ring-brand-primary-light'
  };

  return (
    <Component
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <svg className={`animate-spin -ml-1 mr-3 ${size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : null}
      {children}
    </Component>
  );
};

export default Button;