import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaArrowLeft, 
  FaBox,
  FaMapMarkerAlt,
  FaCheckCircle,
  FaCamera,
  FaTrash,
  FaTimes,
  FaCloudUploadAlt,
  FaChevronLeft,
  FaChevronRight,
  FaCheckDouble
} from 'react-icons/fa';
import {
  getOfflineErrandQueue,
  removeOfflineErrandDraft,
  updateOfflineErrandDraft
} from '../../services/offlineErrandQueue';

const DraftErrands = () => {
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingAll, setUploadingAll] = useState(false);
  const [errors, setErrors] = useState({});
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Photo states for current draft
  const [productPhotoPreview, setProductPhotoPreview] = useState(null);
  const [productPhoto, setProductPhoto] = useState(null);
  const [receiptPhotoPreview, setReceiptPhotoPreview] = useState(null);
  const [receiptPhoto, setReceiptPhoto] = useState(null);

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
    const queue = getOfflineErrandQueue();
    setDrafts(queue);
    if (queue.length > 0) {
      loadDraftAtIndex(0);
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

  const loadDraftAtIndex = (index) => {
    if (drafts[index]) {
      const draft = drafts[index];
      setFormData(draft.formData || {});
      setCurrentIndex(index);
      
      // Load photos from base64 URLs
      if (draft.photoURLs && draft.photoURLs.length > 0) {
        setProductPhotoPreview(draft.photoURLs[0]);
        setProductPhoto(null);
      } else {
        setProductPhotoPreview(null);
        setProductPhoto(null);
      }

      if (draft.photoURLs && draft.photoURLs.length > 1) {
        setReceiptPhotoPreview(draft.photoURLs[1]);
        setReceiptPhoto(null);
      } else {
        setReceiptPhotoPreview(null);
        setReceiptPhoto(null);
      }
    }
  };

  const fileToDataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        let width = img.width;
        let height = img.height;
        // More aggressive compression: max 600px width
        const maxWidth = 600;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        // Lower quality: 0.5 (50%)
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Image compression failed'));
            return;
          }
          const compressedReader = new FileReader();
          compressedReader.onloadend = () => resolve(compressedReader.result);
          compressedReader.readAsDataURL(blob);
        }, 'image/jpeg', 0.5);
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
      headers: { 'Authorization': `Bearer ${token}` },
      body: formDataObj
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to submit errand');
    }
    return data;
  };

  const handleSubmitErrand = async (draftId) => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');

      // Use current photos or load from preview URLs
      let productFile = productPhoto;
      let receiptFile = receiptPhoto;

      if (!productFile && productPhotoPreview) {
        productFile = await dataUrlToFile(productPhotoPreview, `${draftId}_product.jpg`);
      }

      if (!receiptFile && receiptPhotoPreview) {
        receiptFile = await dataUrlToFile(receiptPhotoPreview, `${draftId}_receipt.jpg`);
      }

      const errandData = buildErrandPayload(user.id);

      await submitPayload({
        token,
        errandData,
        productFile,
        receiptFile
      });

      // Remove draft from queue after successful submission
      removeOfflineErrandDraft(draftId);
      
      // Reload drafts and move to next or go back
      const updatedDrafts = getOfflineErrandQueue();
      setDrafts(updatedDrafts);
      
      if (updatedDrafts.length > 0) {
        if (currentIndex >= updatedDrafts.length) {
          loadDraftAtIndex(updatedDrafts.length - 1);
        } else {
          loadDraftAtIndex(currentIndex);
        }
      }

      alert('Errand submitted successfully!');
    } catch (err) {
      console.error('Submission error:', err);
      alert(`Failed to submit: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitAll = async () => {
    if (drafts.length === 0) {
      alert('No drafts to submit');
      return;
    }

    setUploadingAll(true);
    const failedDrafts = [];

    for (let i = 0; i < drafts.length; i++) {
      try {
        const draft = drafts[i];

        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || '{}');

        let productFile;
        let receiptFile;

        // Load files from draft's photo URLs
        if (draft.photoURLs && draft.photoURLs[0]) {
          productFile = await dataUrlToFile(draft.photoURLs[0], `${draft.id}_product.jpg`);
        }

        if (draft.photoURLs && draft.photoURLs[1]) {
          receiptFile = await dataUrlToFile(draft.photoURLs[1], `${draft.id}_receipt.jpg`);
        }

        // Build errand data from draft's form data
        const errandData = {
          type: 'sourcing',
          product_name: draft.formData.product_name,
          quantity: parseInt(draft.formData.quantity, 10),
          market_location: draft.formData.market_location,
          preferred_vendor: draft.formData.preferred_vendor,
          max_price: parseFloat(draft.formData.max_price),
          notes: draft.formData.notes || undefined,
          assigned_to: user.id,
          status: 'submitted'
        };

        await submitPayload({
          token,
          errandData,
          productFile,
          receiptFile
        });

        removeOfflineErrandDraft(draft.id);
      } catch (err) {
        console.error(`Failed to submit draft ${i}:`, err);
        failedDrafts.push(drafts[i].formData.product_name);
      }
    }

    setUploadingAll(false);

    // Reload drafts
    const updatedDrafts = getOfflineErrandQueue();
    setDrafts(updatedDrafts);

    if (updatedDrafts.length > 0) {
      loadDraftAtIndex(0);
    }

    if (failedDrafts.length > 0) {
      alert(`Failed to submit: ${failedDrafts.join(', ')}`);
    } else {
      alert('All errands submitted successfully!');
      navigate('/errands/my');
    }
  };

  const handleDeleteDraft = (draftId) => {
    if (window.confirm('Delete this draft?')) {
      removeOfflineErrandDraft(draftId);
      const updatedDrafts = getOfflineErrandQueue();
      setDrafts(updatedDrafts);

      if (updatedDrafts.length > 0) {
        if (currentIndex >= updatedDrafts.length) {
          loadDraftAtIndex(updatedDrafts.length - 1);
        } else {
          loadDraftAtIndex(currentIndex);
        }
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.product_name?.trim()) {
      newErrors.product_name = 'Product name is required';
    }

    if (!formData.quantity || formData.quantity < 1) {
      newErrors.quantity = 'Quantity must be at least 1';
    }

    if (!formData.market_location?.trim()) {
      newErrors.market_location = 'Market location is required';
    }

    if (!productPhotoPreview && !productPhoto) {
      newErrors.productPhoto = 'Product photo is required';
    }

    if (!receiptPhotoPreview && !receiptPhoto) {
      newErrors.receiptPhoto = 'Receipt photo is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveDraftChanges = async () => {
    // Update current draft with form changes
    if (drafts[currentIndex]) {
      const draft = drafts[currentIndex];
      const updatedDraft = {
        ...draft,
        formData: { ...formData },
        photoURLs: draft.photoURLs || []
      };

      // Check estimated size before saving (use actual File sizes if provided)
      const estimatedSize = ((productPhoto?.size || 0) + (receiptPhoto?.size || 0)) / 1024 / 1024;
      if (estimatedSize > 4) {
        alert(`Photos are too large (${estimatedSize.toFixed(1)}MB). Please use smaller images.`);
        return;
      }

      // Add any new photos to the photoURLs
      if (productPhoto) {
        const productDataUrl = await fileToDataUrl(productPhoto);
        updatedDraft.photoURLs[0] = productDataUrl;
      }

      if (receiptPhoto) {
        const receiptDataUrl = await fileToDataUrl(receiptPhoto);
        updatedDraft.photoURLs[1] = receiptDataUrl;
      }

      // Update in storage
      updateOfflineErrandDraft(draft.id, updatedDraft);
      setDrafts(getOfflineErrandQueue());
      setProductPhoto(null);
      setReceiptPhoto(null);
      alert('Draft updated!');
    }
  };

  const handleProductPhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setProductPhoto(file);
      setProductPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleReceiptPhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptPhoto(file);
      setReceiptPhotoPreview(URL.createObjectURL(file));
    }
  };

  const removeProductPhoto = () => {
    setProductPhoto(null);
    setProductPhotoPreview(null);
  };

  const removeReceiptPhoto = () => {
    setReceiptPhoto(null);
    setReceiptPhotoPreview(null);
  };

  if (drafts.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-3 md:p-6">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => navigate('/errands')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <FaArrowLeft className="mr-1" />
            Back to Dashboard
          </button>

          <div className="bg-white rounded-xl shadow p-8 text-center">
            <FaBox className="mx-auto text-5xl text-gray-300 mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">No Draft Errands</h2>
            <p className="text-gray-600 mb-6">
              You don't have any saved draft errands yet.
            </p>
            <button
              onClick={() => navigate('/errands/create-runner')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create New Errand
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentDraft = drafts[currentIndex];

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

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl md:text-3xl font-bold text-gray-900">
                Draft Errands ({currentIndex + 1} of {drafts.length})
              </h1>
              <p className="text-sm md:text-base text-gray-600">Review and submit your drafts</p>
            </div>
          </div>
        </div>

        {/* Draft Form */}
        <div className="bg-white rounded-xl shadow p-4 md:p-6">
          {/* Draft Navigation */}
          <div className="mb-6 flex items-center justify-between">
            <button
              onClick={() => {
                if (currentIndex > 0) {
                  saveDraftChanges();
                  loadDraftAtIndex(currentIndex - 1);
                }
              }}
              disabled={currentIndex === 0}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <FaChevronLeft /> Previous
            </button>

            <div className="flex gap-1">
              {drafts.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    saveDraftChanges();
                    loadDraftAtIndex(idx);
                  }}
                  className={`w-8 h-8 rounded-full font-medium text-sm ${
                    idx === currentIndex
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                if (currentIndex < drafts.length - 1) {
                  saveDraftChanges();
                  loadDraftAtIndex(currentIndex + 1);
                }
              }}
              disabled={currentIndex === drafts.length - 1}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              Next <FaChevronRight />
            </button>
          </div>

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
                  onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  min="1"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm ${
                    errors.quantity ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.quantity && (
                  <p className="text-red-500 text-xs mt-1">{errors.quantity}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preferred Vendor
                </label>
                <input
                  type="text"
                  value={formData.preferred_vendor}
                  onChange={(e) => setFormData({ ...formData, preferred_vendor: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="e.g., John's Store"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Price (KES)
                </label>
                <input
                  type="number"
                  value={formData.max_price}
                  onChange={(e) => setFormData({ ...formData, max_price: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="0.00"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Any special instructions..."
                  rows="3"
                />
              </div>
            </div>
          </div>

          {/* Location Information */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FaMapMarkerAlt className="text-blue-600" />
              Location Information
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Market Location *
                </label>
                <input
                  type="text"
                  value={formData.market_location}
                  onChange={(e) => setFormData({ ...formData, market_location: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm ${
                    errors.market_location ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Eastleigh Market"
                />
                {errors.market_location && (
                  <p className="text-red-500 text-xs mt-1">{errors.market_location}</p>
                )}
              </div>
            </div>
          </div>

          {/* Photos Section */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FaCamera className="text-blue-600" />
              Photos
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Product Photo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Photo *
                </label>

                {productPhotoPreview ? (
                  <div className="relative">
                    <img
                      src={productPhotoPreview}
                      alt="Product"
                      className="w-full h-48 md:h-64 object-cover rounded-lg border border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={removeProductPhoto}
                      className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-lg hover:bg-red-700"
                    >
                      <FaTimes />
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <FaCamera className="mx-auto text-3xl text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600 mb-3">Click to add product photo</p>
                    <div className="flex gap-2 justify-center">
                      <button
                        type="button"
                        onClick={() => productCameraInput.current?.click()}
                        className="px-3 py-2 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                      >
                        Camera
                      </button>
                      <button
                        type="button"
                        onClick={() => productGalleryInput.current?.click()}
                        className="px-3 py-2 bg-gray-600 text-white rounded text-xs hover:bg-gray-700"
                      >
                        Gallery
                      </button>
                    </div>
                  </div>
                )}

                <input
                  ref={productCameraInput}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleProductPhotoChange}
                  className="hidden"
                />
                <input
                  ref={productGalleryInput}
                  type="file"
                  accept="image/*"
                  onChange={handleProductPhotoChange}
                  className="hidden"
                />

                {errors.productPhoto && !productPhotoPreview && (
                  <p className="text-red-500 text-xs mt-1">{errors.productPhoto}</p>
                )}
              </div>

              {/* Receipt Photo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Receipt Photo *
                </label>

                {receiptPhotoPreview ? (
                  <div className="relative">
                    <img
                      src={receiptPhotoPreview}
                      alt="Receipt"
                      className="w-full h-48 md:h-64 object-cover rounded-lg border border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={removeReceiptPhoto}
                      className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-lg hover:bg-red-700"
                    >
                      <FaTimes />
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <FaCamera className="mx-auto text-3xl text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600 mb-3">Click to add receipt photo</p>
                    <div className="flex gap-2 justify-center">
                      <button
                        type="button"
                        onClick={() => receiptCameraInput.current?.click()}
                        className="px-3 py-2 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                      >
                        Camera
                      </button>
                      <button
                        type="button"
                        onClick={() => receiptGalleryInput.current?.click()}
                        className="px-3 py-2 bg-gray-600 text-white rounded text-xs hover:bg-gray-700"
                      >
                        Gallery
                      </button>
                    </div>
                  </div>
                )}

                <input
                  ref={receiptCameraInput}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleReceiptPhotoChange}
                  className="hidden"
                />
                <input
                  ref={receiptGalleryInput}
                  type="file"
                  accept="image/*"
                  onChange={handleReceiptPhotoChange}
                  className="hidden"
                />

                {errors.receiptPhoto && !receiptPhotoPreview && (
                  <p className="text-red-500 text-xs mt-1">{errors.receiptPhoto}</p>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="border-t border-gray-200 pt-6 flex flex-col md:flex-row gap-3">
            <button
              onClick={() => navigate('/errands')}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm md:text-base"
            >
              Cancel
            </button>

            <button
              onClick={() => handleDeleteDraft(currentDraft.id)}
              className="px-6 py-3 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 text-sm md:text-base flex items-center justify-center gap-2"
            >
              <FaTrash /> Delete Draft
            </button>

            <button
              onClick={saveDraftChanges}
              className="px-6 py-3 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 text-sm md:text-base"
            >
              Save Changes
            </button>

            <button
              onClick={() => handleSubmitErrand(currentDraft.id)}
              disabled={submitting}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 text-sm md:text-base flex-1"
            >
              {submitting ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Submitting...
                </>
              ) : (
                <>
                  {isOnline ? <FaCheckCircle /> : <FaCloudUploadAlt />}
                  Submit This Errand
                </>
              )}
            </button>

            <button
              onClick={handleSubmitAll}
              disabled={uploadingAll || submitting}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2 text-sm md:text-base"
            >
              {uploadingAll ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Uploading All...
                </>
              ) : (
                <>
                  <FaCheckDouble />
                  Submit All ({drafts.length})
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DraftErrands;
