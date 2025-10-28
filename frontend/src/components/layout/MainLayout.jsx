/**
 * Main Layout Component
 * Shared layout for all authenticated pages with emerald green theme
 */

import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  Target,
  Settings,
  LogOut,
  Menu,
  X,
  User,
  Plus,
  TrendingUp,
  BarChart3,
  Brain,
} from 'lucide-react';
import useAuthStore from '../../store/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Helper function to check if profile picture exists
const hasProfilePicture = (picture) => {
  return picture && typeof picture === 'string' && picture.trim().length > 0;
};

const MainLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Transactions', href: '/transactions', icon: ArrowLeftRight },
    { name: 'Accounts', href: '/accounts', icon: Wallet },
    { name: 'Insights', href: '/insights', icon: BarChart3 },
    { name: 'AI Insights', href: '/ai-insights', icon: Brain },
    { name: 'Goals', href: '/goals', icon: TrendingUp },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  // Bottom nav items (mobile only - 5 items)
  const bottomNavItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Transactions', href: '/transactions', icon: ArrowLeftRight },
    { name: 'Accounts', href: '/accounts', icon: Wallet },
    { name: 'AI Insights', href: '/ai-insights', icon: Brain },
    { name: 'Goals', href: '/goals', icon: TrendingUp },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const NavLink = ({ item }) => {
    const isActive = location.pathname === item.href;
    return (
      <Link
        to={item.href}
        className={`
          flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
          ${
            isActive
              ? 'bg-primary-500 text-white shadow-glow-indigo'
              : 'text-gray-400 hover:bg-dark-hover hover:text-white'
          }
        `}
      >
        <item.icon className="w-5 h-5" />
        <span className="font-medium">{item.name}</span>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Sidebar - Desktop Only */}
      <aside className="hidden lg:block fixed top-0 left-0 h-full w-64 bg-dark-surface border-r border-dark-border z-50">
        {/* Logo */}
        <div className="flex items-center px-6 py-6 border-b border-dark-border">
          <Link
            to="/dashboard"
            className="flex items-center gap-3 group transition-all duration-200 hover:scale-105 w-full"
          >
            <div className="flex flex-col w-full">
              <span className="text-2xl font-bold text-gradient tracking-tight">
                FinSight
              </span>
              <span className="text-xs text-gray-500 font-medium -mt-1">
                Smart Finance
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="px-4 py-6 space-y-2">
          {navigation.map((item) => (
            <NavLink key={item.name} item={item} />
          ))}
        </nav>

        {/* User Section */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-dark-border p-4 bg-dark-surface">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-10 h-10 rounded-full bg-gradient-ai flex items-center justify-center overflow-hidden">
              {hasProfilePicture(user?.profilePicture) ? (
                <img
                  src={`${API_URL}${user.profilePicture}`}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.error('Failed to load profile picture:', user.profilePicture);
                    e.target.style.display = 'none';
                  }}
                />
              ) : (
                <span className="text-sm font-bold text-white">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.name}
              </p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-30 bg-dark-surface border-b border-dark-border px-4 py-4 backdrop-blur-lg bg-opacity-95">
          <div className="flex items-center justify-between">
            <div className="w-10" /> {/* Spacer for symmetry */}
            <Link
              to="/dashboard"
              className="flex items-center gap-2 group transition-all duration-200"
            >
              <div className="flex flex-col">
                <span className="text-xl font-bold text-gradient tracking-tight leading-tight">
                  FinSight
                </span>
                <span className="text-[10px] text-gray-500 font-medium -mt-0.5">
                  Smart Finance
                </span>
              </div>
            </Link>
            {/* User Menu Button */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="w-10 h-10 rounded-full bg-gradient-ai flex items-center justify-center transition-all hover:scale-105 overflow-hidden"
              >
                {hasProfilePicture(user?.profilePicture) ? (
                  <img
                    src={`${API_URL}${user.profilePicture}`}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error('Failed to load profile picture:', user.profilePicture);
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <span className="text-sm font-bold text-white">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                )}
              </button>

              {/* User Dropdown Menu */}
              <AnimatePresence>
                {isUserMenuOpen && (
                  <>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setIsUserMenuOpen(false)}
                      className="fixed inset-0 z-40"
                    />
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-56 bg-dark-card border border-dark-border rounded-xl shadow-2xl overflow-hidden z-50"
                    >
                      <div className="p-4 border-b border-dark-border">
                        <p className="text-sm font-medium text-white truncate">
                          {user?.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                      </div>
                      <div className="p-2">
                        <Link
                          to="/settings"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:bg-dark-hover hover:text-white rounded-lg transition-colors"
                        >
                          <Settings className="w-4 h-4" />
                          <span className="text-sm font-medium">Settings</span>
                        </Link>
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            handleLogout();
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          <span className="text-sm font-medium">Logout</span>
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="min-h-screen p-6 pb-24 lg:pb-8 lg:p-8">{children}</main>

        {/* Floating Action Button - Desktop Only */}
        <Link
          to="/transactions"
          className="fab hidden lg:flex"
          title="Add Transaction"
        >
          <Plus className="w-6 h-6" />
        </Link>

        {/* Mobile Bottom Navigation */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-dark-surface border-t border-dark-border z-40 safe-area-bottom">
          <div className="flex items-center justify-around px-1 py-2.5">
            {bottomNavItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`
                    flex flex-col items-center gap-1 px-2 py-2 rounded-xl transition-all duration-200 flex-1 max-w-[80px]
                    ${isActive ? 'text-primary-500' : 'text-gray-500'}
                  `}
                >
                  <item.icon
                    className={`w-5 h-5 sm:w-6 sm:h-6 transition-all duration-200 ${
                      isActive ? 'scale-110' : 'scale-100'
                    }`}
                  />
                  <span className={`text-[10px] sm:text-xs font-medium truncate max-w-full ${
                    isActive ? 'text-primary-400' : 'text-gray-500'
                  }`}>
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
};

export default MainLayout;
