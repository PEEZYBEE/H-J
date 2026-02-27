import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaMotorcycle,
  FaClock,
  FaClipboardCheck,
  FaTimesCircle,
  FaCheckCircle,
  FaChartBar,
  FaEye,
  FaRedo,
  FaTruck,
  FaBox,
  FaUser,
  FaCalendar,
  FaMoneyBillWave,
  FaFilter,
  FaSearch,
  FaCalculator,
  FaChevronDown
} from 'react-icons/fa';

const MyErrands = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [myErrands, setMyErrands] = useState([]);
  const [filteredErrands, setFilteredErrands] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('week'); // 'day', 'week', 'month', 'year'
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    submitted: 0,
    rejected: 0,
    totalEarnings: 0
  });

  useEffect(() => {
    fetchMyErrands();
  }, []);

  useEffect(() => {
    filterErrands();
  }, [searchTerm, statusFilter, myErrands, viewMode, selectedDate]);

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

  const fetchMyErrands = async () => {
    try {
      setLoading(true);
      // FIXED: Changed to relative URL
      const response = await fetchWithAuth('/api/errands/my');
      
      console.log('My errands response:', response); // Debug log
      
      const errandsList = response.errands || response.data?.errands || response;
      console.log('Errands list:', errandsList); // Debug log
      
      // Ensure errandsList is an array
      const errandsArray = Array.isArray(errandsList) ? errandsList : [];
      setMyErrands(errandsArray);
      
      // Calculate stats
      const completed = errandsArray.filter(e => ['approved', 'completed', 'paid'].includes(e?.status)).length;
      const pending = errandsArray.filter(e => ['pending', 'accepted', 'in_progress'].includes(e?.status)).length;
      const submitted = errandsArray.filter(e => e?.status === 'submitted').length;
      const rejected = errandsArray.filter(e => e?.status === 'rejected').length;
      
      // Calculate earnings (only from completed/approved errands)
      const totalEarnings = errandsArray
        .filter(e => ['approved', 'completed', 'paid'].includes(e?.status))
        .reduce((sum, e) => sum + (parseFloat(e?.errand_fee) || 100), 0);
      
      setStats({
        total: errandsArray.length,
        completed,
        pending,
        submitted,
        rejected,
        totalEarnings
      });
      
    } catch (error) {
      console.error('Failed to fetch my errands:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterErrands = () => {
    let filtered = [...myErrands];
    
    // Apply date filter based on view mode
    filtered = filtered.filter(errand => {
      const errandDate = new Date(errand.created_at);
      
      switch(viewMode) {
        case 'day':
          // Show errands from selected day
          return errandDate.toDateString() === selectedDate.toDateString();
          
        case 'week':
          // Show errands from the week of selected date
          const startOfWeek = new Date(selectedDate);
          startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay()); // Start of week (Sunday)
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 6); // End of week (Saturday)
          return errandDate >= startOfWeek && errandDate <= endOfWeek;
          
        case 'month':
          // Show errands from selected month
          return errandDate.getMonth() === selectedDate.getMonth() && 
                 errandDate.getFullYear() === selectedDate.getFullYear();
          
        case 'year':
          // Show errands from selected year
          return errandDate.getFullYear() === selectedDate.getFullYear();
          
        default:
          return true;
      }
    });
    
    // Apply status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'completed') {
        filtered = filtered.filter(e => ['approved', 'completed', 'paid'].includes(e.status));
      } else if (statusFilter === 'pending') {
        filtered = filtered.filter(e => ['pending', 'accepted', 'in_progress'].includes(e.status));
      } else {
        filtered = filtered.filter(e => e.status === statusFilter);
      }
    }
    
    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(e => 
        e.errand_number?.toLowerCase().includes(term) ||
        e.customer_name?.toLowerCase().includes(term) ||
        e.product_name?.toLowerCase().includes(term) ||
        e.agent_name?.toLowerCase().includes(term)
      );
    }
    
    // Sort by date (most recent first)
    filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    setFilteredErrands(filtered);
  };

  const navigateDate = (direction) => {
    const newDate = new Date(selectedDate);
    
    switch(viewMode) {
      case 'day':
        newDate.setDate(selectedDate.getDate() + direction);
        break;
      case 'week':
        newDate.setDate(selectedDate.getDate() + (direction * 7));
        break;
      case 'month':
        newDate.setMonth(selectedDate.getMonth() + direction);
        break;
      case 'year':
        newDate.setFullYear(selectedDate.getFullYear() + direction);
        break;
    }
    
    setSelectedDate(newDate);
  };

  const getViewRangeText = () => {
    switch(viewMode) {
      case 'day':
        return selectedDate.toLocaleDateString('en-KE', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        
      case 'week':
        const startOfWeek = new Date(selectedDate);
        startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        
        if (startOfWeek.getMonth() === endOfWeek.getMonth()) {
          return `${startOfWeek.toLocaleDateString('en-KE', { month: 'long', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-KE', { month: 'long', day: 'numeric', year: 'numeric' })}`;
        } else {
          return `${startOfWeek.toLocaleDateString('en-KE', { month: 'long', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-KE', { month: 'long', day: 'numeric', year: 'numeric' })}`;
        }
        
      case 'month':
        return selectedDate.toLocaleDateString('en-KE', { month: 'long', year: 'numeric' });
        
      case 'year':
        return selectedDate.getFullYear().toString();
        
      default:
        return '';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Check if it's today
    if (date.toDateString() === today.toDateString()) {
      return `Today, ${date.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}`;
    }
    // Check if it's yesterday
    else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${date.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}`;
    }
    // Otherwise show full date
    else {
      return date.toLocaleDateString('en-KE', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const formatDayGroup = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-KE', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  };

  const calculateDayFees = (errands) => {
    return errands.reduce((total, errand) => {
      // Only count fees for completed/approved errands
      if (['approved', 'completed', 'paid'].includes(errand.status)) {
        const errandFee = parseFloat(errand.errand_fee) || 100;
        return total + errandFee;
      }
      return total;
    }, 0);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'completed': { bg: 'bg-green-100', text: 'text-green-800', icon: <FaCheckCircle />, label: 'Completed' },
      'approved': { bg: 'bg-green-100', text: 'text-green-800', icon: <FaCheckCircle />, label: 'Approved' },
      'paid': { bg: 'bg-green-100', text: 'text-green-800', icon: <FaCheckCircle />, label: 'Paid' },
      'submitted': { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: <FaClock />, label: 'Submitted' },
      'pending': { bg: 'bg-blue-100', text: 'text-blue-800', icon: <FaClock />, label: 'Pending' },
      'accepted': { bg: 'bg-purple-100', text: 'text-purple-800', icon: <FaMotorcycle />, label: 'Accepted' },
      'in_progress': { bg: 'bg-orange-100', text: 'text-orange-800', icon: <FaMotorcycle />, label: 'In Progress' },
      'rejected': { bg: 'bg-red-100', text: 'text-red-800', icon: <FaTimesCircle />, label: 'Rejected' }
    };
    const config = statusConfig[status] || { bg: 'bg-gray-100', text: 'text-gray-800', icon: <FaBox />, label: status };
    
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${config.bg} ${config.text} flex items-center gap-1 w-fit`}>
        {config.icon}
        {config.label}
      </span>
    );
  };

  const StatsCard = ({ title, value, icon, color }) => {
    const colorClasses = {
      blue: 'bg-blue-100 text-blue-800',
      green: 'bg-green-100 text-green-800',
      yellow: 'bg-yellow-100 text-yellow-800',
      purple: 'bg-purple-100 text-purple-800',
      red: 'bg-red-100 text-red-800',
      orange: 'bg-orange-100 text-orange-800'
    };

    return (
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            {icon}
          </div>
        </div>
      </div>
    );
  };

  // Group errands by day
  const groupedErrands = filteredErrands.reduce((groups, errand) => {
    const day = formatDayGroup(errand.created_at);
    if (!groups[day]) {
      groups[day] = [];
    }
    groups[day].push(errand);
    return groups;
  }, {});

  if (loading) {
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
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <FaMotorcycle className="text-blue-600" />
            My Errands
          </h1>
          <p className="text-gray-600">View and manage all your errands</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <StatsCard
            title="Total Errands"
            value={stats.total}
            icon={<FaBox className="text-xl" />}
            color="blue"
          />
          <StatsCard
            title="Completed"
            value={stats.completed}
            icon={<FaCheckCircle className="text-xl" />}
            color="green"
          />
          <StatsCard
            title="In Progress"
            value={stats.pending}
            icon={<FaClock className="text-xl" />}
            color="orange"
          />
          <StatsCard
            title="Submitted"
            value={stats.submitted}
            icon={<FaClipboardCheck className="text-xl" />}
            color="purple"
          />
          <StatsCard
            title="Rejected"
            value={stats.rejected}
            icon={<FaTimesCircle className="text-xl" />}
            color="red"
          />
          <StatsCard
            title="Total Earnings"
            value={`KSh ${stats.totalEarnings.toLocaleString()}`}
            icon={<FaChartBar className="text-xl" />}
            color="green"
          />
        </div>

        {/* Google Calendar-style View Controls - DROPDOWN VERSION */}
        <div className="bg-white rounded-xl shadow p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* View Mode Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">View:</span>
              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white appearance-none cursor-pointer pr-8"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
                  backgroundPosition: 'right 0.5rem center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '1.5em 1.5em',
                  paddingRight: '2.5rem'
                }}
              >
                <option value="day">Day</option>
                <option value="week">Week</option>
                <option value="month">Month</option>
                <option value="year">Year</option>
              </select>
            </div>

            {/* Date Navigation */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigateDate(-1)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                  title={`Previous ${viewMode}`}
                >
                  ←
                </button>
                <button
                  onClick={() => setSelectedDate(new Date())}
                  className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-gray-200"
                >
                  Today
                </button>
                <button
                  onClick={() => navigateDate(1)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                  title={`Next ${viewMode}`}
                >
                  →
                </button>
              </div>
              <div className="text-lg font-semibold text-gray-900 min-w-[200px] text-center">
                {getViewRangeText()}
              </div>
            </div>

            {/* Summary for current view */}
            <div className="text-sm text-gray-600 bg-blue-50 px-3 py-1 rounded-full">
              {filteredErrands.length} errand{filteredErrands.length !== 1 ? 's' : ''} found
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by errand #, customer, product..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="relative">
              <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
                  backgroundPosition: 'right 0.5rem center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '1.5em 1.5em',
                  paddingRight: '2.5rem'
                }}
              >
                <option value="all">All Statuses</option>
                <option value="pending">In Progress</option>
                <option value="submitted">Submitted</option>
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Errands Table by Day */}
        <div className="space-y-8">
          {Object.keys(groupedErrands).length === 0 ? (
            <div className="bg-white rounded-xl shadow p-12 text-center">
              <FaBox className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">No errands found</h3>
              <p className="text-gray-500">
                {viewMode === 'day' && "No errands for this day. Try a different date or view mode."}
                {viewMode === 'week' && "No errands this week. Try a different week or view mode."}
                {viewMode === 'month' && "No errands this month. Try a different month or view mode."}
                {viewMode === 'year' && "No errands this year. Try a different year or view mode."}
              </p>
              <button
                onClick={() => navigate('/errands/create-runner')}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create New Errand
              </button>
            </div>
          ) : (
            Object.entries(groupedErrands).map(([day, errands]) => {
              const dayFees = calculateDayFees(errands);
              const completedCount = errands.filter(e => ['approved', 'completed', 'paid'].includes(e.status)).length;
              
              return (
                <div key={day} className="bg-white rounded-xl shadow overflow-hidden">
                  {/* Day Header */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <FaCalendar className="text-blue-600" />
                        {day}
                        <span className="text-sm font-normal text-gray-500 ml-2">
                          ({errands.length} errand{errands.length !== 1 ? 's' : ''})
                          {completedCount > 0 && (
                            <span className="ml-2 text-green-600">
                              • {completedCount} completed
                            </span>
                          )}
                        </span>
                      </h2>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ERR #</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery Agent</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dispatch Amt</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Errand Fee</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {errands.map((errand) => {
                          const dispatchAmount = parseFloat(errand.actual_price || errand.max_price || 0);
                          const errandFee = parseFloat(errand.errand_fee) || 100;
                          const isCompleted = ['approved', 'completed', 'paid'].includes(errand.status);
                          
                          return (
                            <tr key={errand.id} className={`hover:bg-gray-50 transition-colors ${isCompleted ? 'bg-green-50/30' : ''}`}>
                              <td className="px-4 py-3">
                                <span className="font-mono text-sm font-medium text-gray-900">
                                  {errand.errand_number}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-sm text-gray-600">
                                  {new Date(errand.created_at).toLocaleTimeString('en-KE', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <FaUser className="text-gray-400 text-xs" />
                                  <span className="text-sm font-medium text-gray-900">
                                    {errand.customer_name}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-sm text-gray-900">{errand.product_name}</span>
                                <span className="text-xs text-gray-500 ml-1">(x{errand.quantity})</span>
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-sm font-medium text-gray-900">
                                  KSh {dispatchAmount.toLocaleString()}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <FaTruck className="text-gray-400 text-xs" />
                                  <span className="text-sm text-gray-900">
                                    {errand.agent_name || 'Not assigned'}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-sm font-medium text-gray-900">
                                  KSh {dispatchAmount.toLocaleString()}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`text-sm font-bold ${isCompleted ? 'text-green-600' : 'text-gray-400'}`}>
                                  KSh {errandFee.toLocaleString()}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                {getStatusBadge(errand.status)}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => navigate(`/errands/details/${errand.id}`)}
                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="View Details"
                                  >
                                    <FaEye />
                                  </button>
                                  {errand.status === 'rejected' && (
                                    <button
                                      onClick={() => navigate(`/errands/submit/${errand.id}?resubmit=true`)}
                                      className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                      title="Resubmit"
                                    >
                                      <FaRedo />
                                    </button>
                                  )}
                                  {errand.status === 'submitted' && (
                                    <button
                                      onClick={() => navigate(`/errands/submit/${errand.id}?view=true`)}
                                      className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                                      title="View Submission"
                                    >
                                      <FaClipboardCheck />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                        
                        {/* Day Total Row - Bottom Right */}
                        {dayFees > 0 && (
                          <tr className="bg-gray-50 border-t-2 border-gray-200">
                            <td colSpan="7" className="px-4 py-3 text-right">
                              <span className="text-sm font-medium text-gray-700 flex items-center gap-2 justify-end">
                                <FaMoneyBillWave className="text-green-600" />
                                Total Fees:
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-lg font-bold text-green-600">
                                KSh {dayFees.toLocaleString()}
                              </span>
                            </td>
                            <td colSpan="2" className="px-4 py-3"></td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default MyErrands;