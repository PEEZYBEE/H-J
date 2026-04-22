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
  FaFileInvoice,
  FaCloudUploadAlt,
  FaSave
} from 'react-icons/fa';
import {
  getOfflineErrandQueue,
  addOfflineErrandDraft,
  removeOfflineErrandDraft
} from '../../services/offlineErrandQueue';

const CreateRunnerErrand = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingAll, setUploadingAll] = useState(false);
  const [errors, setErrors] = useState({});
  const [offlineDrafts, setOfflineDrafts] = useState([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
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

  useEffect(() => {
    setOfflineDrafts(getOfflineErrandQueue());

    // Load draft from sessionStorage if user came from DraftErrands page
    const editingDraftJson = sessionStorage.getItem('editingDraft');
    if (editingDraftJson) {
      try {
        const draft = JSON.parse(editingDraftJson);
        setFormData(draft.formData || {});
        if (draft.photoURLs && draft.photoURLs.length > 0) {
          // Load product photo (first photo)
          setProductPhotoPreview(draft.photoURLs[0]);
          // Load receipt photo (second photo if available)
          if (draft.photoURLs[1]) {
            setReceiptPhotoPreview(draft.photoURLs[1]);
          }
        }
        sessionStorage.removeItem('editingDraft');
      } catch (err) {
        console.error('Failed to load draft:', err);
      }
    }

    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  const fileToDataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Calculate new dimensions (max 800px width)
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        let width = img.width;
        let height = img.height;
        const maxWidth = 800;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        // Compress to JPEG at 70% quality
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Image compression failed'));
            return;
          }
          const compressedReader = new FileReader();
          compressedReader.onloadend = () => {
            resolve(compressedReader.result);
          };
          compressedReader.readAsDataURL(blob);
        }, 'image/jpeg', 0.7);
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const dataUrlToFile = async (dataUrl, fileName) => {
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    return new File([blob], fileName, { type: blob.type || 'image/jpeg' });
  };

  const buildErrandPayload = (userId) => ({
    type: 'sourcing',
    product_name: formData.product_name,
    quantity: parseInt(formData.quantity, 10),
    market_location: formData.market_location,
    preferred_vendor: formData.preferred_vendor,
    max_price: parseFloat(formData.max_price),
    notes: formData.notes || undefined,
    assigned_to: userId,
    status: 'submitted'
  });

  const submitPayload = async ({ token, errandData, productFile, receiptFile }) => {
    const formDataObj = new FormData();

    formDataObj.append('product_photo', productFile);
    formDataObj.append('receipt_photo', receiptFile);
    formDataObj.append('data', JSON.stringify(errandData));

    const response = await fetch('/api/errands/with-submission', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formDataObj
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to submit errand');
    }
    return data;
  };

  const resetForm = () => {
    setFormData({
      product_name: '',
      quantity: 1,
      market_location: '',
      preferred_vendor: '',
      max_price: '',
      notes: ''
    });
    setProductPhoto(null);
    setProductPhotoPreview(null);
    setReceiptPhoto(null);
    setReceiptPhotoPreview(null);
    setErrors({});
  };

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

      const errandData = buildErrandPayload(userData.id);
      await submitPayload({
        token,
        errandData,
        productFile: productPhoto,
        receiptFile: receiptPhoto
      });

      alert('✅ Errand submitted for approval!');
      navigate('/errands?tab=pending');
    } catch (error) {
      alert(error.message || 'Failed to create errand');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!validateForm()) return;

    if (!productPhoto || !receiptPhoto) {
      alert('Please attach both photos before saving draft.');
      return;
    }

    try {
      const productPhotoDataUrl = await fileToDataUrl(productPhoto);
      const receiptPhotoDataUrl = await fileToDataUrl(receiptPhoto);

      const draft = {
        id: `draft_${Date.now()}`,
        createdAt: new Date().toISOString(),
        formData: { ...formData },
        photoURLs: [productPhotoDataUrl, receiptPhotoDataUrl]
      };

      const updatedQueue = addOfflineErrandDraft(draft);
      setOfflineDrafts(updatedQueue);
      resetForm();
      alert('Draft saved locally. You can upload it when network is available.');
    } catch (error) {
      console.error('Save draft error:', error);
      if (error && (error.name === 'QuotaExceededError' || error.code === 22)) {
        alert('Storage quota exceeded. Please try with smaller images or clear some drafts.');
      } else {
        alert('Failed to save draft locally. ' + (error && error.message ? error.message : ''));
      }
    }
  };

  const handleUploadAllPending = async () => {
    if (!offlineDrafts.length) {
      alert('No pending drafts to upload.');
      return;
    }

    if (!navigator.onLine) {
      alert('You are offline. Connect to internet, then upload pending drafts.');
      return;
    }

    const token = localStorage.getItem('token');
    const userData = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token || !userData?.id) {
      alert('Please login again before uploading drafts.');
      return;
    }

    setUploadingAll(true);
    let successCount = 0;
    let failedCount = 0;

    for (const draft of offlineDrafts) {
      try {
        const productDataUrl = draft.photoURLs?.[0] || draft.productPhotoDataUrl;
        const receiptDataUrl = draft.photoURLs?.[1] || draft.receiptPhotoDataUrl;

        const productFile = productDataUrl ? await dataUrlToFile(productDataUrl, `${draft.id}_product.jpg`) : null;
        const receiptFile = receiptDataUrl ? await dataUrlToFile(receiptDataUrl, `${draft.id}_receipt.jpg`) : null;

        await submitPayload({
          token,
          errandData: {
            ...draft.formData,
            type: 'sourcing',
            quantity: parseInt(draft.formData.quantity, 10),
            max_price: parseFloat(draft.formData.max_price),
            assigned_to: userData.id,
            status: 'submitted'
          },
          productFile,
          receiptFile
        });

        removeOfflineErrandDraft(draft.id);
        successCount += 1;
      } catch (e) {
        console.error('Failed uploading draft:', e);
        failedCount += 1;
      }
    }

    setOfflineDrafts(getOfflineErrandQueue());
    setUploadingAll(false);

    if (failedCount === 0) {
      alert(`Uploaded ${successCount} draft(s) successfully.`);
      navigate('/errands?tab=pending');
      return;
    }

    alert(`Uploaded ${successCount} draft(s). ${failedCount} draft(s) failed and remain queued.`);
  };

  const handleDeleteDraft = (draftId) => {
    const updatedQueue = removeOfflineErrandDraft(draftId);
    setOfflineDrafts(updatedQueue);
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
              type="button"
              onClick={handleSaveDraft}
              className="px-6 py-3 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 text-sm md:text-base flex items-center justify-center gap-2"
            >
              <FaSave />
              Save Draft Offline
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
                  {isOnline ? <FaCheckCircle /> : <FaCloudUploadAlt />}
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