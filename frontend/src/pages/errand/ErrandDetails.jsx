import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FaArrowLeft,
  FaUser,
  FaPhone,
  FaBox,
  FaMapMarkerAlt,
  FaTruck,
  FaMoneyBillWave,
  FaCalendar,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaMotorcycle,
  FaCamera,
  FaFileInvoice,
  FaInfoCircle
} from 'react-icons/fa';

const ErrandDetails = () => {
  const { errandId } = useParams();
  const navigate = useNavigate();
  const [errand, setErrand] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageErrors, setImageErrors] = useState({ product: false, receipt: false });

  useEffect(() => {
    fetchErrandDetails();
  }, [errandId]);

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
      setLoading(true);
      // FIXED: Changed to relative URL
      const response = await fetchWithAuth(`/api/errands/${errandId}`);
      console.log('Errand details:', response);
      
      const errandData = response.errand || response.data || response;
      setErrand(errandData);
    } catch (error) {
      console.error('Failed to fetch errand details:', error);
    } finally {
      setLoading(false);
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

  const getStatusBadge = (status) => {
    const statusConfig = {
      'completed': { bg: 'bg-green-100', text: 'text-green-800', icon: <FaCheckCircle className="text-green-600" />, label: 'Completed' },
      'approved': { bg: 'bg-green-100', text: 'text-green-800', icon: <FaCheckCircle className="text-green-600" />, label: 'Approved' },
      'submitted': { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: <FaClock className="text-yellow-600" />, label: 'Submitted' },
      'pending': { bg: 'bg-blue-100', text: 'text-blue-800', icon: <FaClock className="text-blue-600" />, label: 'Pending' },
      'accepted': { bg: 'bg-purple-100', text: 'text-purple-800', icon: <FaMotorcycle className="text-purple-600" />, label: 'Accepted' },
      'in_progress': { bg: 'bg-orange-100', text: 'text-orange-800', icon: <FaMotorcycle className="text-orange-600" />, label: 'In Progress' },
      'rejected': { bg: 'bg-red-100', text: 'text-red-800', icon: <FaTimesCircle className="text-red-600" />, label: 'Rejected' }
    };
    const config = statusConfig[status] || { bg: 'bg-gray-100', text: 'text-gray-800', icon: <FaInfoCircle className="text-gray-600" />, label: status };
    
    return (
      <span className={`px-3 py-1 text-sm font-semibold rounded-full ${config.bg} ${config.text} flex items-center gap-2 w-fit`}>
        {config.icon}
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!errand) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="max-w-4xl mx-auto text-center py-12">
          <FaInfoCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Errand Not Found</h2>
          <p className="text-gray-600 mb-6">The errand you're looking for doesn't exist or you don't have permission to view it.</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const submission = errand.latest_submission;
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
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <FaArrowLeft className="mr-1" />
            Back
          </button>
          
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <FaMotorcycle className="text-blue-600" />
                  Errand Details
                </h1>
                <p className="text-gray-600 mt-1">
                  {errand.errand_number} • {errand.type === 'sourcing' ? 'Market Sourcing' : 'Delivery'}
                </p>
              </div>
              {getStatusBadge(errand.status)}
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
                    onError={() => setImageErrors(prev => ({ ...prev, product: true }))}
                  />
                </div>
              ) : (
                <div className="bg-gray-100 rounded-lg p-8 text-center border border-gray-200">
                  <FaCamera className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">No photo uploaded</p>
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
                    onError={() => setImageErrors(prev => ({ ...prev, receipt: true }))}
                  />
                </div>
              ) : (
                <div className="bg-gray-100 rounded-lg p-8 text-center border border-gray-200">
                  <FaCamera className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">No photo uploaded</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Details */}
          <div className="space-y-6">
            {/* Errand Information */}
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FaInfoCircle className="text-blue-600" />
                Errand Information
              </h2>
              
              <div className="space-y-4">
                {/* Customer Info */}
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Customer Details</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                      <FaUser className="text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Name</p>
                        <p className="font-medium text-gray-900">{errand.customer_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <FaPhone className="text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Phone</p>
                        <p className="font-medium text-gray-900">{errand.customer_phone}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Product Info */}
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Product Details</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500">Product</p>
                      <p className="font-medium text-gray-900">{errand.product_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Quantity</p>
                      <p className="font-medium text-gray-900">{errand.quantity}</p>
                    </div>
                    {errand.actual_price && (
                      <div>
                        <p className="text-xs text-gray-500">Price</p>
                        <p className="font-medium text-green-600">KSh {errand.actual_price}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Location Info */}
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Location Details</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {errand.market_location && (
                      <div className="flex items-center gap-2">
                        <FaMapMarkerAlt className="text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Market</p>
                          <p className="font-medium text-gray-900">{errand.market_location}</p>
                        </div>
                      </div>
                    )}
                    {errand.destination && (
                      <div className="flex items-center gap-2">
                        <FaMapMarkerAlt className="text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Destination</p>
                          <p className="font-medium text-gray-900">{errand.destination}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Delivery Info */}
                {errand.agent_name && (
                  <div className="border-b border-gray-200 pb-4">
                    <h3 className="text-sm font-medium text-gray-500 mb-3">Delivery Details</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2">
                        <FaTruck className="text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Agent</p>
                          <p className="font-medium text-gray-900">{errand.agent_name}</p>
                        </div>
                      </div>
                      {errand.tracking_number && (
                        <div>
                          <p className="text-xs text-gray-500">Tracking</p>
                          <p className="font-medium text-gray-900">{errand.tracking_number}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Timeline */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Timeline</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <FaCalendar className="text-gray-400" />
                      <span className="text-gray-600">Created:</span>
                      <span className="font-medium text-gray-900">{formatDate(errand.created_at)}</span>
                    </div>
                    {errand.completed_at && (
                      <div className="flex items-center gap-2 text-sm">
                        <FaCheckCircle className="text-green-500" />
                        <span className="text-gray-600">Completed:</span>
                        <span className="font-medium text-gray-900">{formatDate(errand.completed_at)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes */}
                {errand.notes && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm font-medium text-gray-500 mb-2">Notes</p>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-200">{errand.notes}</p>
                  </div>
                )}

                {/* Fee */}
                <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                  <span className="text-gray-600">Errand Fee</span>
                  <span className="text-xl font-bold text-green-600">KSh {errand.errand_fee || 100}</span>
                </div>
              </div>
            </div>

            {/* Runner Info */}
            {errand.assignee && (
              <div className="bg-white rounded-xl shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FaMotorcycle className="text-blue-600" />
                  Runner Information
                </h2>
                
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {errand.assignee.full_name?.charAt(0) || 'R'}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{errand.assignee.full_name || 'Unknown Runner'}</p>
                    <p className="text-sm text-gray-600">{errand.assignee.phone || 'No phone'}</p>
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

export default ErrandDetails;