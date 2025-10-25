/**
 * Reusable Select Component
 */

const Select = ({
  label,
  name,
  value,
  onChange,
  onBlur,
  options = [],
  error,
  disabled = false,
  required = false,
  placeholder = 'Select an option',
  className = '',
  ...props
}) => {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label
          htmlFor={name}
          className="block text-sm font-medium text-gray-300 mb-2"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        disabled={disabled}
        required={required}
        className={`
          w-full px-4 py-3 rounded-xl
          bg-dark-hover border border-white/10
          text-white
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all duration-200
          ${error ? 'border-red-500' : ''}
        `}
        {...props}
      >
        <option value="" className="bg-dark-card text-gray-400">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-dark-card text-white">
            {option.label}
          </option>
        ))}
      </select>

      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
};

export default Select;
