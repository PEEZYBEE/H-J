// ~/hnj/frontend/src/components/products/CategoryManager.jsx
import React, { useState, useEffect } from 'react';
import {
  FolderTree,
  Plus,
  Edit,
  Trash2,
  ChevronRight,
  ChevronDown,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  Layers,
  Grid,
  List
} from 'lucide-react';
import { categoriesAPI } from '../../services/api';

const CategoryManager = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [viewMode, setViewMode] = useState('tree');
  
  // Modal states
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSubcategoryModal, setShowSubcategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingSubcategory, setEditingSubcategory] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await categoriesAPI.getAllCategories();
      if (response.success) {
        setCategories(response.categories || []);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      setError('Failed to load categories. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const handleCreateCategory = async (categoryData) => {
    try {
      const response = await categoriesAPI.createCategory(categoryData);
      if (response.success) {
        setSuccess('Category created successfully!');
        await fetchCategories();
        setShowCategoryModal(false);
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create category');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleUpdateCategory = async (categoryId, categoryData) => {
    try {
      const response = await categoriesAPI.updateCategory(categoryId, categoryData);
      if (response.success) {
        setSuccess('Category updated successfully!');
        await fetchCategories();
        setEditingCategory(null);
        setShowCategoryModal(false);
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update category');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await categoriesAPI.deleteCategory(categoryId);
      if (response.success) {
        setSuccess('Category deleted successfully!');
        await fetchCategories();
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to delete category');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleCreateSubcategory = async (categoryId, subcategoryData) => {
    try {
      const response = await categoriesAPI.createSubcategory(categoryId, subcategoryData);
      if (response.success) {
        setSuccess('Subcategory created successfully!');
        await fetchCategories();
        setShowSubcategoryModal(false);
        setSelectedCategory(null);
        setExpandedCategories(prev => ({ ...prev, [categoryId]: true }));
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create subcategory');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleUpdateSubcategory = async (subcategoryId, subcategoryData) => {
    try {
      const response = await categoriesAPI.updateSubcategory(subcategoryId, subcategoryData);
      if (response.success) {
        setSuccess('Subcategory updated successfully!');
        await fetchCategories();
        setEditingSubcategory(null);
        setShowSubcategoryModal(false);
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update subcategory');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleDeleteSubcategory = async (subcategoryId) => {
    if (!window.confirm('Are you sure you want to delete this subcategory? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await categoriesAPI.deleteSubcategory(subcategoryId);
      if (response.success) {
        setSuccess('Subcategory deleted successfully!');
        await fetchCategories();
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to delete subcategory');
      setTimeout(() => setError(null), 3000);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <FolderTree className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Category Manager</h2>
              <p className="text-sm text-blue-100">Manage product categories and subcategories</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-white/10 rounded-lg p-1 flex">
              <button
                onClick={() => setViewMode('tree')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'tree' 
                    ? 'bg-white text-blue-600' 
                    : 'text-white hover:bg-white/20'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-white text-blue-600' 
                    : 'text-white hover:bg-white/20'
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={() => {
                setEditingCategory(null);
                setShowCategoryModal(true);
              }}
              className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 flex items-center gap-2 transition-colors font-medium"
            >
              <Plus className="w-4 h-4" />
              Add Category
            </button>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="mx-6 mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}

      {/* Categories List */}
      <div className="p-6">
        {categories.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-gray-50 rounded-lg p-8 max-w-md mx-auto">
              <FolderTree className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Categories Yet</h3>
              <p className="text-gray-600 mb-6">
                Create your first product category to start organizing your inventory.
              </p>
              <button
                onClick={() => setShowCategoryModal(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center gap-2 font-medium"
              >
                <Plus className="w-4 h-4" />
                Create First Category
              </button>
            </div>
          </div>
        ) : viewMode === 'tree' ? (
          <div className="space-y-3">
            {categories.map(category => (
              <CategoryTreeItem
                key={category.id}
                category={category}
                expanded={expandedCategories[category.id]}
                onToggle={() => toggleCategory(category.id)}
                onEdit={() => {
                  setEditingCategory(category);
                  setShowCategoryModal(true);
                }}
                onDelete={() => handleDeleteCategory(category.id)}
                onAddSubcategory={() => {
                  setSelectedCategory(category);
                  setEditingSubcategory(null);
                  setShowSubcategoryModal(true);
                }}
                onEditSubcategory={(subcategory) => {
                  setSelectedCategory(category);
                  setEditingSubcategory(subcategory);
                  setShowSubcategoryModal(true);
                }}
                onDeleteSubcategory={handleDeleteSubcategory}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map(category => (
              <CategoryGridItem
                key={category.id}
                category={category}
                onEdit={() => {
                  setEditingCategory(category);
                  setShowCategoryModal(true);
                }}
                onDelete={() => handleDeleteCategory(category.id)}
                onAddSubcategory={() => {
                  setSelectedCategory(category);
                  setEditingSubcategory(null);
                  setShowSubcategoryModal(true);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Category Modal */}
      {showCategoryModal && (
        <CategoryModal
          category={editingCategory}
          onClose={() => {
            setShowCategoryModal(false);
            setEditingCategory(null);
          }}
          onSave={editingCategory ? handleUpdateCategory : handleCreateCategory}
        />
      )}

      {/* Subcategory Modal */}
      {showSubcategoryModal && selectedCategory && (
        <SubcategoryModal
          category={selectedCategory}
          subcategory={editingSubcategory}
          onClose={() => {
            setShowSubcategoryModal(false);
            setSelectedCategory(null);
            setEditingSubcategory(null);
          }}
          onSave={editingSubcategory ? handleUpdateSubcategory : handleCreateSubcategory}
        />
      )}
    </div>
  );
};

// Category Tree Item Component
const CategoryTreeItem = ({ 
  category, 
  expanded, 
  onToggle, 
  onEdit, 
  onDelete, 
  onAddSubcategory,
  onEditSubcategory,
  onDeleteSubcategory 
}) => {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
        <div className="flex items-center gap-3 flex-1">
          <button
            onClick={onToggle}
            className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
          >
            {expanded ? (
              <ChevronDown className="w-4 h-4 text-gray-600" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-600" />
            )}
          </button>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
              {category.code}
            </span>
            <span className="font-medium text-gray-900">{category.name}</span>
            <span className="text-xs text-gray-500">
              ({category.product_count || 0} products)
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onAddSubcategory}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Add Subcategory"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={onEdit}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit Category"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete Category"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {expanded && (
        <div className="p-4 bg-white border-t border-gray-200">
          {category.description && (
            <p className="text-sm text-gray-600 mb-3">{category.description}</p>
          )}
          
          {category.subcategories?.length > 0 ? (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Subcategories
              </h4>
              {category.subcategories.map(sub => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-800 text-xs font-medium rounded">
                      {sub.code}
                    </span>
                    <span className="text-sm text-gray-700">{sub.name}</span>
                    <span className="text-xs text-gray-500">
                      ({sub.product_count || 0} products)
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEditSubcategory(sub)}
                      className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit Subcategory"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteSubcategory(sub.id)}
                      className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Subcategory"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">No subcategories yet</p>
          )}
        </div>
      )}
    </div>
  );
};

// Category Grid Item Component
const CategoryGridItem = ({ category, onEdit, onDelete, onAddSubcategory }) => {
  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
              {category.code}
            </span>
            <h3 className="font-medium text-gray-900">{category.name}</h3>
          </div>
          <p className="text-sm text-gray-600 line-clamp-2">
            {category.description || 'No description'}
          </p>
        </div>
      </div>
      
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">
            {category.product_count || 0} products
          </span>
          <span className="text-xs text-gray-500">
            {category.subcategories?.length || 0} subcategories
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onAddSubcategory}
            className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Add Subcategory"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={onEdit}
            className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit Category"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete Category"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Category Modal Component
const CategoryModal = ({ category, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    code: category?.code || '',
    name: category?.name || '',
    description: category?.description || '',
    sort_order: category?.sort_order || 0,
    image_url: category?.image_url || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.code.trim()) {
      setError('Category code is required');
      return;
    }
    if (!formData.name.trim()) {
      setError('Category name is required');
      return;
    }
    
    setLoading(true);
    try {
      if (category) {
        await onSave(category.id, formData);
      } else {
        await onSave(formData);
      }
    } catch (error) {
      setError(error.message || 'Failed to save category');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Layers className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">
              {category ? 'Edit Category' : 'Create New Category'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                placeholder="e.g., KIT, FBS, TPA"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                maxLength="10"
              />
              <p className="mt-1 text-xs text-gray-500">
                3-4 letter code, e.g., KIT for Kitchenware
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="e.g., Kitchen & Dining Ware"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Describe what products belong in this category"
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sort Order
              </label>
              <input
                type="number"
                value={formData.sort_order}
                onChange={(e) => setFormData({...formData, sort_order: parseInt(e.target.value) || 0})}
                placeholder="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Lower numbers appear first
              </p>
            </div>
          </div>
          
          <div className="flex gap-3 mt-6 pt-4 border-t">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {category ? 'Update Category' : 'Create Category'}
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Subcategory Modal Component
const SubcategoryModal = ({ category, subcategory, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    code: subcategory?.code || '',
    name: subcategory?.name || '',
    description: subcategory?.description || '',
    sort_order: subcategory?.sort_order || 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.code.trim()) {
      setError('Subcategory code is required');
      return;
    }
    if (!formData.name.trim()) {
      setError('Subcategory name is required');
      return;
    }
    
    setLoading(true);
    try {
      if (subcategory) {
        await onSave(subcategory.id, formData);
      } else {
        await onSave(category.id, formData);
      }
    } catch (error) {
      setError(error.message || 'Failed to save subcategory');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Filter className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                {subcategory ? 'Edit Subcategory' : 'Create New Subcategory'}
              </h3>
              <p className="text-sm text-gray-600">
                Category: {category.code} - {category.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subcategory Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({...formData, code: e.target.value})}
                placeholder="e.g., 01, 02, 03"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                maxLength="10"
              />
              <p className="mt-1 text-xs text-gray-500">
                2-digit code, e.g., 01 for Cookware
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subcategory Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="e.g., Cookware, Bakeware, Utensils"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Describe this subcategory"
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sort Order
              </label>
              <input
                type="number"
                value={formData.sort_order}
                onChange={(e) => setFormData({...formData, sort_order: parseInt(e.target.value) || 0})}
                placeholder="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="flex gap-3 mt-6 pt-4 border-t">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {subcategory ? 'Update Subcategory' : 'Create Subcategory'}
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryManager;