import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import useAuthStore from '../store/authStore';

const ForgotPassword = () => {
  const { forgotPassword, isLoading } = useAuthStore();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const validate = () => {
    if (!email) {
      setError('Email is required');
      return false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Email is invalid');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      await forgotPassword(email);
      setIsSubmitted(true);
    } catch (error) {
      // Error handled by store
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-bg flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="card text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-success-500/20 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-success-500" />
            </div>
            <h2 className="text-2xl font-display font-bold mb-3">
              Check Your Email
            </h2>
            <p className="text-text-secondary mb-6">
              We've sent a password reset link to <strong className="text-text-primary">{email}</strong>
            </p>
            <p className="text-sm text-text-tertiary mb-8">
              The link will expire in 1 hour. If you don't receive an email, check your spam folder or try again.
            </p>
            <div className="space-y-3">
              <Link to="/login" className="btn-primary w-full inline-flex items-center justify-center gap-2">
                <ArrowLeft className="w-5 h-5" />
                Back to Login
              </Link>
              <button
                onClick={() => setIsSubmitted(false)}
                className="w-full text-sm text-primary-500 hover:text-primary-400 transition-colors"
              >
                Send to a different email
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

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
            Forgot Password?
          </h1>
          <p className="text-text-secondary">
            No worries, we'll send you reset instructions
          </p>
        </div>

        {/* Form */}
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-text-tertiary" />
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError('');
                  }}
                  className={`input pl-12 w-full ${error ? 'border-danger-500' : ''}`}
                  placeholder="you@example.com"
                  disabled={isLoading}
                />
              </div>
              {error && (
                <p className="mt-1 text-sm text-danger-500">{error}</p>
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
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="w-5 h-5" />
                  Send Reset Link
                </>
              )}
            </button>
          </form>

          {/* Back to Login */}
          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="text-sm text-text-secondary hover:text-text-primary transition-colors inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to login
            </Link>
          </div>
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

export default ForgotPassword;
