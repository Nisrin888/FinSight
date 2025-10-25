/**
 * Settings Page
 * User preferences, profile management, and account settings
 */

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Lock,
  Bell,
  Globe,
  Trash2,
  Download,
  Save,
  Mail,
  Shield,
  AlertCircle,
  Camera,
  Upload,
} from 'lucide-react';

// Layout & Components
import MainLayout from '../components/layout/MainLayout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import LoadingSpinner from '../components/ui/LoadingSpinner';

// Store
import useAuthStore from '../store/authStore';
import authService from '../services/auth.service';
import toast from 'react-hot-toast';

// Utils
import { SUPPORTED_CURRENCIES } from '../utils/currency';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Helper function to check if profile picture exists
const hasProfilePicture = (picture) => {
  return picture && typeof picture === 'string' && picture.trim().length > 0;
};

const Settings = () => {
  const { user, loadUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Profile picture
  const fileInputRef = useRef(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState(null);
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);

  // Profile form
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    currency: 'USD',
  });

  // Password form
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Notification preferences
  const [notifications, setNotifications] = useState({
    email: true,
    inApp: true,
    overspending: true,
    goalMilestones: true,
    dailyReminder: false,
    weeklyReport: true,
  });

  // Load user data on mount and when user changes
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        currency: user.currency || 'USD',
      });
      if (user.notificationPreferences) {
        setNotifications(user.notificationPreferences);
      }
    }
  }, [user]);

  // Handle profile update
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await authService.updateProfile(profileData);
      await loadUser();
      toast.success('Profile updated successfully! Currency preference saved.');
    } catch (error) {
      console.error('Profile update error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update profile';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle password update
  const handlePasswordUpdate = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      await authService.updatePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      toast.success('Password updated successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle notification update
  const handleNotificationUpdate = async () => {
    setIsLoading(true);

    try {
      await authService.updateNotifications(notifications);
      await loadUser();
      toast.success('Notification preferences updated!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update preferences');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle export data
  const handleExportData = async () => {
    try {
      toast.success('Export started! This may take a moment...');
      const blob = await authService.exportData();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `finsight-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Data exported successfully!');
    } catch (error) {
      toast.error('Failed to export data');
    }
  };

  // Handle delete account
  const handleDeleteAccount = async () => {
    try {
      await authService.deleteAccount();
      toast.success('Account deleted successfully');
      window.location.href = '/login';
    } catch (error) {
      toast.error('Failed to delete account');
    }
  };

  // Handle profile picture file selection
  const handleProfilePictureChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a valid image file (JPEG, PNG, GIF, or WEBP)');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfilePicturePreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload the file
    setIsUploadingPicture(true);
    try {
      await authService.uploadProfilePicture(file);
      await loadUser();
      toast.success('Profile picture updated successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload profile picture');
      setProfilePicturePreview(null);
    } finally {
      setIsUploadingPicture(false);
    }
  };

  // Handle delete profile picture
  const handleDeleteProfilePicture = async () => {
    if (!hasProfilePicture(user?.profilePicture)) return;

    setIsUploadingPicture(true);
    try {
      await authService.deleteProfilePicture();
      await loadUser();
      setProfilePicturePreview(null);
      toast.success('Profile picture removed successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to remove profile picture');
    } finally {
      setIsUploadingPicture(false);
    }
  };

  if (!user) {
    return (
      <MainLayout>
        <LoadingSpinner fullScreen text="Loading settings..." />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white">Settings</h1>
          <p className="text-gray-400 mt-1">
            Manage your profile and preferences
          </p>
        </div>

        {/* Profile Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card
            title="Profile Settings"
            subtitle="Update your personal information"
          >
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              {/* Profile Picture Section */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Profile Picture
                </label>
                <div className="flex items-center gap-4">
                  {/* Profile Picture Display */}
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                      {(profilePicturePreview || hasProfilePicture(user.profilePicture)) ? (
                        <img
                          src={profilePicturePreview || `${API_URL}${user.profilePicture}`}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-3xl font-bold text-white">
                          {user?.name?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      )}
                    </div>
                    {isUploadingPicture && (
                      <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                      </div>
                    )}
                  </div>

                  {/* Upload/Delete Buttons */}
                  <div className="flex flex-col gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      onChange={handleProfilePictureChange}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingPicture}
                      icon={<Camera className="w-4 h-4" />}
                    >
                      {hasProfilePicture(user.profilePicture) ? 'Change Picture' : 'Upload Picture'}
                    </Button>
                    {hasProfilePicture(user.profilePicture) && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleDeleteProfilePicture}
                        disabled={isUploadingPicture}
                        icon={<Trash2 className="w-4 h-4" />}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Accepted formats: JPEG, PNG, GIF, WEBP. Max size: 5MB
                </p>
              </div>

              <Input
                label="Name"
                type="text"
                value={profileData.name}
                onChange={(e) =>
                  setProfileData({ ...profileData, name: e.target.value })
                }
                icon={<User className="w-5 h-5" />}
                required
              />

              <Input
                label="Email"
                type="email"
                value={profileData.email}
                onChange={(e) =>
                  setProfileData({ ...profileData, email: e.target.value })
                }
                icon={<Mail className="w-5 h-5" />}
                disabled={user.authProvider === 'google'}
                helpText={
                  user.authProvider === 'google'
                    ? 'Email cannot be changed for Google accounts'
                    : ''
                }
              />

              <Select
                label="Default Currency"
                value={profileData.currency}
                onChange={(e) =>
                  setProfileData({ ...profileData, currency: e.target.value })
                }
                options={SUPPORTED_CURRENCIES}
                icon={<Globe className="w-5 h-5" />}
              />

              <div className="pt-4">
                <Button
                  type="submit"
                  icon={<Save className="w-4 h-4" />}
                  disabled={isLoading}
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </Card>
        </motion.div>

        {/* Password Settings - Only for email auth users */}
        {user.authProvider === 'email' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card
              title="Change Password"
              subtitle="Update your password regularly for security"
            >
              <form onSubmit={handlePasswordUpdate} className="space-y-4">
                <Input
                  label="Current Password"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      currentPassword: e.target.value,
                    })
                  }
                  icon={<Lock className="w-5 h-5" />}
                  required
                />

                <Input
                  label="New Password"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      newPassword: e.target.value,
                    })
                  }
                  icon={<Lock className="w-5 h-5" />}
                  required
                  minLength={6}
                />

                <Input
                  label="Confirm New Password"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      confirmPassword: e.target.value,
                    })
                  }
                  icon={<Lock className="w-5 h-5" />}
                  required
                  minLength={6}
                />

                <div className="pt-4">
                  <Button
                    type="submit"
                    icon={<Shield className="w-4 h-4" />}
                    disabled={isLoading}
                  >
                    Update Password
                  </Button>
                </div>
              </form>
            </Card>
          </motion.div>
        )}

        {/* Notification Preferences */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card
            title="Notification Preferences"
            subtitle="Manage how you receive notifications"
          >
            <div className="space-y-4">
              {[
                {
                  key: 'email',
                  label: 'Email Notifications',
                  description: 'Receive notifications via email',
                },
                {
                  key: 'inApp',
                  label: 'In-App Notifications',
                  description: 'Show notifications in the application',
                },
                {
                  key: 'overspending',
                  label: 'Budget Alerts',
                  description: 'Get notified when approaching budget limits',
                },
                {
                  key: 'goalMilestones',
                  label: 'Goal Milestones',
                  description: 'Receive updates on financial goals progress',
                },
                {
                  key: 'dailyReminder',
                  label: 'Daily Reminders',
                  description: 'Daily summary of your finances',
                },
                {
                  key: 'weeklyReport',
                  label: 'Weekly Reports',
                  description: 'Weekly financial insights and summary',
                },
              ].map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between py-3 border-b border-white/10 last:border-0"
                >
                  <div>
                    <p className="font-medium text-white">{item.label}</p>
                    <p className="text-sm text-gray-400">{item.description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setNotifications({
                        ...notifications,
                        [item.key]: !notifications[item.key],
                      })
                    }
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      notifications[item.key]
                        ? 'bg-primary-500'
                        : 'bg-gray-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        notifications[item.key] ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              ))}

              <div className="pt-4">
                <Button
                  onClick={handleNotificationUpdate}
                  icon={<Bell className="w-4 h-4" />}
                  disabled={isLoading}
                >
                  Save Preferences
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Data & Privacy */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card title="Data & Privacy" subtitle="Manage your data">
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-white/10">
                <div>
                  <p className="font-medium text-white">Export Data</p>
                  <p className="text-sm text-gray-400">
                    Download all your financial data in JSON format
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  icon={<Download className="w-4 h-4" />}
                  onClick={handleExportData}
                >
                  Export
                </Button>
              </div>

              <div className="flex items-start justify-between py-3 gap-4">
                <div>
                  <p className="font-medium text-red-400">Delete Account</p>
                  <p className="text-sm text-gray-400">
                    Permanently delete your account and all data
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  icon={<Trash2 className="w-4 h-4" />}
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="text-red-400 border-red-400 hover:bg-red-500/10 shrink-0"
                >
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Delete Account Confirmation Modal */}
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          title=""
          size="sm"
        >
          <div className="text-center py-4">
            {/* Warning Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center shadow-2xl shadow-red-500/50"
            >
              <AlertCircle className="w-10 h-10 text-white" strokeWidth={2.5} />
            </motion.div>

            {/* Title */}
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-2xl sm:text-3xl font-bold text-white mb-3"
            >
              Delete Account?
            </motion.h2>

            {/* Description */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-6"
            >
              <p className="text-gray-400 mb-4 text-sm sm:text-base">
                Are you absolutely sure you want to delete your account?
              </p>
              <p className="text-gray-500 text-sm">
                This action cannot be undone. All your financial data, transactions, goals, and budgets will be permanently deleted.
              </p>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-3"
            >
              <Button
                variant="ghost"
                onClick={() => setIsDeleteModalOpen(false)}
                fullWidth
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteAccount}
                className="bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600"
                fullWidth
              >
                Delete Account
              </Button>
            </motion.div>
          </div>
        </Modal>
      </div>
    </MainLayout>
  );
};

export default Settings;
