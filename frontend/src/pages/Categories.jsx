/**
 * Categories Page
 * Manage transaction categories with custom icons
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Edit2,
  Trash2,
  TrendingUp,
  TrendingDown,
  Tag,
  Smile,
} from 'lucide-react';

// Layout & Components
import MainLayout from '../components/layout/MainLayout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import LoadingSpinner from '../components/ui/LoadingSpinner';

// Store
import useFinancialStore from '../store/financialStore';

const Categories = () => {
  const {
    categories,
    isLoadingCategories,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
  } = useFinancialStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'expense',
    emoji: '📁',
    description: '',
  });

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Category type options
  const typeOptions = [
    { value: 'income', label: '💰 Income' },
    { value: 'expense', label: '💸 Expense' },
  ];

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    const categoryData = {
      name: formData.name,
      type: formData.type,
      emoji: formData.emoji,
      description: formData.description,
    };

    try {
      if (editingCategory) {
        await updateCategory(editingCategory._id, categoryData);
      } else {
        await createCategory(categoryData);
      }

      // Reset form
      setIsModalOpen(false);
      setEditingCategory(null);
      setFormData({
        name: '',
        type: 'expense',
        emoji: '📁',
        description: '',
      });
    } catch (error) {
      console.error('Error saving category:', error);
    }
  };

  // Handle form change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle edit
  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      type: category.type,
      emoji: category.emoji || '📁',
      description: category.description || '',
    });
    setIsModalOpen(true);
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (
      window.confirm(
        'Are you sure you want to delete this category? This action cannot be undone.'
      )
    ) {
      try {
        await deleteCategory(id);
      } catch (error) {
        console.error('Error deleting category:', error);
      }
    }
  };

  // Separate categories by type
  const incomeCategories = categories.filter((cat) => cat.type === 'income');
  const expenseCategories = categories.filter((cat) => cat.type === 'expense');

  if (isLoadingCategories && categories.length === 0) {
    return (
      <MainLayout>
        <LoadingSpinner fullScreen text="Loading categories..." />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Categories</h1>
            <p className="text-gray-400 mt-1">
              Organize your transactions with custom categories
            </p>
          </div>
          <Button
            icon={<Plus className="w-4 h-4" />}
            onClick={() => {
              setEditingCategory(null);
              setFormData({
                name: '',
                type: 'expense',
                emoji: '📁',
                description: '',
              });
              setIsModalOpen(true);
            }}
          >
            Add Category
          </Button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
          {[
            {
              label: 'Total Categories',
              value: categories.length,
              icon: Tag,
              gradient: 'from-primary-500/20 to-secondary-500/20',
              iconBg: 'bg-gradient-to-br from-primary-500 to-secondary-500',
              glow: 'shadow-lg shadow-primary-500/20',
            },
            {
              label: 'Income Categories',
              value: incomeCategories.length,
              icon: TrendingUp,
              gradient: 'from-green-500/20 to-emerald-500/20',
              iconBg: 'bg-gradient-to-br from-green-500 to-emerald-500',
              glow: 'shadow-lg shadow-green-500/20',
            },
            {
              label: 'Expense Categories',
              value: expenseCategories.length,
              icon: TrendingDown,
              gradient: 'from-red-500/20 to-rose-500/20',
              iconBg: 'bg-gradient-to-br from-red-500 to-rose-500',
              glow: 'shadow-lg shadow-red-500/20',
            },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className={`
                relative overflow-hidden rounded-xl sm:rounded-2xl p-3 sm:p-6
                bg-gradient-to-br ${stat.gradient}
                backdrop-blur-xl border border-white/10
                hover:border-white/20 transition-all duration-300
                ${stat.glow} hover:shadow-xl
                group cursor-pointer
              `}
            >
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:2rem_2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="relative flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs sm:text-sm text-gray-400 mb-1 sm:mb-2">
                    {stat.label}
                  </p>
                  <p className="text-lg sm:text-2xl font-bold text-white truncate">
                    {stat.value}
                  </p>
                </div>
                <div
                  className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${stat.iconBg} flex items-center justify-center shadow-lg flex-shrink-0 ml-2`}
                >
                  <stat.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Categories Sections */}
        <div className="space-y-6">
          {/* Income Categories */}
          <div>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              Income Categories
            </h2>
            {incomeCategories.length === 0 ? (
              <Card>
                <div className="text-center py-8">
                  <p className="text-gray-400 text-sm">No income categories yet</p>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                {incomeCategories.map((category, index) => (
                  <motion.div
                    key={category._id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2, delay: index * 0.03 }}
                  >
                    <div className="relative overflow-hidden rounded-xl p-4 bg-gradient-to-br from-dark-card/80 to-dark-card/40 backdrop-blur-xl border border-white/10 hover:border-green-500/50 transition-all duration-300 shadow-lg hover:shadow-green-500/20 group">
                      <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      <div className="relative">
                        <div className="flex items-start justify-between mb-3">
                          <div className="text-3xl sm:text-4xl">{category.emoji}</div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleEdit(category)}
                              className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(category._id)}
                              className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <h3 className="text-sm font-semibold text-white mb-1 truncate">
                          {category.name}
                        </h3>
                        {category.description && (
                          <p className="text-xs text-gray-500 line-clamp-2">
                            {category.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Expense Categories */}
          <div>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-red-400" />
              Expense Categories
            </h2>
            {expenseCategories.length === 0 ? (
              <Card>
                <div className="text-center py-8">
                  <p className="text-gray-400 text-sm">No expense categories yet</p>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                {expenseCategories.map((category, index) => (
                  <motion.div
                    key={category._id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2, delay: index * 0.03 }}
                  >
                    <div className="relative overflow-hidden rounded-xl p-4 bg-gradient-to-br from-dark-card/80 to-dark-card/40 backdrop-blur-xl border border-white/10 hover:border-red-500/50 transition-all duration-300 shadow-lg hover:shadow-red-500/20 group">
                      <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      <div className="relative">
                        <div className="flex items-start justify-between mb-3">
                          <div className="text-3xl sm:text-4xl">{category.emoji}</div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleEdit(category)}
                              className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(category._id)}
                              className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <h3 className="text-sm font-semibold text-white mb-1 truncate">
                          {category.name}
                        </h3>
                        {category.description && (
                          <p className="text-xs text-gray-500 line-clamp-2">
                            {category.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Add/Edit Category Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingCategory(null);
          }}
          title={editingCategory ? 'Edit Category' : 'Add Category'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Category Type */}
            <Select
              label="Category Type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              options={typeOptions}
              required
            />

            {/* Category Name */}
            <Input
              label="Category Name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Groceries, Salary, Rent"
              required
              maxLength={50}
            />

            {/* Emoji Picker */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Choose an Emoji Icon
              </label>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <Input
                    type="text"
                    name="emoji"
                    value={formData.emoji}
                    onChange={handleChange}
                    placeholder="Click to choose emoji"
                    maxLength={10}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    // Trigger emoji picker by focusing the input
                    const input = document.querySelector('input[name="emoji"]');
                    if (input) {
                      input.focus();
                      // On some browsers, this will trigger the emoji picker
                      if (input.showPicker) {
                        input.showPicker();
                      }
                    }
                  }}
                  className="px-4 py-3 rounded-xl bg-dark-hover border border-white/10 hover:border-primary-500 transition-all text-2xl"
                  title="Choose emoji"
                >
                  <Smile className="w-6 h-6 text-gray-400" />
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                💡 Tip: On most devices, you can type an emoji directly or use your system's emoji picker
                (Windows: Win + . | Mac: Cmd + Ctrl + Space)
              </p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description (Optional)
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Add notes about this category..."
                rows={3}
                maxLength={200}
                className="w-full px-4 py-3 rounded-xl bg-dark-hover border border-white/10 text-white placeholder-gray-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all resize-none"
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingCategory(null);
                }}
                fullWidth
              >
                Cancel
              </Button>
              <Button type="submit" fullWidth>
                {editingCategory ? 'Update' : 'Add'} Category
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </MainLayout>
  );
};

export default Categories;
