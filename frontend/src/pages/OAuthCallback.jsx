import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import authService from '../services/auth.service';

/**
 * OAuth Callback Page
 * Handles the redirect from Google OAuth
 * Extracts token from URL and logs user in
 */
const OAuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setUser, setAuthenticated } = useAuthStore();
  const hasRun = useRef(false);

  useEffect(() => {
    // Prevent running twice in React StrictMode
    if (hasRun.current) return;
    hasRun.current = true;

    const handleOAuthCallback = async () => {
      const token = searchParams.get('token');
      const refreshToken = searchParams.get('refreshToken');
      const error = searchParams.get('error');

      if (error) {
        // Handle OAuth errors
        const errorMessages = {
          authentication_failed: 'Authentication failed. Please try again.',
          oauth_failed: 'Google sign-in failed. Please try again.',
          server_error: 'Server error occurred. Please try again later.',
        };

        console.error('OAuth error from URL:', error);
        toast.error(errorMessages[error] || 'An error occurred during sign-in.');
        navigate('/login');
        return;
      }

      if (token && refreshToken) {
        // Store tokens first
        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', refreshToken);

        try {
          // Use authService to get current user (consistent with rest of app)
          const response = await authService.getCurrentUser();
          const userData = response.data;

          if (userData) {
            // Store user in localStorage
            localStorage.setItem('user', JSON.stringify(userData));

            // Update auth store
            setUser(userData);
            setAuthenticated(true);

            const userName = userData.name || 'there';
            toast.success(`Welcome back, ${userName}!`);
            navigate('/dashboard');
          } else {
            throw new Error('No user data received');
          }
        } catch (error) {
          console.error('OAuth callback error:', error);
          // Clear tokens on error
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          toast.error('Failed to complete sign-in. Please try again.');
          navigate('/login');
        }
      } else {
        console.error('Missing tokens in URL. Current URL:', window.location.href);
        toast.error('Invalid authentication response.');
        navigate('/login');
      }
    };

    handleOAuthCallback();
  }, [searchParams, navigate, setUser, setAuthenticated]);

  return (
    <div className="min-h-screen bg-gradient-bg flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-ai flex items-center justify-center shadow-glow-indigo animate-pulse">
          <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-text-primary mb-2">
          Completing Sign-In...
        </h2>
        <p className="text-text-secondary">
          Please wait while we log you in
        </p>
      </div>
    </div>
  );
};

export default OAuthCallback;
