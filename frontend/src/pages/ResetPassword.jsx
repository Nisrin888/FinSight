import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import useAuthStore from '../store/authStore';

const ResetPassword = () => {
  const navigate = useNavigate();
  const { token } = useParams();
  const { resetPassword, isLoading } = useAuthStore();

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const { password, confirmPassword } = formData;

  // Password strength indicators
  const passwordChecks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[@$!%*?&]/.test(password),
  };

  const passwordStrength = Object.values(passwordChecks).filter(Boolean).length;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear error for this field
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!passwordChecks.uppercase || !passwordChecks.lowercase || !passwordChecks.number || !passwordChecks.special) {
      newErrors.password = 'Password must meet all requirements';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      await resetPassword(token, password);
      navigate('/login');
    } catch (error) {
      // Error handled by store
    }
  };

  return (
    <div className="min-h-screen bg-gradient-bg flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-ai flex items-center justify-center shadow-glow-indigo">
              <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </Link>
          <h1 className="text-3xl font-display font-bold mb-2">
            Reset Password
          </h1>
          <p className="text-text-secondary">
            Enter your new password below
          </p>
        </div>

        {/* Form */}
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-text-primary mb-2">
                New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-text-tertiary" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={password}
                  onChange={handleChange}
                  className={`input pl-12 pr-12 w-full ${errors.password ? 'border-danger-500' : ''}`}
                  placeholder="••••••••"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-text-tertiary hover:text-text-primary transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {password && (
                <div className="mt-2 space-y-2">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          i < passwordStrength
                            ? passwordStrength <= 2
                              ? 'bg-danger-500'
                              : passwordStrength <= 3
                              ? 'bg-warning-500'
                              : 'bg-success-500'
                            : 'bg-dark-border'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="text-xs space-y-1">
                    {Object.entries({
                      length: '8+ characters',
                      uppercase: 'Uppercase letter',
                      lowercase: 'Lowercase letter',
                      number: 'Number',
                      special: 'Special character (@$!%*?&)',
                    }).map(([key, label]) => (
                      <div key={key} className="flex items-center gap-2">
                        {passwordChecks[key] ? (
                          <CheckCircle className="w-3 h-3 text-success-500" />
                        ) : (
                          <XCircle className="w-3 h-3 text-text-tertiary" />
                        )}
                        <span
                          className={
                            passwordChecks[key] ? 'text-success-500' : 'text-text-tertiary'
                          }
                        >
                          {label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {errors.password && (
                <p className="mt-1 text-sm text-danger-500">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-text-primary mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-text-tertiary" />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={confirmPassword}
                  onChange={handleChange}
                  className={`input pl-12 pr-12 w-full ${errors.confirmPassword ? 'border-danger-500' : ''}`}
                  placeholder="••••••••"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-text-tertiary hover:text-text-primary transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-danger-500">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Resetting password...
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  Reset Password
                </>
              )}
            </button>
          </form>

          {/* Back to Login */}
          <p className="mt-6 text-center text-sm text-text-secondary">
            Remember your password?{' '}
            <Link
              to="/login"
              className="text-primary-500 hover:text-primary-400 font-semibold transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <Link
            to="/"
            className="text-sm text-text-tertiary hover:text-text-secondary transition-colors"
          >
            ← Back to home
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
