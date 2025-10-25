/**
 * Reusable Button Component
 */

import { Loader2 } from 'lucide-react';

const Button = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  fullWidth = false,
  className = '',
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary:
      'relative overflow-hidden bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/50 hover:scale-105 focus:ring-primary-500 group',
    secondary:
      'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
    success:
      'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
    danger:
      'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    outline:
      'bg-transparent border-2 border-primary-600 text-primary-600 hover:bg-primary-50 focus:ring-primary-500',
    ghost:
      'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-400',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
    >
      {/* Animated gradient overlay for primary variant */}
      {variant === 'primary' && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
      )}

      <span className="relative z-10 flex items-center">
        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {!loading && icon && <span className="mr-2">{icon}</span>}
        {children}
      </span>
    </button>
  );
};

export default Button;
