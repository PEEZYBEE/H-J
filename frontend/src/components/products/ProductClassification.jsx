// ~/hnj/frontend/src/components/products/ProductClassification.jsx
import React, { useState, useEffect } from 'react';
import { 
  Tag, 
  Layers, 
  Filter, 
  Check, 
  X, 
  AlertCircle, 
  CheckCircle,
  ArrowRight,
  Package,
  Barcode
} from 'lucide-react';
import { categoriesAPI, productsAPI } from '../../services/api';

const ProductClassification = ({ product, onClassified, onClose }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchCategories();
    if (product) {
      setSelectedCategory(product.category?.id || null);
      setSelectedSubcategory(product.subcategory?.id || null);
    }
  }, [product]);

  const fetchCategories = async () => {
    try {
      setFetching(true);
      const response = await categoriesAPI.getAllCategories();
      if (response.success) {
        setCategories(response.categories || []);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      setError('Failed to load categories. Please try again.');
    } finally {
      setFetching(false);
    }
  };

  const handleClassify = async () => {
    if (!selectedCategory) {
      setError('Please select a category');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await productsAPI.classifyProduct({
        product_id: product.id,
        category_id: selectedCategory,
        subcategory_id: selectedSubcategory || null
      });

      if (response.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        
        if (onClassified) {
          onClassified(response.product);
        }
      }
    } catch (error) {
      console.error('Failed to classify product:', error);
      setError(error.response?.data?.message || 'Failed to classify product');
    } finally {
      setLoading(false);
    }
  };

  const getSelectedCategory = () => {
    return categories.find(c => c.id === selectedCategory);
  };

  const getCategoryCode = () => {
    const cat = getSelectedCategory();
    return cat ? cat.code : '';
  };

  const getSubcategoryCode = () => {
    const cat = getSelectedCategory();
    const sub = cat?.subcategories?.find(s => s.id === selectedSubcategory);
    return sub ? sub.code : '';
  };

  if (fetching) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex flex-col items-center justify-center py-8">
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
              <Tag className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Product Classification</h3>
              <p className="text-sm text-blue-100">Categorize product for better organization</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          )}
        </div>
      </div>

      {/* Product Info */}
      {product && (
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-start gap-4">
            {product.image_urls && product.image_urls.length > 0 ? (
              <img 
                src={product.image_urls[0]} 
                alt={product.name}
                className="w-16 h-16 object-cover rounded-lg border border-gray-200"
              />
            ) : (
              <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                <Package className="w-8 h-8 text-gray-400" />
              </div>
            )}
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">{product.name}</h4>
              <p className="text-sm text-gray-600">SKU: {product.sku}</p>
              {product.barcode && (
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  <Barcode className="w-3 h-3" />
                  {product.barcode}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Classification Form */}
      <div className="p-6">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-700">Product classified successfully!</p>
          </div>
        )}

        <div className="space-y-6">
          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <span>Broad Category <span className="text-red-500">*</span></span>
              </div>
            </label>
            <select
              value={selectedCategory || ''}
              onChange={(e) => {
                setSelectedCategory(e.target.value ? parseInt(e.target.value) : null);
                setSelectedSubcategory(null);
                setError(null);
              }}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
            >
              <option value="">-- Select a category --</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.code} - {category.name} ({category.product_count || 0} products)
                </option>
              ))}
            </select>
            {categories.length === 0 && (
              <p className="mt-2 text-sm text-amber-600">
                No categories found. Please create categories first.
              </p>
            )}
          </div>

          {/* Subcategory Selection */}
          {selectedCategory && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-blue-600" />
                  <span>Subcategory (Optional)</span>
                </div>
              </label>
              <select
                value={selectedSubcategory || ''}
                onChange={(e) => {
                  setSelectedSubcategory(e.target.value ? parseInt(e.target.value) : null);
                  setError(null);
                }}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
              >
                <option value="">-- No subcategory --</option>
                {getSelectedCategory()?.subcategories?.map(sub => (
                  <option key={sub.id} value={sub.id}>
                    {sub.code} - {sub.name} ({sub.product_count || 0} products)
                  </option>
                ))}
              </select>
              {getSelectedCategory()?.subcategories?.length === 0 && (
                <p className="mt-2 text-sm text-gray-500">
                  No subcategories in this category. You can add them later.
                </p>
              )}
            </div>
          )}

          {/* Classification Preview */}
          {selectedCategory && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="text-sm font-medium text-blue-800 mb-3">Classification Preview</h4>
              <div className="flex items-center gap-2 text-sm">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md font-mono">
                  {getCategoryCode() || '???'}
                </span>
                <ArrowRight className="w-4 h-4 text-blue-400" />
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md font-mono">
                  {getSubcategoryCode() || '00'}
                </span>
                <ArrowRight className="w-4 h-4 text-blue-400" />
                <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-md font-mono">
                  {product?.sku || 'SKU'}
                </span>
              </div>
              <p className="text-xs text-blue-600 mt-2">
                This classification will be used for barcode generation and product organization
              </p>
            </div>
          )}

          {/* Current Classification */}
          {product?.category && !selectedCategory && (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-2">Current Classification:</p>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-gray-200 text-gray-800 rounded-md text-sm">
                  {product.category.code} - {product.category.name}
                </span>
                {product.subcategory && (
                  <>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                    <span className="px-2 py-1 bg-gray-200 text-gray-800 rounded-md text-sm">
                      {product.subcategory.code} - {product.subcategory.name}
                    </span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={handleClassify}
              disabled={loading || !selectedCategory}
              className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors font-medium"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Classifying...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Save Classification
                </>
              )}
            </button>
            <button
              onClick={() => {
                setSelectedCategory(product?.category?.id || null);
                setSelectedSubcategory(product?.subcategory?.id || null);
                setError(null);
              }}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2 transition-colors font-medium"
            >
              <X className="w-4 h-4" />
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          <span className="font-medium">Note:</span> Classifying products helps with inventory organization, 
          sales reporting, and barcode generation.
        </p>
      </div>
    </div>
  );
};

export default ProductClassification;