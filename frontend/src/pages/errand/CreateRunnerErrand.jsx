// src/website/pages/CreateRunnerErrand.jsx - With Product & Receipt Photos
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaArrowLeft, 
  FaBox,
  FaMapMarkerAlt,
  FaCheckCircle,
  FaCamera,
  FaUpload,
  FaTrash,
  FaTimes,
  FaFileInvoice
} from 'react-icons/fa';

const CreateRunnerErrand = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Photo states
  const [productPhoto, setProductPhoto] = useState(null);
  const [productPhotoPreview, setProductPhotoPreview] = useState(null);
  const [receiptPhoto, setReceiptPhoto] = useState(null);
  const [receiptPhotoPreview, setReceiptPhotoPreview] = useState(null);
  
  // Refs for file inputs
  const productCameraInput = useRef(null);
  const productGalleryInput = useRef(null);
  const receiptCameraInput = useRef(null);
  const receiptGalleryInput = useRef(null);

  const [formData, setFormData] = useState({
    product_name: '',
    quantity: 1,
    market_location: '',
    preferred_vendor: '',
    max_price: '',
    notes: ''
  });

  // Product Photo Handlers
  const handleProductCameraCapture = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File too large. Maximum size is 5MB.');
        return;
      }
      setProductPhoto(file);
      setProductPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleProductGallerySelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File too large. Maximum size is 5MB.');
        return;
      }
      setProductPhoto(file);
      setProductPhotoPreview(URL.createObjectURL(file));
    }
  };

  // Receipt Photo Handlers
  const handleReceiptCameraCapture = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File too large. Maximum size is 5MB.');
        return;
      }
      setReceiptPhoto(file);
      setReceiptPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleReceiptGallerySelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File too large. Maximum size is 5MB.');
        return;
      }
      setReceiptPhoto(file);
      setReceiptPhotoPreview(URL.createObjectURL(file));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.product_name) {
      newErrors.product_name = 'Product name is required';
    }
    if (!formData.quantity || formData.quantity < 1) {
      newErrors.quantity = 'Valid quantity is required';
    }
    if (!formData.market_location) {
      newErrors.market_location = 'Market location is required';
    }
    if (!formData.preferred_vendor) {
      newErrors.preferred_vendor = 'Vendor name is required';
    }
    if (!formData.max_price) {
      newErrors.max_price = 'Price is required';
    }
    if (!productPhoto && !productPhotoPreview) {
      newErrors.productPhoto = 'Product photo is required';
    }
    if (!receiptPhoto && !receiptPhotoPreview) {
      newErrors.receiptPhoto = 'Receipt photo is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      
      // Get current user (runner) ID
      const userData = JSON.parse(localStorage.getItem('user') || '{}');

      // Create FormData for multipart upload
      const formDataObj = new FormData();
      
      // Append photos
      if (productPhoto) {
        formDataObj.append('product_photo', productPhoto);
      }
      if (receiptPhoto) {
        formDataObj.append('receipt_photo', receiptPhoto);
      }
      
      // Append form fields as JSON string in a 'data' field
      const errandData = {
        type: 'sourcing',
        product_name: formData.product_name,
        quantity: parseInt(formData.quantity),
        market_location: formData.market_location,
        preferred_vendor: formData.preferred_vendor,
        max_price: parseFloat(formData.max_price),
        notes: formData.notes || undefined,
        assigned_to: userData.id,
        status: 'submitted'
      };
      
      formDataObj.append('data', JSON.stringify(errandData));

      console.log('Submitting runner errand with photos:', errandData);

      const response = await fetch('/api/errands/with-submission', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataObj
      });

      const data = await response.json();

      if (response.ok) {
        alert('✅ Errand submitted for approval!');
        navigate('/errands?tab=pending');
      } else {
        alert(data.message || 'Failed to create errand');
      }
    } catch (error) {
      console.error('Error creating errand:', error);
      alert('Failed to create errand');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-3 md:p-6">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/errands')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <FaArrowLeft className="mr-1" />
            Back to Dashboard
          </button>
          
          <h1 className="text-xl md:text-3xl font-bold text-gray-900">Create Errand</h1>
          <p className="text-sm md:text-base text-gray-600">Take photos and provide market details</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-4 md:p-6">
          
          {/* Product Information */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FaBox className="text-blue-600" />
              Product Information
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={formData.product_name}
                  onChange={(e) => setFormData({...formData, product_name: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm ${
                    errors.product_name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Hello Kitty Flask"
                />
                {errors.product_name && (
                  <p className="text-red-500 text-xs mt-1">{errors.product_name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity *
                </label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                  min="1"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm ${
                    errors.quantity ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.quantity && (
                  <p className="text-red-500 text-xs mt-1">{errors.quantity}</p>
                )}
              </div>
            </div>
          </div>

          {/* Product Photo Section */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FaCamera className="text-blue-600" />
              Product Photo *
            </h2>
            
            {productPhotoPreview ? (
              <div className="relative mb-4">
                <img 
                  src={productPhotoPreview} 
                  alt="Product preview" 
                  className="w-full h-48 md:h-64 object-cover rounded-lg border-2 border-gray-300"
                />
                <button
                  type="button"
                  onClick={() => {
                    setProductPhoto(null);
                    setProductPhotoPreview(null);
                  }}
                  className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700"
                >
                  <FaTrash />
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 md:gap-3 mb-4">
                {/* Camera button - opens native camera */}
                <button
                  type="button"
                  onClick={() => productCameraInput.current?.click()}
                  className="flex flex-col items-center justify-center p-4 md:p-6 border-2 border-dashed rounded-lg hover:border-blue-500 transition-colors border-gray-300 bg-gray-50"
                >
                  <FaCamera className="w-6 h-6 md:w-8 md:h-8 text-gray-600 mb-2" />
                  <span className="text-sm md:text-base font-medium text-gray-800">Use Camera</span>
                  <span className="text-xs text-gray-500">Take photo now</span>
                </button>
                
                {/* Gallery button - opens gallery */}
                <button
                  type="button"
                  onClick={() => productGalleryInput.current?.click()}
                  className="flex flex-col items-center justify-center p-4 md:p-6 border-2 border-dashed rounded-lg hover:border-blue-500 transition-colors border-gray-300 bg-gray-50"
                >
                  <FaUpload className="w-6 h-6 md:w-8 md:h-8 text-gray-600 mb-2" />
                  <span className="text-sm md:text-base font-medium text-gray-800">From Gallery</span>
                  <span className="text-xs text-gray-500">Choose from phone</span>
                </button>
              </div>
            )}
            
            {/* Hidden file inputs - one for camera, one for gallery */}
            <input
              type="file"
              ref={productCameraInput}
              onChange={handleProductCameraCapture}
              accept="image/*"
              capture="environment"
              className="hidden"
            />
            <input
              type="file"
              ref={productGalleryInput}
              onChange={handleProductGallerySelect}
              accept="image/*"
              className="hidden"
            />
            
            {errors.productPhoto && !productPhotoPreview && (
              <p className="text-red-500 text-sm mt-1">{errors.productPhoto}</p>
            )}
          </div>

          {/* Receipt Photo Section */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FaFileInvoice className="text-blue-600" />
              Receipt Photo *
            </h2>
            
            {receiptPhotoPreview ? (
              <div className="relative mb-4">
                <img 
                  src={receiptPhotoPreview} 
                  alt="Receipt preview" 
                  className="w-full h-48 md:h-64 object-cover rounded-lg border-2 border-gray-300"
                />
                <button
                  type="button"
                  onClick={() => {
                    setReceiptPhoto(null);
                    setReceiptPhotoPreview(null);
                  }}
                  className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700"
                >
                  <FaTrash />
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 md:gap-3 mb-4">
                {/* Camera button - opens native camera */}
                <button
                  type="button"
                  onClick={() => receiptCameraInput.current?.click()}
                  className="flex flex-col items-center justify-center p-4 md:p-6 border-2 border-dashed rounded-lg hover:border-blue-500 transition-colors border-gray-300 bg-gray-50"
                >
                  <FaCamera className="w-6 h-6 md:w-8 md:h-8 text-gray-600 mb-2" />
                  <span className="text-sm md:text-base font-medium text-gray-800">Use Camera</span>
                  <span className="text-xs text-gray-500">Take photo now</span>
                </button>
                
                {/* Gallery button - opens gallery */}
                <button
                  type="button"
                  onClick={() => receiptGalleryInput.current?.click()}
                  className="flex flex-col items-center justify-center p-4 md:p-6 border-2 border-dashed rounded-lg hover:border-blue-500 transition-colors border-gray-300 bg-gray-50"
                >
                  <FaUpload className="w-6 h-6 md:w-8 md:h-8 text-gray-600 mb-2" />
                  <span className="text-sm md:text-base font-medium text-gray-800">From Gallery</span>
                  <span className="text-xs text-gray-500">Choose from phone</span>
                </button>
              </div>
            )}
            
            {/* Hidden file inputs - one for camera, one for gallery */}
            <input
              type="file"
              ref={receiptCameraInput}
              onChange={handleReceiptCameraCapture}
              accept="image/*"
              capture="environment"
              className="hidden"
            />
            <input
              type="file"
              ref={receiptGalleryInput}
              onChange={handleReceiptGallerySelect}
              accept="image/*"
              className="hidden"
            />
            
            {errors.receiptPhoto && !receiptPhotoPreview && (
              <p className="text-red-500 text-sm mt-1">{errors.receiptPhoto}</p>
            )}
          </div>

          {/* Market Details */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FaMapMarkerAlt className="text-blue-600" />
              Market Details
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Market Location *
                </label>
                <input
                  type="text"
                  value={formData.market_location}
                  onChange={(e) => setFormData({...formData, market_location: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm ${
                    errors.market_location ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Kamkunji Market"
                />
                {errors.market_location && (
                  <p className="text-red-500 text-xs mt-1">{errors.market_location}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vendor *
                </label>
                <input
                  type="text"
                  value={formData.preferred_vendor}
                  onChange={(e) => setFormData({...formData, preferred_vendor: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm ${
                    errors.preferred_vendor ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Shop A"
                />
                {errors.preferred_vendor && (
                  <p className="text-red-500 text-xs mt-1">{errors.preferred_vendor}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price (KSh) *
                </label>
                <input
                  type="number"
                  value={formData.max_price}
                  onChange={(e) => setFormData({...formData, max_price: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm ${
                    errors.max_price ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., 1000"
                  min="0"
                  step="0.01"
                />
                {errors.max_price && (
                  <p className="text-red-500 text-xs mt-1">{errors.max_price}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Special Instructions (Optional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Any special instructions..."
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex flex-col sm:flex-row justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/errands')}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm md:text-base"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2 text-sm md:text-base"
            >
              {submitting ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Submitting...
                </>
              ) : (
                <>
                  <FaCheckCircle />
                  Submit Errand
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateRunnerErrand;