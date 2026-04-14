// src/website/pages/ErrandSubmit.jsx - FIXED button actions
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { 
  FaCamera, 
  FaUpload, 
  FaTrash, 
  FaArrowLeft,
  FaCheckCircle,
  FaExclamationTriangle,
  FaTimesCircle,
  FaBox,
  FaFileInvoice,
  FaVideo,
  FaUser,
  FaPhone,
  FaMapMarkerAlt,
  FaTruck,
  FaClock
} from 'react-icons/fa';

// Local placeholder data URI
const PLACEHOLDER_IMAGE = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'400\' height=\'300\' viewBox=\'0 0 400 300\'%3E%3Crect width=\'400\' height=\'300\' fill=\'%23f0f0f0\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' dominant-baseline=\'middle\' text-anchor=\'middle\' font-family=\'Arial\' font-size=\'20\' fill=\'%23999\'%3EImage Not Available%3C/text%3E%3C/svg%3E';

const ErrandSubmit = () => {
  const { errandId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [errand, setErrand] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [existingSubmission, setExistingSubmission] = useState(null);
  const [imageErrors, setImageErrors] = useState({ product: false, receipt: false });
  
  // Form state
  const [productPhoto, setProductPhoto] = useState(null);
  const [productPhotoPreview, setProductPhotoPreview] = useState(null);
  const [receiptPhoto, setReceiptPhoto] = useState(null);
  const [receiptPhotoPreview, setReceiptPhotoPreview] = useState(null);
  
  const [formData, setFormData] = useState({
    delivery_agent_id: '',
    agent_branch: '',
    tracking_number: '',
    actual_price: '',
    notes: ''
  });
  
  const [deliveryAgents, setDeliveryAgents] = useState([]);
  const [branches, setBranches] = useState([]);
  const [errors, setErrors] = useState({});
  const [showCamera, setShowCamera] = useState(null);
  
  const productFileInput = useRef(null);
  const receiptFileInput = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  
  const isViewMode = searchParams.get('view') === 'true';
  const isRejected = searchParams.get('rejected') === 'true';
  const isResubmit = searchParams.get('resubmit') === 'true';

  useEffect(() => {
    fetchErrandDetails();
    fetchDeliveryAgents();
  }, [errandId]);

  useEffect(() => {
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject;
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  const fetchWithAuth = async (url) => {
    const token = localStorage.getItem('token');
    // FIXED: Using relative URL
    return fetch(url, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json'
      }
    }).then(res => res.json()).catch(() => ({}));
  };

  const fetchErrandDetails = async () => {
    try {
      // FIXED: Changed to relative URL
      const response = await fetchWithAuth(`/api/errands/${errandId}`);
      setErrand(response.errand || response.data || response);
      setImageErrors({ product: false, receipt: false });
      
      if (response.errand?.latest_submission) {
        setExistingSubmission(response.errand.latest_submission);
        
        if (isViewMode || isRejected) {
          setFormData({
            delivery_agent_id: response.errand.latest_submission.delivery_agent_id || '',
            agent_branch: response.errand.latest_submission.agent_branch || '',
            tracking_number: response.errand.latest_submission.tracking_number || '',
            actual_price: response.errand.actual_price || '',
            notes: response.errand.latest_submission.notes || ''
          });
          
          // Set photo previews with full URLs - they're already relative
          if (response.errand.latest_submission.product_photo) {
            setProductPhotoPreview(response.errand.latest_submission.product_photo);
          }
          if (response.errand.latest_submission.receipt_photo) {
            setReceiptPhotoPreview(response.errand.latest_submission.receipt_photo);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch errand details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDeliveryAgents = async () => {
    try {
      // FIXED: Changed to relative URL
      const response = await fetchWithAuth('/api/delivery-agents');
      setDeliveryAgents(response.agents || response.data?.agents || []);
    } catch (error) {
      console.error('Failed to fetch delivery agents:', error);
    }
  };

  const handleDeliveryAgentChange = (agentId) => {
    const agent = deliveryAgents.find(a => a.id === parseInt(agentId));
    setFormData({
      ...formData,
      delivery_agent_id: agentId,
      agent_branch: ''
    });
    setBranches(agent?.branches || []);
  };

  const startCamera = async (type) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setShowCamera(type);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Could not access camera. Please check permissions or use file upload instead.');
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob((blob) => {
        const file = new File([blob], `camera-${Date.now()}.jpg`, { type: 'image/jpeg' });
        
        if (showCamera === 'product') {
          setProductPhoto(file);
          setProductPhotoPreview(URL.createObjectURL(blob));
        } else if (showCamera === 'receipt') {
          setReceiptPhoto(file);
          setReceiptPhotoPreview(URL.createObjectURL(blob));
        }
        
        stopCamera();
      }, 'image/jpeg', 0.95);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setShowCamera(null);
  };

  const handleProductPhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProductPhoto(file);
      setProductPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleReceiptPhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setReceiptPhoto(file);
      setReceiptPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleDeleteSubmission = async () => {
    if (!existingSubmission?.id) return;
    
    if (!window.confirm('Delete this submission and start fresh? This cannot be undone.')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      // FIXED: Changed to relative URL
      const response = await fetch(`/api/submissions/${existingSubmission.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        setExistingSubmission(null);
        setProductPhoto(null);
        setProductPhotoPreview(null);
        setReceiptPhoto(null);
        setReceiptPhotoPreview(null);
        setFormData({
          delivery_agent_id: '',
          agent_branch: '',
          tracking_number: '',
          actual_price: '',
          notes: ''
        });
        alert('Submission deleted. You can now create a new one.');
      }
    } catch (error) {
      console.error('Failed to delete submission:', error);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!productPhoto && !productPhotoPreview && !isViewMode) {
      newErrors.productPhoto = 'Product photo is required';
    }
    
    if (!receiptPhoto && !receiptPhotoPreview && !isViewMode) {
      newErrors.receiptPhoto = 'Receipt photo is required';
    }
    
    if (errand?.type === 'delivery' && !formData.delivery_agent_id && !isViewMode) {
      newErrors.delivery_agent_id = 'Delivery agent is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      
      const formDataObj = new FormData();
      
      if (productPhoto) {
        formDataObj.append('product_photo', productPhoto);
      }
      if (receiptPhoto) {
        formDataObj.append('receipt_photo', receiptPhoto);
      }
      
      formDataObj.append('delivery_agent_id', formData.delivery_agent_id);
      formDataObj.append('agent_branch', formData.agent_branch);
      formDataObj.append('tracking_number', formData.tracking_number);
      formDataObj.append('actual_price', formData.actual_price);
      formDataObj.append('notes', formData.notes);
      
      // FIXED: Changed to relative URL
      const response = await fetch(`/api/errands/${errandId}/submissions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataObj
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert('Errand submitted for approval!');
        navigate('/errands');
      } else {
        alert(data.message || 'Failed to submit errand');
      }
    } catch (error) {
      console.error('Submission error:', error);
      alert('Failed to submit errand');
    } finally {
      setSubmitting(false);
    }
  };

  const getFullImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('blob:')) return url;
    if (url.startsWith('http')) return url;
    // FIXED: Return the URL as-is (it should already be relative)
    return url;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Hidden canvas for camera capture */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Camera Modal */}
        {showCamera && (
          <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl p-4 max-w-lg w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Take {showCamera === 'product' ? 'Product' : 'Receipt'} Photo
                </h3>
                <button
                  onClick={stopCamera}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full rounded-lg bg-black"
                style={{ maxHeight: '400px' }}
              />
              
              <div className="flex gap-3 mt-4">
                <button
                  onClick={capturePhoto}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Capture Photo
                </button>
                <button
                  onClick={stopCamera}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/errands')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <FaArrowLeft className="mr-1" />
            Back to Dashboard
          </button>
          
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {isViewMode ? 'View Submission' : isRejected ? 'Rejected Submission' : 'Submit Proof'}
                </h1>
                <p className="text-gray-600 mt-1">
                  Errand: {errand?.errand_number}
                </p>
              </div>
              <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                errand?.type === 'sourcing' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
              }`}>
                {errand?.type === 'sourcing' ? 'Market Sourcing' : 'Delivery'}
              </span>
            </div>
          </div>
        </div>

        {/* Errand Details Section - Same as admin view */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FaUser className="text-blue-600" />
            Errand Details
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Customer Name</p>
              <p className="font-medium text-gray-900">{errand?.customer_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Phone Number</p>
              <p className="font-medium text-gray-900">{errand?.customer_phone}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Product</p>
              <p className="font-medium text-gray-900">{errand?.product_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Quantity</p>
              <p className="font-medium text-gray-900">{errand?.quantity}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Market Location</p>
              <p className="font-medium text-gray-900">{errand?.market_location}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Delivery Agent</p>
              <p className="font-medium text-gray-900">{errand?.agent_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Destination</p>
              <p className="font-medium text-gray-900">{errand?.destination}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                errand?.status === 'submitted' ? 'bg-purple-100 text-purple-800' :
                errand?.status === 'approved' ? 'bg-green-100 text-green-800' :
                errand?.status === 'rejected' ? 'bg-red-100 text-red-800' :
                errand?.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {errand?.status?.toUpperCase()}
              </span>
            </div>
          </div>

          {errand?.deadline && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2 text-orange-600">
                <FaClock />
                <span className="font-medium">Deadline: {formatDate(errand.deadline)}</span>
              </div>
            </div>
          )}

          {errand?.notes && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500 mb-1">Notes</p>
              <p className="text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-200">
                {errand.notes}
              </p>
            </div>
          )}
        </div>

        {/* Rejection Reason */}
        {isRejected && existingSubmission?.approval && (
          <div className="bg-red-50 border border-red-200 rounded-xl shadow p-6 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <FaTimesCircle className="text-red-600" />
              <h2 className="text-lg font-semibold text-red-800">Rejection Reason</h2>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-700">
                <span className="font-medium">Reason:</span> {existingSubmission.approval.rejection_reason}
              </p>
              {existingSubmission.approval.rejection_comments && (
                <p className="text-sm text-gray-600 bg-white p-3 rounded-lg border border-red-200">
                  "{existingSubmission.approval.rejection_comments}"
                </p>
              )}
              <p className="text-xs text-gray-500 mt-2">
                Rejected by: {existingSubmission.approval.approved_by_name} on {formatDate(existingSubmission.approval.created_at)}
              </p>
            </div>
          </div>
        )}

        {/* ========== FIXED PRODUCT PHOTO SECTION ========== */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FaBox className="text-blue-600" />
            Product Photo
          </h2>
          
          <div className="mb-4">
            {productPhotoPreview ? (
              <div className="relative">
                <img 
                  src={getFullImageUrl(productPhotoPreview)}
                  alt="Product" 
                  className="w-full h-auto max-h-96 object-contain rounded-lg border-2 border-gray-300"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = PLACEHOLDER_IMAGE;
                    setImageErrors(prev => ({ ...prev, product: true }));
                  }}
                />
                {!isViewMode && !isRejected && (
                  <button
                    onClick={() => {
                      setProductPhoto(null);
                      setProductPhotoPreview(null);
                      if (productFileInput.current) {
                        productFileInput.current.value = '';
                      }
                    }}
                    className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700"
                  >
                    <FaTrash />
                  </button>
                )}
              </div>
            ) : (
              !isViewMode && !isRejected ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    {/* FIXED: Camera button now correctly opens camera */}
                    <button
                      onClick={() => startCamera('product')}
                      disabled={isViewMode || isRejected}
                      className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg hover:border-blue-500 transition-colors ${
                        errors.productPhoto ? 'border-red-500' : 'border-gray-300'
                      } ${isViewMode || isRejected ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <FaCamera className="w-8 h-8 text-gray-400 mb-2" />
                      <span className="text-gray-700 font-medium">Take Photo</span>
                      <span className="text-sm text-gray-500">Use camera</span>
                    </button>
                    
                    {/* FIXED: Upload button now correctly opens file picker */}
                    <button
                      onClick={() => productFileInput.current?.click()}
                      disabled={isViewMode || isRejected}
                      className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg hover:border-blue-500 transition-colors ${
                        errors.productPhoto ? 'border-red-500' : 'border-gray-300'
                      } ${isViewMode || isRejected ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <FaUpload className="w-8 h-8 text-gray-400 mb-2" />
                      <span className="text-gray-700 font-medium">Upload File</span>
                      <span className="text-sm text-gray-500">From computer</span>
                    </button>
                  </div>
                  
                  <input
                    type="file"
                    ref={productFileInput}
                    onChange={handleProductPhotoChange}
                    accept="image/*"
                    className="hidden"
                    disabled={isViewMode || isRejected}
                  />
                </div>
              ) : (
                <div className="bg-gray-100 rounded-lg p-8 text-center border border-gray-200">
                  <FaCamera className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">No photo uploaded</p>
                </div>
              )
            )}
            {errors.productPhoto && !productPhotoPreview && !isViewMode && (
              <p className="text-red-500 text-sm mt-1">{errors.productPhoto}</p>
            )}
          </div>
        </div>

        {/* ========== FIXED RECEIPT PHOTO SECTION ========== */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FaFileInvoice className="text-blue-600" />
            Receipt Photo
          </h2>
          
          <div className="mb-4">
            {receiptPhotoPreview ? (
              <div className="relative">
                <img 
                  src={getFullImageUrl(receiptPhotoPreview)}
                  alt="Receipt" 
                  className="w-full h-auto max-h-96 object-contain rounded-lg border-2 border-gray-300"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = PLACEHOLDER_IMAGE;
                    setImageErrors(prev => ({ ...prev, receipt: true }));
                  }}
                />
                {!isViewMode && !isRejected && (
                  <button
                    onClick={() => {
                      setReceiptPhoto(null);
                      setReceiptPhotoPreview(null);
                      if (receiptFileInput.current) {
                        receiptFileInput.current.value = '';
                      }
                    }}
                    className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700"
                  >
                    <FaTrash />
                  </button>
                )}
              </div>
            ) : (
              !isViewMode && !isRejected ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    {/* FIXED: Camera button now correctly opens camera */}
                    <button
                      onClick={() => startCamera('receipt')}
                      disabled={isViewMode || isRejected}
                      className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg hover:border-blue-500 transition-colors ${
                        errors.receiptPhoto ? 'border-red-500' : 'border-gray-300'
                      } ${isViewMode || isRejected ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <FaCamera className="w-8 h-8 text-gray-400 mb-2" />
                      <span className="text-gray-700 font-medium">Take Photo</span>
                      <span className="text-sm text-gray-500">Use camera</span>
                    </button>
                    
                    {/* FIXED: Upload button now correctly opens file picker */}
                    <button
                      onClick={() => receiptFileInput.current?.click()}
                      disabled={isViewMode || isRejected}
                      className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg hover:border-blue-500 transition-colors ${
                        errors.receiptPhoto ? 'border-red-500' : 'border-gray-300'
                      } ${isViewMode || isRejected ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <FaUpload className="w-8 h-8 text-gray-400 mb-2" />
                      <span className="text-gray-700 font-medium">Upload File</span>
                      <span className="text-sm text-gray-500">From computer</span>
                    </button>
                  </div>
                  
                  <input
                    type="file"
                    ref={receiptFileInput}
                    onChange={handleReceiptPhotoChange}
                    accept="image/*"
                    className="hidden"
                    disabled={isViewMode || isRejected}
                  />
                </div>
              ) : (
                <div className="bg-gray-100 rounded-lg p-8 text-center border border-gray-200">
                  <FaCamera className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">No photo uploaded</p>
                </div>
              )
            )}
            {errors.receiptPhoto && !receiptPhotoPreview && !isViewMode && (
              <p className="text-red-500 text-sm mt-1">{errors.receiptPhoto}</p>
            )}
          </div>
        </div>

        {/* Submission Details */}
        {isViewMode && existingSubmission && (
          <div className="bg-white rounded-xl shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FaFileInvoice className="text-blue-600" />
              Submission Details
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {errand?.type === 'sourcing' && (
                <>
                  <div>
                    <p className="text-sm text-gray-500">Actual Price Paid</p>
                    <p className="font-medium text-gray-900">
                      KSh {existingSubmission?.receipt_amount || formData.actual_price || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Receipt Number</p>
                    <p className="font-medium text-gray-900">
                      {existingSubmission?.receipt_number || 'Not provided'}
                    </p>
                  </div>
                </>
              )}

              {errand?.type === 'delivery' && (
                <>
                  <div>
                    <p className="text-sm text-gray-500">Delivery Agent</p>
                    <p className="font-medium text-gray-900">
                      {formData.delivery_agent_id 
                        ? deliveryAgents.find(a => a.id === parseInt(formData.delivery_agent_id))?.name 
                        : 'Not provided'}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Agent Branch</p>
                    <p className="font-medium text-gray-900">
                      {formData.agent_branch || 'Not provided'}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Tracking Number</p>
                    <p className="font-medium text-gray-900">
                      {formData.tracking_number || 'Not provided'}
                    </p>
                  </div>
                </>
              )}

              <div className="md:col-span-2">
                <p className="text-sm text-gray-500">Submitted On</p>
                <p className="font-medium text-gray-900">
                  {formatDate(existingSubmission.submitted_at)}
                </p>
              </div>
            </div>

            {formData.notes && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-500 mb-1">Notes</p>
                <p className="text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-200">
                  {formData.notes}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-end">
          {isViewMode ? (
            <button
              onClick={() => navigate('/errands')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Back to Dashboard
            </button>
          ) : isRejected ? (
            <>
              <button
                onClick={handleDeleteSubmission}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 justify-center"
              >
                <FaTrash />
                Delete and Start Fresh
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2 justify-center"
              >
                <FaCheckCircle />
                {submitting ? 'Submitting...' : 'Resubmit'}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => navigate('/errands')}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2 justify-center"
              >
                <FaCheckCircle />
                {submitting ? 'Submitting...' : 'Submit for Approval'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrandSubmit;