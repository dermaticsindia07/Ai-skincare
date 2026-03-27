import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  children: React.ReactNode;
}

const Select: React.FC<SelectProps> = ({ label, children, id, ...props }) => {
  return (
    <div>
      {label && <label htmlFor={id} className="block text-sm font-medium text-brand-text-main mb-1.5">{label}</label>}
      <select
        id={id}
        className="block w-full bg-white text-brand-text-main border border-slate-300 rounded-lg py-2.5 px-4 focus:ring-2 focus:ring-brand-primary-light focus:border-brand-primary-light transition-all text-sm shadow-sm hover:border-slate-400"
        {...props}
      >
        {children}
      </select>
    </div>
  );
};

export default Select;