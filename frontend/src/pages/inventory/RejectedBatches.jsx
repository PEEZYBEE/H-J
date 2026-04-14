import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  XCircle, 
  AlertCircle, 
  Calendar, 
  User, 
  FileText, 
  ChevronRight,
  Package,
  ThumbsDown,
  ArrowLeft,
  RefreshCw
} from 'lucide-react';
import { getMyRejectedBatches, getBatchRejectionDetails } from '../../services/api';

const RejectedBatches = () => {
  const [rejectedBatches, setRejectedBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [batchDetails, setBatchDetails] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRejectedBatches();
  }, []);

  const fetchRejectedBatches = async () => {
    try {
      setLoading(true);
      const response = await getMyRejectedBatches();
      const batches = response.batches || response.data?.batches || [];
      setRejectedBatches(Array.isArray(batches) ? batches : []);
    } catch (error) {
      console.error('Failed to fetch rejected batches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (batchId) => {
    try {
      setLoading(true);
      const response = await getBatchRejectionDetails(batchId);
      setBatchDetails(response);
      setShowDetails(true);
    } catch (error) {
      console.error('Failed to fetch batch details:', error);
      alert('Failed to load rejection details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'rejected':
        return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">Fully Rejected</span>;
      case 'partially_approved':
        return <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">Partially Approved</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">{status}</span>;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && !rejectedBatches.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (showDetails && batchDetails) {
    const { batch, rejected_items, supplier_name, reviewed_by_name } = batchDetails;
    
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => setShowDetails(false)}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Rejected Batches
            </button>
            
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
                  <XCircle className="w-8 h-8 text-red-600" />
                  Rejection Details
                </h1>
                <p className="text-gray-600 mt-1">
                  Batch: {batch.batch_number || `#${batch.id}`}
                </p>
              </div>
              {getStatusBadge(batch.status)}
            </div>
          </div>

          {/* Batch Summary */}
          <div className="bg-white rounded-xl shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Batch Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">Supplier</p>
                <p className="font-medium">{supplier_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Invoice Number</p>
                <p className="font-medium">{batch.invoice_number || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Delivery Date</p>
                <p className="font-medium">{formatDate(batch.delivery_date)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Reviewed By</p>
                <p className="font-medium">{reviewed_by_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Review Date</p>
                <p className="font-medium">{formatDate(batch.reviewed_at)}</p>
              </div>
            </div>
          </div>

          {/* Rejected Items */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <ThumbsDown className="w-5 h-5 text-red-600" />
              Rejected Items ({rejected_items.length})
            </h2>

            <div className="space-y-4">
              {rejected_items.map((item, index) => (
                <div key={index} className="border border-red-200 rounded-lg p-4 bg-red-50">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3">
                        <Package className="w-5 h-5 text-red-600 mt-1" />
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {item.product_name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            SKU: {item.product_sku} | Received: {item.received_quantity} units
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-3 ml-8">
                        <div className="bg-white p-3 rounded-lg border border-red-200">
                          <p className="text-sm font-medium text-red-800 flex items-center gap-1">
                            <AlertCircle className="w-4 h-4" />
                            Rejection Reason: {item.rejection_reason || 'Not specified'}
                          </p>
                          {item.rejection_comments && (
                            <p className="text-sm text-gray-700 mt-1 ml-5">
                              "{item.rejection_comments}"
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-2">
                            Approved by: {item.approved_by_name} on {formatDate(item.approved_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => navigate('/inventory/receiving')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Create New Batch
              </button>
              <button
                onClick={() => navigate(`/inventory/receiving?edit=${batch.id}`)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Edit & Resubmit
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <XCircle className="w-8 h-8 text-red-600" />
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Rejected Batches</h1>
                <p className="text-gray-600">
                  Batches that were rejected or partially approved
                </p>
              </div>
            </div>
            <button
              onClick={fetchRejectedBatches}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {rejectedBatches.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-12 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-green-100 rounded-full">
                <Package className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Rejected Batches</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              All your submitted batches have been approved or are still pending review.
            </p>
            <button
              onClick={() => navigate('/inventory/receiving')}
              className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create New Batch
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {rejectedBatches.map((batch) => (
              <div key={batch.id} className="bg-white rounded-xl shadow hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Batch Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-lg font-semibold text-gray-900">
                          {batch.batch_number || `Batch #${batch.id}`}
                        </h2>
                        {getStatusBadge(batch.status)}
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
                        <div>
                          <p className="text-xs text-gray-500">Supplier</p>
                          <p className="text-sm font-medium">{batch.supplier_name}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Invoice</p>
                          <p className="text-sm font-medium">{batch.invoice_number || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Submitted</p>
                          <p className="text-sm font-medium">{formatDate(batch.submitted_at)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Rejected Items</p>
                          <p className="text-sm font-bold text-red-600">{batch.rejection_count || 0}</p>
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={() => handleViewDetails(batch.id)}
                      className="px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 flex items-center gap-2 whitespace-nowrap"
                    >
                      View Rejection Reasons
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RejectedBatches;
