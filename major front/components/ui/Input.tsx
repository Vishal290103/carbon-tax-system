import React from 'react';

interface InputProps {
  type?: string;
  placeholder?: string;
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  disabled?: boolean;
  min?: string | number;
  max?: string | number;
  step?: string | number;
}

export function Input({ 
  type = 'text', 
  placeholder, 
  value, 
  onChange, 
  className = '',
  disabled = false,
  min,
  max,
  step
}: InputProps) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      disabled={disabled}
      min={min}
      max={max}
      step={step}
      className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${className}`}
    />
  );
}