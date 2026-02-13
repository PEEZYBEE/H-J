// ~/hnj/frontend/src/components/products/AddProduct.jsx - COMPLETE FIXED VERSION
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSave, FaTimes, FaPlus, FaMinus, FaUpload, FaTrash } from 'react-icons/fa';

const AddProduct = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [specFields, setSpecFields] = useState([{ key: '', value: '' }]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_id: '',
    subcategory_id: '',
    selling_price: '',
    cost_price: '',
    stock_quantity: '0',
    min_stock_level: '5',
    image_urls: [],
    uploaded_images: [],
    specifications: {},
    is_on_offer: false,
    offer_price: '',
    discount_percentage: '',
    brand: '',
    model: '',
    color: '',
    size: '',
    material: '',
    unit_of_measure: 'pcs'
  });

  const [localImages, setLocalImages] = useState([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (formData.category_id) {
      fetchSubcategories(formData.category_id);
    } else {
      setSubcategories([]);
    }
  }, [formData.category_id]);

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/products/categories', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setCategories(data.categories || data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchSubcategories = async (categoryId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/products/categories/${categoryId}/subcategories`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setSubcategories(data.subcategories || []);
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      setSubcategories([]);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    
    const validFiles = files.filter(file => {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      const maxSize = 5 * 1024 * 1024;
      
      if (!validTypes.includes(file.type)) {
        alert(`${file.name} is not a valid image type (JPEG, PNG, WEBP, GIF only)`);
        return false;
      }
      
      if (file.size > maxSize) {
        alert(`${file.name} is too large (max 5MB)`);
        return false;
      }
      
      return true;
    });

    if (validFiles.length === 0) return;

    const newLocalImages = validFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      name: file.name,
      size: (file.size / 1024 / 1024).toFixed(2) + 'MB'
    }));

    setLocalImages(prev => [...prev, ...newLocalImages]);
    await uploadImages(validFiles);
    e.target.value = '';
  };

  const uploadImages = async (files) => {
    try {
      setUploading(true);
      const token = localStorage.getItem('token');
      
      const formData = new FormData();
      files.forEach(file => {
        formData.append('images', file);
      });
      formData.append('folder', 'products');

      const response = await fetch('http://localhost:5000/api/products/upload/multiple', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setFormData(prev => ({
          ...prev,
          uploaded_images: [...prev.uploaded_images, ...data.imageUrls]
        }));
      } else {
        await uploadSingleImages(files);
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      alert('Error uploading images: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const uploadSingleImages = async (files) => {
    const token = localStorage.getItem('token');
    const uploadPromises = files.map(async (file) => {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('folder', 'products');

      const response = await fetch('http://localhost:5000/api/products/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Failed to upload ${file.name}`);
      }

      const data = await response.json();
      return data.imageUrl;
    });

    const uploadedUrls = await Promise.all(uploadPromises);
    
    setFormData(prev => ({
      ...prev,
      uploaded_images: [...prev.uploaded_images, ...uploadedUrls]
    }));

    alert(`Successfully uploaded ${uploadedUrls.length} image(s)`);
  };

  const removeImage = (index, isLocal = true) => {
    if (isLocal) {
      const updatedImages = [...localImages];
      URL.revokeObjectURL(updatedImages[index].preview);
      updatedImages.splice(index, 1);
      setLocalImages(updatedImages);
    } else {
      const updatedUrls = [...formData.uploaded_images];
      updatedUrls.splice(index, 1);
      setFormData(prev => ({ ...prev, uploaded_images: updatedUrls }));
    }
  };

  const handleSpecChange = (index, field, value) => {
    const updatedSpecs = [...specFields];
    updatedSpecs[index][field] = value;
    setSpecFields(updatedSpecs);
  };

  const addSpecField = () => {
    setSpecFields([...specFields, { key: '', value: '' }]);
  };

  const removeSpecField = (index) => {
    if (specFields.length > 1) {
      const updatedSpecs = specFields.filter((_, i) => i !== index);
      setSpecFields(updatedSpecs);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.category_id || !formData.selling_price || !formData.stock_quantity) {
      alert('Please fill in all required fields');
      return;
    }

    const specifications = {};
    specFields.forEach(spec => {
      if (spec.key.trim() && spec.value.trim()) {
        specifications[spec.key.trim()] = spec.value.trim();
      }
    });

    const allImageUrls = [...formData.uploaded_images, ...formData.image_urls.filter(url => url.trim())];

    // FIX: Convert empty subcategory_id to null, and ensure it's an integer if provided
    let subcategoryId = null;
    if (formData.subcategory_id && formData.subcategory_id !== '') {
      subcategoryId = parseInt(formData.subcategory_id);
    }

    const dataToSend = {
      name: formData.name,
      description: formData.description,
      category_id: parseInt(formData.category_id),
      subcategory_id: subcategoryId,  // FIXED: Will be null if empty, integer if selected
      selling_price: parseFloat(formData.selling_price) || 0,
      cost_price: formData.cost_price ? parseFloat(formData.cost_price) : null,
      stock_quantity: parseInt(formData.stock_quantity) || 0,
      min_stock_level: parseInt(formData.min_stock_level) || 5,
      brand: formData.brand || null,
      model: formData.model || null,
      color: formData.color || null,
      size: formData.size || null,
      material: formData.material || null,
      unit_of_measure: formData.unit_of_measure || 'pcs',
      is_on_offer: formData.is_on_offer || false,
      offer_price: formData.is_on_offer && formData.offer_price ? parseFloat(formData.offer_price) : null,
      discount_percentage: formData.is_on_offer && formData.discount_percentage ? parseInt(formData.discount_percentage) : null,
      image_urls: allImageUrls,
      specifications: Object.keys(specifications).length > 0 ? specifications : {}
    };

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/products/staff/products', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSend)
      });

      if (response.ok) {
        const result = await response.json();
        alert('Product added successfully!');
        
        localImages.forEach(img => URL.revokeObjectURL(img.preview));
        navigate('/products');
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add product');
      }
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add New Product</h1>
          <p className="text-gray-600">Fill in the essential details</p>
        </div>
        <button
          onClick={() => navigate('/products')}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <FaTimes /> Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="md:col-span-2">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">Basic Information</h2>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="e.g., Kids Electric Toothbrush"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Describe your product..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              name="category_id"
              value={formData.category_id}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
              required
            >
              <option value="">Select Category</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.code} - {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subcategory
            </label>
            <select
              name="subcategory_id"
              value={formData.subcategory_id}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
              disabled={!formData.category_id}
            >
              <option value="">Select Subcategory (Optional)</option>
              {subcategories.map(sub => (
                <option key={sub.id} value={sub.id}>
                  {sub.code} - {sub.name}
                </option>
              ))}
            </select>
          </div>

          {/* Pricing & Stock */}
          <div className="md:col-span-2 mt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">Pricing & Stock</h2>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selling Price (KSh) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              name="selling_price"
              value={formData.selling_price}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="1499.99"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cost Price (KSh) - Optional
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              name="cost_price"
              value={formData.cost_price}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="What you paid for it"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Stock Quantity <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              name="stock_quantity"
              value={formData.stock_quantity}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Low Stock Alert Level
            </label>
            <input
              type="number"
              min="0"
              name="min_stock_level"
              value={formData.min_stock_level}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Get notified when stock is low"
            />
          </div>

          {/* Brand/Model/Color/Size Section */}
          <div className="md:col-span-2 mt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">Product Attributes</h2>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
            <input
              type="text"
              name="brand"
              value={formData.brand}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="e.g., Philips, Oral-B"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
            <input
              type="text"
              name="model"
              value={formData.model}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="e.g., HX-1234"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
            <input
              type="text"
              name="color"
              value={formData.color}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="e.g., Blue, Pink"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Size</label>
            <input
              type="text"
              name="size"
              value={formData.size}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="e.g., Small, Large, 100ml"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Material</label>
            <input
              type="text"
              name="material"
              value={formData.material}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="e.g., Plastic, Stainless Steel"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Unit of Measure</label>
            <input
              type="text"
              name="unit_of_measure"
              value={formData.unit_of_measure}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="pcs, kg, L, etc."
            />
          </div>

          {/* Special Offer Section */}
          <div className="md:col-span-2 mt-6">
            <div className="flex items-center gap-3 mb-4">
              <input
                type="checkbox"
                id="is_on_offer"
                name="is_on_offer"
                checked={formData.is_on_offer}
                onChange={handleChange}
                className="h-5 w-5 text-red-600 rounded focus:ring-red-500"
              />
              <label htmlFor="is_on_offer" className="text-sm font-medium text-gray-700">
                This product is on special offer
              </label>
            </div>

            {formData.is_on_offer && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-lg border border-red-100">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Offer Price (KSh)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    name="offer_price"
                    value={formData.offer_price}
                    onChange={handleChange}
                    className="w-full border border-red-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Discounted price"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Discount Percentage
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    name="discount_percentage"
                    value={formData.discount_percentage}
                    onChange={handleChange}
                    className="w-full border border-red-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="e.g., 20 for 20% off"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Image Upload Section */}
          <div className="md:col-span-2 mt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">Product Images</h2>
            
            <div className="mb-6">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                multiple
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current.click()}
                disabled={uploading}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-blue-700 disabled:opacity-50"
              >
                <FaUpload />
                {uploading ? 'Uploading...' : 'Upload Images from Device'}
              </button>
              <p className="text-sm text-gray-500 mt-2">
                Supports JPEG, PNG, WEBP, GIF (max 5MB each)
              </p>
            </div>

            {/* Image Previews */}
            {(localImages.length > 0 || formData.uploaded_images.length > 0) && (
              <div className="mb-6">
                <h3 className="text-md font-medium text-gray-700 mb-3">Uploaded Images:</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {localImages.map((image, index) => (
                    <div key={`local-${index}`} className="relative group">
                      <img
                        src={image.preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border border-gray-200"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => removeImage(index, true)}
                          className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700"
                        >
                          <FaTrash />
                        </button>
                      </div>
                      <div className="text-xs text-gray-500 mt-1 truncate">
                        {image.name}
                      </div>
                    </div>
                  ))}

                  {formData.uploaded_images.map((url, index) => (
                    <div key={`uploaded-${index}`} className="relative group">
                      <img
                        src={`http://localhost:5000/api/uploads/products/${url.split('/').pop()}`}
                        alt={`Uploaded ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border border-gray-200"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://via.placeholder.com/150?text=Image+Error';
                        }}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => removeImage(index, false)}
                          className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Manual URL Input */}
            <div className="mb-4">
              <h3 className="text-md font-medium text-gray-700 mb-3">Or Add Image URLs:</h3>
              {formData.image_urls.map((url, index) => (
                <div key={index} className="flex gap-2 mb-3">
                  <input
                    type="text"
                    placeholder="/static/uploads/products/filename.jpg"
                    value={url}
                    onChange={(e) => {
                      const updatedUrls = [...formData.image_urls];
                      updatedUrls[index] = e.target.value;
                      setFormData(prev => ({ ...prev, image_urls: updatedUrls }));
                    }}
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                  {index === 0 ? (
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ 
                        ...prev, 
                        image_urls: [...prev.image_urls, ''] 
                      }))}
                      className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 flex items-center gap-2"
                    >
                      <FaPlus /> Add URL
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        const updatedUrls = formData.image_urls.filter((_, i) => i !== index);
                        setFormData(prev => ({ ...prev, image_urls: updatedUrls }));
                      }}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                    >
                      <FaMinus />
                    </button>
                  )}
                </div>
              ))}
              {formData.image_urls.length === 0 && (
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ 
                    ...prev, 
                    image_urls: [''] 
                  }))}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
                >
                  <FaPlus /> Add Image URL
                </button>
              )}
            </div>
          </div>

          {/* Specifications */}
          <div className="md:col-span-2 mt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Additional Specifications</h2>
              <button
                type="button"
                onClick={addSpecField}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                <FaPlus /> Add Specification
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">Add key details like Color, Size, Brand, etc.</p>
            
            {specFields.map((spec, index) => (
              <div key={index} className="flex gap-2 mb-3">
                <input
                  type="text"
                  placeholder="Key (e.g., Color)"
                  value={spec.key}
                  onChange={(e) => handleSpecChange(index, 'key', e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="Value (e.g., Black)"
                  value={spec.value}
                  onChange={(e) => handleSpecChange(index, 'value', e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
                {specFields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSpecField(index)}
                    className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                  >
                    <FaMinus />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="mt-8 pt-6 border-t flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/products')}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || uploading}
            className="flex items-center gap-2 bg-red-600 text-white px-8 py-3 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Adding Product...
              </>
            ) : (
              <>
                <FaSave /> Add Product
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddProduct;