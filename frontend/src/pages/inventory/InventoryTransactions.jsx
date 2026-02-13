import React, { useState, useEffect } from 'react';
import { Filter, Search, Download, Calendar, FileText, ArrowUpDown, Eye } from 'lucide-react';
import { transactionsAPI } from '../../services/api';

const InventoryTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    type: 'all',
    dateFrom: '',
    dateTo: '',
    sortBy: 'created_at',
    sortOrder: 'desc'
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  useEffect(() => {
    fetchTransactions();
  }, [page, filters.sortBy, filters.sortOrder]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await transactionsAPI.getAllTransactions();
      if (response.success) {
        let filtered = response.transactions || [];
        
        // Apply search filter
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          filtered = filtered.filter(t => 
            t.product_name?.toLowerCase().includes(searchLower) ||
            t.product_sku?.toLowerCase().includes(searchLower) ||
            t.notes?.toLowerCase().includes(searchLower)
          );
        }
        
        // Apply type filter
        if (filters.type !== 'all') {
          filtered = filtered.filter(t => t.transaction_type === filters.type);
        }
        
        // Apply date filters
        if (filters.dateFrom) {
          const fromDate = new Date(filters.dateFrom);
          filtered = filtered.filter(t => new Date(t.created_at) >= fromDate);
        }
        
        if (filters.dateTo) {
          const toDate = new Date(filters.dateTo);
          toDate.setHours(23, 59, 59, 999);
          filtered = filtered.filter(t => new Date(t.created_at) <= toDate);
        }
        
        // Sort transactions
        filtered.sort((a, b) => {
          const aValue = a[filters.sortBy];
          const bValue = b[filters.sortBy];
          
          if (filters.sortOrder === 'asc') {
            return aValue > bValue ? 1 : -1;
          } else {
            return aValue < bValue ? 1 : -1;
          }
        });
        
        setTransactions(filtered);
        setTotalPages(Math.ceil(filtered.length / 20));
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTransactionTypeColor = (type) => {
    switch (type) {
      case 'receive': return 'bg-green-100 text-green-800';
      case 'sale': return 'bg-blue-100 text-blue-800';
      case 'return': return 'bg-purple-100 text-purple-800';
      case 'adjustment': return 'bg-yellow-100 text-yellow-800';
      case 'damage': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'receive': return '↗️';
      case 'sale': return '↘️';
      case 'return': return '🔄';
      case 'adjustment': return '📝';
      case 'damage': return '⚠️';
      default: return '📄';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return `KSh ${parseFloat(amount || 0).toLocaleString()}`;
  };

  const handleSort = (column) => {
    if (filters.sortBy === column) {
      setFilters(prev => ({
        ...prev,
        sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc'
      }));
    } else {
      setFilters(prev => ({
        ...prev,
        sortBy: column,
        sortOrder: 'desc'
      }));
    }
  };

  const viewTransactionDetails = (transaction) => {
    setSelectedTransaction(transaction);
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Product', 'SKU', 'Type', 'Quantity', 'Unit Price', 'Total Value', 'Stock Change', 'Notes'];
    const csvData = transactions.map(t => [
      formatDate(t.created_at),
      t.product_name || 'Unknown',
      t.product_sku || 'N/A',
      t.transaction_type?.toUpperCase() || 'UNKNOWN',
      t.quantity,
      formatCurrency(t.unit_price),
      formatCurrency(t.total_value),
      `${t.previous_stock} → ${t.new_stock}`,
      t.notes || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory-transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Inventory Transactions</h1>
          <p className="text-gray-600">Track all stock movements and changes</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  value={filters.search}
                  onChange={(e) => setFilters({...filters, search: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Type</label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                value={filters.type}
                onChange={(e) => setFilters({...filters, type: e.target.value})}
              >
                <option value="all">All Types</option>
                <option value="receive">Receiving</option>
                <option value="sale">Sales</option>
                <option value="return">Returns</option>
                <option value="adjustment">Adjustments</option>
                <option value="damage">Damage</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="date"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="date"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <button
              onClick={fetchTransactions}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Apply Filters
            </button>
            <button
              onClick={() => setFilters({ 
                search: '', 
                type: 'all', 
                dateFrom: '', 
                dateTo: '',
                sortBy: 'created_at',
                sortOrder: 'desc'
              })}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Clear Filters
            </button>
            <button
              onClick={exportToCSV}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 ml-auto"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">Total Transactions</p>
                <p className="text-2xl font-bold text-gray-900">{transactions.length}</p>
              </div>
              <FileText className="text-blue-500 w-8 h-8" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(transactions.reduce((sum, t) => sum + parseFloat(t.total_value || 0), 0))}
                </p>
              </div>
              <ArrowUpDown className="text-green-500 w-8 h-8" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">Total Received</p>
                <p className="text-2xl font-bold text-blue-600">
                  {transactions.filter(t => t.transaction_type === 'receive').length}
                </p>
              </div>
              <span className="text-2xl">↗️</span>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">Total Sold</p>
                <p className="text-2xl font-bold text-red-600">
                  {transactions.filter(t => t.transaction_type === 'sale').length}
                </p>
              </div>
              <span className="text-2xl">↘️</span>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('created_at')}
                  >
                    <div className="flex items-center gap-1">
                      Date & Time
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('quantity')}
                  >
                    <div className="flex items-center gap-1">
                      Quantity
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('total_value')}
                  >
                    <div className="flex items-center gap-1">
                      Value
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock Change
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                      No transactions found
                    </td>
                  </tr>
                ) : (
                  transactions.slice((page - 1) * 20, page * 20).map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(transaction.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {transaction.product_name || 'Unknown Product'}
                          </p>
                          <p className="text-xs text-gray-500">
                            SKU: {transaction.product_sku || 'N/A'}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getTransactionIcon(transaction.transaction_type)}</span>
                          <span className={`px-3 py-1 text-xs rounded-full ${getTransactionTypeColor(transaction.transaction_type)}`}>
                            {transaction.transaction_type?.toUpperCase() || 'UNKNOWN'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-bold ${transaction.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {transaction.quantity > 0 ? '+' : ''}{transaction.quantity}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-sm font-bold text-gray-900">
                            {formatCurrency(transaction.total_value)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {transaction.unit_price ? `@ ${formatCurrency(transaction.unit_price)}` : ''}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-1">
                          <span className={`${transaction.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {transaction.previous_stock} 
                          </span>
                          <span className="text-gray-600">→</span>
                          <span className="font-bold text-gray-900">
                            {transaction.new_stock}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => viewTransactionDetails(transaction)}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 flex items-center gap-1 text-sm"
                        >
                          <Eye className="w-3 h-3" />
                          Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-700">
                  Showing <span className="font-bold text-gray-900">{(page - 1) * 20 + 1}</span> to{' '}
                  <span className="font-bold text-gray-900">{Math.min(page * 20, transactions.length)}</span> of{' '}
                  <span className="font-bold text-gray-900">{transactions.length}</span> transactions
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Transaction Details Modal */}
      {selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Transaction Details</h3>
                  <p className="text-gray-600">{formatDate(selectedTransaction.created_at)}</p>
                </div>
                <button
                  onClick={() => setSelectedTransaction(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-600">Transaction ID</p>
                  <p className="font-bold text-gray-900">{selectedTransaction.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Type</p>
                  <span className={`px-3 py-1 text-xs rounded-full ${getTransactionTypeColor(selectedTransaction.transaction_type)}`}>
                    {selectedTransaction.transaction_type?.toUpperCase() || 'UNKNOWN'}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Product</p>
                  <p className="font-bold text-gray-900">{selectedTransaction.product_name || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">SKU</p>
                  <p className="font-bold text-gray-900">{selectedTransaction.product_sku || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Quantity</p>
                  <p className={`font-bold ${selectedTransaction.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {selectedTransaction.quantity > 0 ? '+' : ''}{selectedTransaction.quantity}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Value</p>
                  <p className="font-bold text-green-600">
                    {formatCurrency(selectedTransaction.total_value)}
                  </p>
                </div>
              </div>

              {/* Fixed Stock Movement Section */}
              <div className="mb-6">
                <h4 className="font-bold text-gray-900 mb-2">Stock Movement</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-center gap-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Previous Stock</p>
                      <p className="text-2xl font-bold text-gray-900">{selectedTransaction.previous_stock}</p>
                    </div>
                    <div className="text-2xl text-gray-600">→</div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">New Stock</p>
                      <p className="text-2xl font-bold text-gray-900">{selectedTransaction.new_stock}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Change</p>
                      <p className={`text-2xl font-bold ${selectedTransaction.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {selectedTransaction.quantity > 0 ? '+' : ''}{selectedTransaction.quantity}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {selectedTransaction.notes && (
                <div className="mb-6">
                  <h4 className="font-bold text-gray-900 mb-2">Notes</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-900">{selectedTransaction.notes}</p>
                  </div>
                </div>
              )}

              {selectedTransaction.reference_id && (
                <div>
                  <h4 className="font-bold text-gray-900 mb-2">Reference</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-900">
                      {selectedTransaction.reference_type}: {selectedTransaction.reference_id}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryTransactions;