import React, { useState, useEffect } from 'react';
import { Check, X, Eye, Package, AlertCircle, Filter, RefreshCw, Download, User } from 'lucide-react';
import { getPendingBatches, getBatch, approveBatchItem, completeBatch } from '../../services/api';

const BatchApproval = () => {
  const [loading, setLoading] = useState(false);
  const [pendingBatches, setPendingBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [batchItems, setBatchItems] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedItemForReject, setSelectedItemForReject] = useState(null);
  const [rejectionForm, setRejectionForm] = useState({
    reason: '',
    comments: ''
  });

  useEffect(() => {
    fetchPendingBatches();
  }, []);

  const fetchPendingBatches = async () => {
    try {
      setLoading(true);
      const response = await getPendingBatches();
      if (response.success) {
        setPendingBatches(response.batches || []);
      }
    } catch (error) {
      console.error('Failed to fetch pending batches:', error);
      alert(error.response?.data?.message || 'Failed to fetch batches');
    } finally {
      setLoading(false);
    }
  };

  const viewBatchDetails = async (batchId) => {
    try {
      setLoading(true);
      const response = await getBatch(batchId);
      
      if (response.success) {
        setSelectedBatch(response.batch);
        setBatchItems(response.items || []);
      }
    } catch (error) {
      console.error('Failed to fetch batch details:', error);
      alert(error.response?.data?.message || 'Failed to fetch batch details');
    } finally {
      setLoading(false);
    }
  };

  const approveItem = async (itemId) => {
    if (!window.confirm('Approve this item?')) return;
    
    try {
      const response = await approveBatchItem(
        selectedBatch.id, 
        itemId, 
        'approve'
      );
      
      if (response.success) {
        // Update local state
        setBatchItems(prev => prev.map(item => 
          item.id === itemId ? { 
            ...item, 
            status: 'approved',
            approved_at: new Date().toISOString(),
            barcode: response.item?.barcode
          } : item
        ));
        
        // Update batch status
        setSelectedBatch(prev => ({ 
          ...prev, 
          status: response.batch_status,
          reviewed_at: new Date().toISOString()
        }));
        
        alert('Item approved! Stock has been updated.');
      }
    } catch (error) {
      console.error('Failed to approve item:', error);
      alert(error.response?.data?.message || 'Failed to approve item');
    }
  };

  const rejectItem = async (itemId) => {
    if (!rejectionForm.reason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    if (!window.confirm('Reject this item?')) return;
    
    try {
      const response = await approveBatchItem(
        selectedBatch.id, 
        itemId, 
        'reject',
        {
          rejection_reason: rejectionForm.reason,
          rejection_comments: rejectionForm.comments
        }
      );
      
      if (response.success) {
        // Update local state
        setBatchItems(prev => prev.map(item => 
          item.id === itemId ? { 
            ...item, 
            status: 'rejected',
            rejection_reason: rejectionForm.reason,
            rejection_comments: rejectionForm.comments,
            approved_at: new Date().toISOString()
          } : item
        ));
        
        // Update batch status
        setSelectedBatch(prev => ({ 
          ...prev, 
          status: response.batch_status,
          reviewed_at: new Date().toISOString()
        }));
        
        // Reset rejection form
        setRejectionForm({ reason: '', comments: '' });
        setShowRejectModal(false);
        
        alert('Item rejected! The receiving employee will see your feedback.');
      }
    } catch (error) {
      console.error('Failed to reject item:', error);
      alert(error.response?.data?.message || 'Failed to reject item');
    }
  };

  const completeBatch = async () => {
    if (!window.confirm('Mark this batch as completed?')) return;
    
    try {
      const response = await completeBatch(selectedBatch.id);
      
      if (response.success) {
        setSelectedBatch(prev => ({ ...prev, status: 'completed' }));
        alert('Batch marked as completed!');
        fetchPendingBatches();
      }
    } catch (error) {
      console.error('Failed to complete batch:', error);
      alert(error.response?.data?.message || 'Failed to complete batch');
    }
  };

  const openRejectModal = (item) => {
    setSelectedItemForReject(item);
    setShowRejectModal(true);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">Approved</span>;
      case 'rejected':
        return <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">Rejected</span>;
      default:
        return <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">Pending</span>;
    }
  };

  const getBatchStatusBadge = (status) => {
    switch (status) {
      case 'submitted':
        return <span className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full">Submitted</span>;
      case 'pending_review':
        return <span className="px-3 py-1 text-sm bg-yellow-100 text-yellow-800 rounded-full">Under Review</span>;
      case 'approved':
        return <span className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded-full">Approved</span>;
      case 'partially_approved':
        return <span className="px-3 py-1 text-sm bg-purple-100 text-purple-800 rounded-full">Partially Approved</span>;
      case 'rejected':
        return <span className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded-full">Rejected</span>;
      case 'completed':
        return <span className="px-3 py-1 text-sm bg-gray-100 text-gray-800 rounded-full">Completed</span>;
      default:
        return <span className="px-3 py-1 text-sm bg-gray-100 text-gray-800 rounded-full">{status}</span>;
    }
  };

  const filteredBatches = pendingBatches.filter(batch => {
    if (statusFilter === 'all') return true;
    return batch.status === statusFilter;
  });

  const calculateBatchStats = () => {
    const totalItems = batchItems.length;
    const approvedItems = batchItems.filter(i => i.status === 'approved').length;
    const rejectedItems = batchItems.filter(i => i.status === 'rejected').length;
    const pendingItems = batchItems.filter(i => i.status === 'pending').length;
    const totalValue = batchItems.reduce((sum, item) => {
      const price = parseFloat(item.unit_price) || 0;
      const quantity = item.received_quantity || 0;
      return sum + (price * quantity);
    }, 0);

    return { totalItems, approvedItems, rejectedItems, pendingItems, totalValue };
  };

  const stats = calculateBatchStats();

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Batch Approval</h1>
          <p className="text-gray-600">Review and approve received stock</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Pending Batches List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow p-4 md:p-6 mb-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-gray-600" />
                  Batches for Review
                </h2>
                <div className="flex items-center gap-4">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                  >
                    <option value="all" className="text-gray-900">All Status</option>
                    <option value="submitted" className="text-gray-900">Submitted</option>
                    <option value="pending_review" className="text-gray-900">Under Review</option>
                    <option value="approved" className="text-gray-900">Approved</option>
                    <option value="partially_approved" className="text-gray-900">Partially Approved</option>
                    <option value="rejected" className="text-gray-900">Rejected</option>
                  </select>
                  <button
                    onClick={fetchPendingBatches}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                    title="Refresh"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              ) : filteredBatches.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No pending batches</p>
              ) : (
                <div className="space-y-4">
                  {filteredBatches.map(batch => (
                    <div 
                      key={batch.id} 
                      className={`border border-gray-200 rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedBatch?.id === batch.id ? 'border-blue-500 bg-blue-50' : ''
                      }`}
                      onClick={() => viewBatchDetails(batch.id)}
                    >
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-bold text-gray-900">{batch.batch_number}</h3>
                            {getBatchStatusBadge(batch.status)}
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                            <div>
                              <p className="text-gray-600">Supplier</p>
                              <p className="font-medium text-gray-900">{batch.supplier_name || batch.supplier_details?.name || 'Unknown'}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Submitted By</p>
                              <p className="font-medium text-gray-900">{batch.submitted_by_name || 'Unknown'}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Invoice</p>
                              <p className="font-medium text-gray-900">{batch.invoice_number || 'N/A'}</p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-600">
                            {batch.total_items || 0} items
                          </div>
                          <div className="text-lg font-bold text-green-600">
                            KSh {parseFloat(batch.total_value || 0).toLocaleString()}
                          </div>
                          {batch.submitted_at && (
                            <div className="text-sm text-gray-500">
                              {new Date(batch.submitted_at).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Batch Details */}
            {selectedBatch && (
              <div className="bg-white rounded-xl shadow p-4 md:p-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">
                      {selectedBatch.batch_number}
                    </h2>
                    <div className="flex items-center gap-2 mb-4">
                      {getBatchStatusBadge(selectedBatch.status)}
                      <span className="text-gray-600">
                        • Submitted: {new Date(selectedBatch.submitted_at).toLocaleDateString()}
                      </span>
                      {selectedBatch.reviewed_at && (
                        <span className="text-gray-600">
                          • Reviewed: {new Date(selectedBatch.reviewed_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600 mb-2">
                      KSh {parseFloat(selectedBatch.total_value || 0).toLocaleString()}
                    </div>
                    <div className="text-gray-600">{batchItems.length} items</div>
                  </div>
                </div>

                {/* Batch Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Supplier</p>
                    <p className="font-bold text-gray-900">{selectedBatch.supplier_details?.name || selectedBatch.supplier_name || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Invoice Number</p>
                    <p className="font-bold text-gray-900">{selectedBatch.invoice_number || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Submitted By</p>
                    <p className="font-bold text-gray-900">{selectedBatch.submitted_by_name || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Delivery Date</p>
                    <p className="font-bold text-gray-900">
                      {selectedBatch.delivery_date ? new Date(selectedBatch.delivery_date).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Items to Review</h3>
                  {selectedBatch.status === 'approved' || selectedBatch.status === 'partially_approved' ? (
                    <button
                      onClick={completeBatch}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      Mark as Completed
                    </button>
                  ) : null}
                </div>
                
                {batchItems.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No items found</p>
                ) : (
                  <div className="space-y-4">
                    {batchItems.map(item => (
                      <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-3">
                          <div className="flex-1">
                            <div className="flex items-start gap-2 mb-2">
                              <h4 className="font-bold text-gray-900">{item.product_name}</h4>
                              {getStatusBadge(item.status)}
                            </div>
                            <p className="text-sm text-gray-600 mb-2">SKU: {item.product_sku}</p>
                            {item.product_details?.stock_quantity !== undefined && (
                              <p className="text-sm text-gray-700">
                                Current Stock: <span className="font-bold text-gray-900">{item.product_details.stock_quantity}</span>
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                          <div>
                            <p className="text-sm text-gray-600">Expected</p>
                            <p className="font-bold text-gray-900">{item.expected_quantity || 0}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Received</p>
                            <p className="font-bold text-gray-900">{item.received_quantity}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Unit Price</p>
                            <p className="font-bold text-gray-900">KSh {parseFloat(item.unit_price || 0).toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Total</p>
                            <p className="font-bold text-green-600">
                              KSh {((item.received_quantity || 0) * parseFloat(item.unit_price || 0)).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        
                        {item.status === 'pending' && (
                          <div className="flex flex-col sm:flex-row gap-2">
                            <button
                              onClick={() => approveItem(item.id)}
                              className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                            >
                              <Check className="w-4 h-4" />
                              Approve Item
                            </button>
                            <button
                              onClick={() => openRejectModal(item)}
                              className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"
                            >
                              <X className="w-4 h-4" />
                              Reject Item
                            </button>
                          </div>
                        )}
                        
                        {item.barcode && (
                          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                            <p className="text-sm font-bold text-blue-700">Barcode:</p>
                            <code className="text-xs font-mono bg-white p-1 rounded text-gray-900">{item.barcode}</code>
                          </div>
                        )}
                        
                        {item.status === 'rejected' && (
                          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm font-bold text-red-700">Rejection Reason:</p>
                            <p className="text-red-600">{item.rejection_reason}</p>
                            {item.rejection_comments && (
                              <p className="text-sm text-red-600 mt-1">{item.rejection_comments}</p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column - Instructions & Stats */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow p-4 md:p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-gray-600" />
                Approval Guide
              </h3>
              
              <div className="space-y-3">
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="font-bold text-green-800">✅ Approve When:</p>
                  <ul className="text-sm text-green-700 mt-1 space-y-1">
                    <li className="text-green-700">• Quantity matches order</li>
                    <li className="text-green-700">• Product is in good condition</li>
                    <li className="text-green-700">• Price matches invoice</li>
                    <li className="text-green-700">• All items are correct</li>
                  </ul>
                </div>
                
                <div className="p-3 bg-red-50 rounded-lg">
                  <p className="font-bold text-red-800">❌ Reject When:</p>
                  <ul className="text-sm text-red-700 mt-1 space-y-1">
                    <li className="text-red-700">• Wrong product received</li>
                    <li className="text-red-700">• Damaged or defective items</li>
                    <li className="text-red-700">• Quantity mismatch</li>
                    <li className="text-red-700">• Expired products</li>
                    <li className="text-red-700">• Incorrect pricing</li>
                  </ul>
                </div>
                
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="font-bold text-blue-800">📋 After Approval:</p>
                  <ul className="text-sm text-blue-700 mt-1 space-y-1">
                    <li className="text-blue-700">• Stock is updated immediately</li>
                    <li className="text-blue-700">• Items become available for sale</li>
                    <li className="text-blue-700">• Barcodes are generated</li>
                    <li className="text-blue-700">• Inventory records are created</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Stats */}
            {selectedBatch && (
              <div className="bg-white rounded-xl shadow p-4 md:p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Batch Statistics</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600">Total Items</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalItems}</p>
                    </div>
                    <Package className="text-gray-500 w-6 h-6" />
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600">Approved Items</p>
                      <p className="text-2xl font-bold text-green-600">{stats.approvedItems}</p>
                    </div>
                    <Check className="text-green-500 w-6 h-6" />
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600">Rejected Items</p>
                      <p className="text-2xl font-bold text-red-600">{stats.rejectedItems}</p>
                    </div>
                    <X className="text-red-500 w-6 h-6" />
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600">Pending Items</p>
                      <p className="text-2xl font-bold text-yellow-600">{stats.pendingItems}</p>
                    </div>
                    <AlertCircle className="text-yellow-500 w-6 h-6" />
                  </div>
                  
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Value</span>
                      <span className="text-lg font-bold text-green-600">
                        KSh {stats.totalValue.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rejection Modal */}
      {showRejectModal && selectedItemForReject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Reject Item</h3>
              <p className="text-gray-600 mb-4">
                Why are you rejecting <strong className="text-gray-900">{selectedItemForReject.product_name}</strong>?
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason for Rejection *
                  </label>
                  <select
                    value={rejectionForm.reason}
                    onChange={(e) => setRejectionForm({...rejectionForm, reason: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white text-gray-900"
                    required
                  >
                    <option value="" className="text-gray-900">Select a reason</option>
                    <option value="Wrong product" className="text-gray-900">Wrong product</option>
                    <option value="Damaged goods" className="text-gray-900">Damaged goods</option>
                    <option value="Quantity mismatch" className="text-gray-900">Quantity mismatch</option>
                    <option value="Expired product" className="text-gray-900">Expired product</option>
                    <option value="Incorrect price" className="text-gray-900">Incorrect price</option>
                    <option value="Missing accessories" className="text-gray-900">Missing accessories</option>
                    <option value="Quality issue" className="text-gray-900">Quality issue</option>
                    <option value="Other" className="text-gray-900">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Comments (Optional)
                  </label>
                  <textarea
                    value={rejectionForm.comments}
                    onChange={(e) => setRejectionForm({...rejectionForm, comments: e.target.value})}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white text-gray-900"
                    placeholder="Add any additional comments..."
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowRejectModal(false);
                      setSelectedItemForReject(null);
                      setRejectionForm({ reason: '', comments: '' });
                    }}
                    className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-bold hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => rejectItem(selectedItemForReject.id)}
                    disabled={!rejectionForm.reason}
                    className={`flex-1 py-3 rounded-lg font-bold ${
                      !rejectionForm.reason
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-red-600 text-white hover:bg-red-700'
                    }`}
                  >
                    Confirm Rejection
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchApproval;