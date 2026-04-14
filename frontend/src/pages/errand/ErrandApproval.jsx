// src/website/pages/ErrandApproval.jsx - Updated to match simplified errand structure
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  FaCheckCircle, 
  FaTimesCircle, 
  FaArrowLeft,
  FaExclamationTriangle,
  FaUser,
  FaCalendar,
  FaFileInvoice,
  FaBox,
  FaMotorcycle,
  FaCamera,
  FaMapMarkerAlt,
  FaTruck
} from 'react-icons/fa';

const ErrandApproval = () => {
  const { errandId } = useParams();
  const navigate = useNavigate();
  
  const [errand, setErrand] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [imageErrors, setImageErrors] = useState({ product: false, receipt: false });
  
  const [rejectionData, setRejectionData] = useState({
    reason: '',
    comments: ''
  });
  const [adjustedFee, setAdjustedFee] = useState(null);
  const [showRejectForm, setShowRejectForm] = useState(false);

  useEffect(() => {
    fetchErrandDetails();
  }, [errandId]);

  const fetchWithAuth = async (url) => {
    const token = localStorage.getItem('token');
    // FIXED: Use relative URL
    return fetch(url, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json'
      }
    }).then(res => res.json()).catch(() => ({}));
  };

  const fetchErrandDetails = async () => {
    try {
      // FIXED: Use relative URL
      const response = await fetchWithAuth(`/api/errands/${errandId}`);
      const errandData = response.errand || response.data || response;
      setErrand(errandData);
      setSubmission(errandData.latest_submission);
      setAdjustedFee(errandData.errand_fee || 100);
      setImageErrors({ product: false, receipt: false });
    } catch (error) {
      console.error('Failed to fetch errand details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageError = (type) => {
    setImageErrors(prev => ({ ...prev, [type]: true }));
  };

  const handleApprove = async () => {
    if (!submission?.id) return;
    
    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      
      // FIXED: Use relative URL
      const response = await fetch(`/api/submissions/${submission.id}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          adjusted_fee: adjustedFee !== errand?.errand_fee ? adjustedFee : null
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert('✅ Errand approved successfully!');
        navigate('/errands?tab=pending');
      } else {
        alert(data.message || 'Failed to approve errand');
      }
    } catch (error) {
      console.error('Approval error:', error);
      alert('Failed to approve errand');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!submission?.id) return;
    if (!rejectionData.reason) {
      alert('Please select a rejection reason');
      return;
    }
    
    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      
      // FIXED: Use relative URL
      const response = await fetch(`/api/submissions/${submission.id}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          rejection_reason: rejectionData.reason,
          rejection_comments: rejectionData.comments
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert('❌ Errand rejected');
        navigate('/errands?tab=pending');
      } else {
        alert(data.message || 'Failed to reject errand');
      }
    } catch (error) {
      console.error('Rejection error:', error);
      alert('Failed to reject errand');
    } finally {
      setSubmitting(false);
    }
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

  // FIXED: Use relative URLs for images
  const productImageUrl = submission?.product_photo 
    ? `${submission.product_photo}` 
    : null;
  const receiptImageUrl = submission?.receipt_photo 
    ? `${submission.receipt_photo}` 
    : null;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/errands?tab=pending')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <FaArrowLeft className="mr-1" />
            Back to Pending Errands
          </button>
          
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <FaMotorcycle className="text-blue-600" />
                  Review Errand Submission
                </h1>
                <p className="text-gray-600 mt-1">
                  {errand?.errand_number} • Market Sourcing
                </p>
              </div>
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold">
                Pending Review
              </span>
            </div>
          </div>
        </div>

        {/* Main Content - Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Photos */}
          <div className="space-y-6">
            {/* Product Photo */}
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FaBox className="text-blue-600" />
                Product Photo
              </h2>
              {productImageUrl && !imageErrors.product ? (
                <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                  <img 
                    src={productImageUrl}
                    alt="Product" 
                    className="w-full h-auto object-cover"
                    onError={() => handleImageError('product')}
                  />
                </div>
              ) : (
                <div className="bg-gray-100 rounded-lg p-8 text-center border border-gray-200">
                  <FaCamera className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">
                    {imageErrors.product ? 'Failed to load image' : 'No photo uploaded'}
                  </p>
                </div>
              )}
            </div>

            {/* Receipt Photo */}
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FaFileInvoice className="text-blue-600" />
                Receipt Photo
              </h2>
              {receiptImageUrl && !imageErrors.receipt ? (
                <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                  <img 
                    src={receiptImageUrl}
                    alt="Receipt" 
                    className="w-full h-auto object-cover"
                    onError={() => handleImageError('receipt')}
                  />
                </div>
              ) : (
                <div className="bg-gray-100 rounded-lg p-8 text-center border border-gray-200">
                  <FaCamera className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">
                    {imageErrors.receipt ? 'Failed to load image' : 'No photo uploaded'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Details & Actions */}
          <div className="space-y-6">
            {/* Errand Details - UPDATED to match simplified form */}
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Errand Details</h2>
              
              <div className="space-y-3">
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-gray-600">Product:</span>
                  <span className="font-medium text-gray-900">{errand?.product_name}</span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-gray-600">Quantity:</span>
                  <span className="font-medium text-gray-900">{errand?.quantity}</span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-gray-600">Market Location:</span>
                  <span className="font-medium text-gray-900">{errand?.market_location}</span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-gray-600">Vendor:</span>
                  <span className="font-medium text-gray-900">{errand?.preferred_vendor}</span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-gray-600">Price:</span>
                  <span className="font-medium text-gray-900">KSh {errand?.max_price}</span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-gray-600">Runner:</span>
                  <span className="font-medium text-gray-900">{errand?.assignee?.full_name || 'Unknown'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Submitted:</span>
                  <span className="font-medium text-gray-900">{formatDate(submission?.submitted_at)}</span>
                </div>
              </div>

              {errand?.notes && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <span className="text-gray-600 block mb-1">Runner's Notes:</span>
                  <p className="text-gray-800 bg-gray-50 p-3 rounded-lg border border-gray-200">{errand.notes}</p>
                </div>
              )}
            </div>

            {/* Fee Adjustment */}
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment</h2>
              
              <div className="space-y-3">
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-gray-600">Standard Fee:</span>
                  <span className="font-medium text-gray-900">KSh {errand?.errand_fee || 100}</span>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Adjusted Fee (Optional)
                  </label>
                  <input
                    type="number"
                    value={adjustedFee}
                    onChange={(e) => setAdjustedFee(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    min="0"
                    step="0.01"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Leave as is to pay standard fee
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            {!showRejectForm ? (
              <div className="bg-white rounded-xl shadow p-6">
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleApprove}
                    disabled={submitting}
                    className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <FaCheckCircle />
                    {submitting ? 'Processing...' : 'Approve Errand'}
                  </button>
                  <button
                    onClick={() => setShowRejectForm(true)}
                    disabled={submitting}
                    className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <FaTimesCircle />
                    Reject
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow p-6">
                <h2 className="text-lg font-semibold mb-4 text-red-600 flex items-center gap-2">
                  <FaExclamationTriangle />
                  Rejection Reason
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reason *
                    </label>
                    <select
                      value={rejectionData.reason}
                      onChange={(e) => setRejectionData({...rejectionData, reason: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900"
                    >
                      <option value="" className="text-gray-900">Select reason</option>
                      <option value="Wrong product" className="text-gray-900">Wrong product</option>
                      <option value="Poor photo quality" className="text-gray-900">Poor photo quality</option>
                      <option value="Missing receipt" className="text-gray-900">Missing receipt</option>
                      <option value="Receipt unclear" className="text-gray-900">Receipt unclear</option>
                      <option value="Wrong amount" className="text-gray-900">Wrong amount</option>
                      <option value="Wrong vendor" className="text-gray-900">Wrong vendor</option>
                      <option value="Wrong market location" className="text-gray-900">Wrong market location</option>
                      <option value="Other" className="text-gray-900">Other</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Comments
                    </label>
                    <textarea
                      value={rejectionData.comments}
                      onChange={(e) => setRejectionData({...rejectionData, comments: e.target.value})}
                      rows="4"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900"
                      placeholder="Explain why this is being rejected..."
                    />
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={handleReject}
                      disabled={submitting}
                      className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <FaTimesCircle />
                      {submitting ? 'Processing...' : 'Confirm Rejection'}
                    </button>
                    <button
                      onClick={() => setShowRejectForm(false)}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrandApproval;