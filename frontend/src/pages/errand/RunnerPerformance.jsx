import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaUser,
  FaMotorcycle,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaChartBar,
  FaEye,
  FaCalendar,
  FaFilter,
  FaSearch,
  FaArrowLeft,
  FaMoneyBillWave,
  FaBox
} from 'react-icons/fa';

const RunnerPerformance = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [runnersData, setRunnersData] = useState([]);
  const [selectedRunner, setSelectedRunner] = useState(null);
  const [runnerErrands, setRunnerErrands] = useState([]);
  const [runnerStats, setRunnerStats] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  useEffect(() => {
    fetchRunnersData();
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

  const fetchRunnersData = async () => {
    try {
      setLoading(true);
      // FIXED: Changed to relative URL
      const response = await fetchWithAuth('/api/errands/by-runner');
      if (response.success) {
        setRunnersData(response.runners_data || []);
      }
    } catch (error) {
      console.error('Failed to fetch runners data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRunnerDetails = async (runnerId) => {
    try {
      setLoading(true);
      // FIXED: Changed to relative URL
      let url = `/api/errands/runner/${runnerId}`;
      
      // Add filters
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (dateRange.start) params.append('start_date', dateRange.start);
      if (dateRange.end) params.append('end_date', dateRange.end);
      
      if (params.toString()) url += `?${params.toString()}`;
      
      const response = await fetchWithAuth(url);
      if (response.success) {
        setRunnerErrands(response.errands || []);
        setRunnerStats(response.stats || {});
        setSelectedRunner(response.runner);
      }
    } catch (error) {
      console.error('Failed to fetch runner details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRunnerClick = (runner) => {
    setSelectedRunner(runner);
    fetchRunnerDetails(runner.id);
  };

  const handleBack = () => {
    setSelectedRunner(null);
    setRunnerErrands([]);
    setRunnerStats(null);
    setFilterStatus('all');
    setDateRange({ start: '', end: '' });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'completed': { bg: 'bg-green-100', text: 'text-green-800', icon: <FaCheckCircle /> },
      'approved': { bg: 'bg-green-100', text: 'text-green-800', icon: <FaCheckCircle /> },
      'submitted': { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: <FaClock /> },
      'pending': { bg: 'bg-blue-100', text: 'text-blue-800', icon: <FaClock /> },
      'accepted': { bg: 'bg-purple-100', text: 'text-purple-800', icon: <FaMotorcycle /> },
      'in_progress': { bg: 'bg-orange-100', text: 'text-orange-800', icon: <FaMotorcycle /> },
      'rejected': { bg: 'bg-red-100', text: 'text-red-800', icon: <FaTimesCircle /> }
    };
    const config = statusConfig[status] || { bg: 'bg-gray-100', text: 'text-gray-800', icon: <FaBox /> };
    
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${config.bg} ${config.text} flex items-center gap-1 w-fit`}>
        {config.icon}
        {status.replace('_', ' ')}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-KE', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && !selectedRunner) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => selectedRunner ? handleBack() : navigate('/errands')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <FaArrowLeft className="mr-1" />
            {selectedRunner ? 'Back to All Runners' : 'Back to Errands'}
          </button>
          
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            {selectedRunner ? `${selectedRunner.full_name}'s Errands` : 'Runner Performance'}
          </h1>
          <p className="text-gray-600">
            {selectedRunner 
              ? `View all errands and performance for ${selectedRunner.full_name}`
              : 'Monitor errand runner performance and activity'}
          </p>
        </div>

        {!selectedRunner ? (
          /* Runners Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {runnersData.map((data) => (
              <div
                key={data.runner.id}
                onClick={() => handleRunnerClick(data.runner)}
                className="bg-white rounded-xl shadow p-6 cursor-pointer hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                      {data.runner.full_name?.charAt(0) || data.runner.username?.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{data.runner.full_name || data.runner.username}</h3>
                      <p className="text-sm text-gray-500">{data.runner.phone || 'No phone'}</p>
                    </div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs text-blue-600">Total</p>
                    <p className="text-xl font-bold text-blue-700">{data.stats.total_errands}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3">
                    <p className="text-xs text-green-600">Completed</p>
                    <p className="text-xl font-bold text-green-700">{data.stats.completed}</p>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-3">
                    <p className="text-xs text-yellow-600">Pending</p>
                    <p className="text-xl font-bold text-yellow-700">{data.stats.pending}</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3">
                    <p className="text-xs text-purple-600">Submitted</p>
                    <p className="text-xl font-bold text-purple-700">{data.stats.submitted}</p>
                  </div>
                </div>

                {/* Earnings */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-gray-600">
                    <FaMoneyBillWave className="text-green-600" />
                    <span className="text-sm">Total Earnings</span>
                  </div>
                  <span className="font-bold text-green-600">KSh {data.stats.earnings?.toLocaleString()}</span>
                </div>

                {/* Recent Activity */}
                {data.recent_errands && data.recent_errands.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500 mb-2">Recent Errands:</p>
                    <div className="space-y-2">
                      {data.recent_errands.map(errand => (
                        <div key={errand.id} className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">{errand.errand_number}</span>
                          {getStatusBadge(errand.status)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {runnersData.length === 0 && (
              <div className="col-span-3 text-center py-12 bg-white rounded-xl">
                <FaMotorcycle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">No Runners Found</h3>
                <p className="text-gray-500">There are no active errand runners in the system.</p>
              </div>
            )}
          </div>
        ) : (
          /* Single Runner Detailed View */
          <div className="space-y-6">
            {/* Runner Summary Card */}
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                    {selectedRunner.full_name?.charAt(0) || selectedRunner.username?.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedRunner.full_name || selectedRunner.username}</h2>
                    <p className="text-gray-600">{selectedRunner.phone || 'No phone'} • {selectedRunner.email}</p>
                    <p className="text-sm text-gray-500 mt-1">Runner since {new Date(selectedRunner.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                
                {runnerStats && (
                  <div className="flex gap-4">
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Total Earnings</p>
                      <p className="text-2xl font-bold text-green-600">KSh {runnerStats.earnings?.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Completed</p>
                      <p className="text-2xl font-bold text-green-600">{runnerStats.completed}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FaFilter />
                Filter Errands
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="accepted">Accepted</option>
                    <option value="in_progress">In Progress</option>
                    <option value="submitted">Submitted</option>
                    <option value="completed">Completed</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => fetchRunnerDetails(selectedRunner.id)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <FaSearch />
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>

            {/* Errands List */}
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Errand History</h3>
              
              {runnerErrands.length === 0 ? (
                <div className="text-center py-8">
                  <FaBox className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No errands found for this runner</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {runnerErrands.map(errand => (
                    <div key={errand.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-mono text-sm text-gray-500">{errand.errand_number}</span>
                            {getStatusBadge(errand.status)}
                          </div>
                          
                          <h4 className="font-semibold text-gray-900 mb-2">{errand.product_name}</h4>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                            <div>
                              <span className="text-gray-400">Customer:</span>
                              <p className="font-medium">{errand.customer_name}</p>
                            </div>
                            {errand.market_location && (
                              <div>
                                <span className="text-gray-400">Market:</span>
                                <p className="font-medium">{errand.market_location}</p>
                              </div>
                            )}
                            {errand.destination && (
                              <div>
                                <span className="text-gray-400">Destination:</span>
                                <p className="font-medium">{errand.destination}</p>
                              </div>
                            )}
                            <div>
                              <span className="text-gray-400">Fee:</span>
                              <p className="font-medium text-green-600">KSh {errand.errand_fee}</p>
                            </div>
                          </div>
                          
                          <p className="text-xs text-gray-400 mt-2">
                            Created: {formatDate(errand.created_at)}
                          </p>
                        </div>
                        
                        <button
                          onClick={() => navigate(`/errands/details/${errand.id}`)}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 whitespace-nowrap"
                        >
                          <FaEye />
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RunnerPerformance;