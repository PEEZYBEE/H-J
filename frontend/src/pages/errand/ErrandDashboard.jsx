import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaMotorcycle, 
  FaClock, 
  FaClipboardCheck, 
  FaTimesCircle,
  FaCheckCircle,
  FaChartBar,
  FaCamera,
  FaExclamationTriangle,
  FaArrowRight,
  FaEye,
  FaRedo,
  FaTruck,
  FaBoxOpen,
  FaPlus,
  FaListAlt  // <-- ADD THIS IMPORT for the new icon
} from 'react-icons/fa';

const ErrandDashboard = () => {
  const [user, setUser] = useState(null);
  const [myErrands, setMyErrands] = useState([]);
  const [availableErrands, setAvailableErrands] = useState([]);
  const [allErrands, setAllErrands] = useState([]);
  const [pendingErrands, setPendingErrands] = useState([]);
  const [activeTab, setActiveTab] = useState('available');
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState(null);
  const [stats, setStats] = useState({
    available: 0,
    inProgress: 0,
    pending: 0,
    rejected: 0,
    completed: 0,
    totalEarnings: 0
  });
  const navigate = useNavigate();

  const fetchWithAuth = async (url) => {
    const token = localStorage.getItem('token');
    return fetch(url, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json'
      }
    }).then(res => res.json()).catch(() => ({}));
  };

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(userData);
    fetchAllErrands();
  }, []);

  const fetchAllErrands = async () => {
    try {
      setLoading(true);
      
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const isAdmin = ['admin', 'manager', 'senior'].includes(userData.role);
      
      if (isAdmin) {
        // ADMIN: Fetch all errands and pending errands
        const [allRes, pendingRes] = await Promise.all([
          fetchWithAuth('/api/errands'),
          fetchWithAuth('/api/errands/pending')
        ]);
        
        console.log('All errands:', allRes);
        console.log('Pending errands:', pendingRes);
        
        const allList = allRes.errands || allRes.data?.errands || [];
        const pendingList = pendingRes.errands || pendingRes.data?.errands || [];
        
        setAllErrands(allList);
        setPendingErrands(pendingList);
        
        // Calculate admin stats
        const available = allList.filter(e => e.status === 'pending' && !e.assigned_to).length;
        const inProgress = allList.filter(e => ['accepted', 'in_progress'].includes(e.status)).length;
        const pending = pendingList.length;
        const rejected = allList.filter(e => e.status === 'rejected').length;
        const completed = allList.filter(e => ['approved', 'completed', 'paid'].includes(e.status)).length;
        
        setStats({
          available,
          inProgress,
          pending,
          rejected,
          completed,
          totalEarnings: 0 // Admin doesn't have earnings
        });
        
      } else {
        // RUNNER: Fetch my errands and available errands
        const [myRes, availableRes] = await Promise.all([
          fetchWithAuth('/api/errands/my'),
          fetchWithAuth('/api/errands/available')
        ]);
        
        console.log('My errands:', myRes);
        console.log('Available errands:', availableRes);
        
        const myList = myRes.errands || myRes.data?.errands || [];
        const availableList = availableRes.errands || availableRes.data?.errands || [];
        
        setMyErrands(myList);
        setAvailableErrands(availableList);
        
        // Calculate runner stats
        const available = availableList.length;
        const inProgress = myList.filter(e => ['accepted', 'in_progress'].includes(e.status)).length;
        const pending = myList.filter(e => e.status === 'submitted').length;
        const rejected = myList.filter(e => e.status === 'rejected').length;
        const completed = myList.filter(e => ['approved', 'completed', 'paid'].includes(e.status)).length;
        
        // Calculate earnings
        const totalEarnings = myList
          .filter(e => ['approved', 'completed', 'paid'].includes(e.status))
          .reduce((sum, e) => sum + (e.errand_fee || 0), 0);
        
        setStats({
          available,
          inProgress,
          pending,
          rejected,
          completed,
          totalEarnings
        });
      }
      
    } catch (error) {
      console.error('Failed to fetch errands:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptErrand = async (errandId) => {
    setAcceptingId(errandId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/errands/${errandId}/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        navigate(`/errands/submit/${errandId}`);
      } else {
        alert(data.message || 'Failed to accept errand');
      }
    } catch (error) {
      console.error('Failed to accept errand:', error);
      alert('Network error. Please try again.');
    } finally {
      setAcceptingId(null);
    }
  };

  const getFilteredErrands = () => {
    const isAdmin = user && ['admin', 'manager', 'senior'].includes(user.role);
    
    if (isAdmin) {
      // Admin view
      switch(activeTab) {
        case 'available':
          return allErrands.filter(e => e.status === 'pending' && !e.assigned_to);
        case 'inprogress':
          return allErrands.filter(e => ['accepted', 'in_progress'].includes(e.status));
        case 'pending':
          return pendingErrands;
        case 'rejected':
          return allErrands.filter(e => e.status === 'rejected');
        case 'history':
          return allErrands.filter(e => ['approved', 'completed', 'paid'].includes(e.status));
        default:
          return [];
      }
    } else {
      // Runner view
      switch(activeTab) {
        case 'available':
          return availableErrands;
        case 'inprogress':
          return myErrands.filter(e => ['accepted', 'in_progress'].includes(e.status));
        case 'pending':
          return myErrands.filter(e => e.status === 'submitted');
        case 'rejected':
          return myErrands.filter(e => e.status === 'rejected');
        case 'history':
          return myErrands.filter(e => ['approved', 'completed', 'paid'].includes(e.status));
        default:
          return [];
      }
    }
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

  const StatsCard = ({ title, value, icon, color, onClick }) => {
    const colorClasses = {
      blue: 'bg-blue-100 text-blue-800',
      orange: 'bg-orange-100 text-orange-800',
      purple: 'bg-purple-100 text-purple-800',
      red: 'bg-red-100 text-red-800',
      green: 'bg-green-100 text-green-800'
    };

    return (
      <div 
        onClick={onClick}
        className="bg-white rounded-xl shadow p-6 cursor-pointer transform transition-transform hover:scale-105"
      >
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

  const filteredErrands = getFilteredErrands();
  const isAdmin = user && ['admin', 'manager', 'senior'].includes(user.role);

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
        {/* Header with Create Button and My Errands Link */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
                <FaMotorcycle className="text-blue-600" />
                {isAdmin ? 'Errand Management' : 'Errand Runner Dashboard'}
              </h1>
              <p className="text-gray-600">
                Welcome back, {user?.full_name || user?.username}! 
                {isAdmin ? ' Manage and monitor all errands.' : ' Manage your errands and deliveries.'}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* NEW: My Errands Button - Only visible to runners */}
              {user?.role === 'errand' && (
                <>
                  <button
                    onClick={() => navigate('/errands/my')}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 whitespace-nowrap"
                  >
                    <FaListAlt />
                    My Errands
                  </button>
                  
                  {/* Create Errand Button */}
                  <button
                    onClick={() => navigate('/errands/create-runner')}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 whitespace-nowrap"
                  >
                    <FaPlus />
                    Create New Errand
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <StatsCard
            title="Available"
            value={stats.available}
            icon={<FaMotorcycle className="text-xl" />}
            color="blue"
            onClick={() => setActiveTab('available')}
          />
          <StatsCard
            title="In Progress"
            value={stats.inProgress}
            icon={<FaClock className="text-xl" />}
            color="orange"
            onClick={() => setActiveTab('inprogress')}
          />
          <StatsCard
            title="Pending"
            value={stats.pending}
            icon={<FaClipboardCheck className="text-xl" />}
            color="purple"
            onClick={() => setActiveTab('pending')}
          />
          <StatsCard
            title="Rejected"
            value={stats.rejected}
            icon={<FaTimesCircle className="text-xl" />}
            color="red"
            onClick={() => setActiveTab('rejected')}
          />
          <StatsCard
            title="Completed"
            value={stats.completed}
            icon={<FaCheckCircle className="text-xl" />}
            color="green"
            onClick={() => setActiveTab('history')}
          />
          {!isAdmin && (
            <StatsCard
              title="Earnings"
              value={`KSh ${stats.totalEarnings}`}
              icon={<FaChartBar className="text-xl" />}
              color="blue"
              onClick={() => setActiveTab('history')}
            />
          )}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px overflow-x-auto">
              <button
                onClick={() => setActiveTab('available')}
                className={`px-6 py-4 text-sm font-medium whitespace-nowrap ${
                  activeTab === 'available'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Available ({stats.available})
              </button>
              <button
                onClick={() => setActiveTab('inprogress')}
                className={`px-6 py-4 text-sm font-medium whitespace-nowrap ${
                  activeTab === 'inprogress'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                In Progress ({stats.inProgress})
              </button>
              <button
                onClick={() => setActiveTab('pending')}
                className={`px-6 py-4 text-sm font-medium whitespace-nowrap ${
                  activeTab === 'pending'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Pending Approval ({stats.pending})
              </button>
              <button
                onClick={() => setActiveTab('rejected')}
                className={`px-6 py-4 text-sm font-medium whitespace-nowrap ${
                  activeTab === 'rejected'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Rejected ({stats.rejected})
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-6 py-4 text-sm font-medium whitespace-nowrap ${
                  activeTab === 'history'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                History ({stats.completed})
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {filteredErrands.length === 0 ? (
              <div className="text-center py-12">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-gray-100 rounded-full">
                    <FaBoxOpen className="w-8 h-8 text-gray-400" />
                  </div>
                </div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">No errands found</h3>
                <p className="text-gray-500">
                  {activeTab === 'available' && "No available errands at the moment."}
                  {activeTab === 'inprogress' && "No errands in progress."}
                  {activeTab === 'pending' && "No errands pending approval."}
                  {activeTab === 'rejected' && "No rejected errands."}
                  {activeTab === 'history' && "No completed errands yet."}
                </p>
                {/* Show create button in empty state for runners */}
                {user?.role === 'errand' && activeTab === 'available' && (
                  <button
                    onClick={() => navigate('/errands/create-runner')}
                    className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 mx-auto"
                  >
                    <FaPlus />
                    Create New Errand
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredErrands.map((errand) => (
                  <div key={errand.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Left side - Errand info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-mono text-sm text-gray-500">
                            {errand.errand_number}
                          </span>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            errand.type === 'sourcing' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {errand.type === 'sourcing' ? 'Market Sourcing' : 'Delivery'}
                          </span>
                          {/* Show assignment status for admin view */}
                          {isAdmin && errand.assigned_to && (
                            <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">
                              Taken by: {errand.assignee?.full_name || 'Runner'}
                            </span>
                          )}
                        </div>
                        
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {errand.product_name}
                        </h3>
                        
                        <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                          <div>
                            <span className="text-gray-400">Customer:</span>{' '}
                            {errand.customer_name}
                          </div>
                          <div>
                            <span className="text-gray-400">Phone:</span>{' '}
                            {errand.customer_phone}
                          </div>
                          {errand.agent_name && (
                            <div>
                              <span className="text-gray-400">Agent:</span>{' '}
                              {errand.agent_name}
                            </div>
                          )}
                          {errand.tracking_number && (
                            <div>
                              <span className="text-gray-400">Tracking:</span>{' '}
                              {errand.tracking_number}
                            </div>
                          )}
                          {isAdmin && errand.destination && (
                            <div>
                              <span className="text-gray-400">Destination:</span>{' '}
                              {errand.destination}
                            </div>
                          )}
                        </div>
                        
                        {errand.deadline && (
                          <div className="mt-2 text-sm text-orange-600">
                            <FaClock className="inline mr-1" />
                            Deadline: {formatDate(errand.deadline)}
                          </div>
                        )}
                      </div>

                      {/* Right side - Action buttons */}
                      <div className="flex flex-col sm:flex-row gap-2">
                        {activeTab === 'available' && user?.role === 'errand' && (
                          <button
                            onClick={() => handleAcceptErrand(errand.id)}
                            disabled={acceptingId === errand.id}
                            className={`px-4 py-2 ${
                              acceptingId === errand.id 
                                ? 'bg-gray-400 cursor-not-allowed' 
                                : 'bg-green-600 hover:bg-green-700'
                            } text-white rounded-lg flex items-center gap-2 whitespace-nowrap`}
                          >
                            {acceptingId === errand.id ? (
                              <>
                                <span className="animate-spin">⏳</span>
                                Accepting...
                              </>
                            ) : (
                              <>
                                <FaMotorcycle />
                                Accept & Start
                              </>
                            )}
                          </button>
                        )}

                        {activeTab === 'inprogress' && user?.role === 'errand' && (
                          <button
                            onClick={() => navigate(`/errands/submit/${errand.id}`)}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 whitespace-nowrap"
                          >
                            <FaCamera />
                            {errand.status === 'accepted' ? 'Start Errand' : 'Continue'}
                          </button>
                        )}

                        {/* FIXED: Navigation for pending tab - goes to different pages based on role */}
                        {activeTab === 'pending' && (
                          <button
                            onClick={() => {
                              if (isAdmin) {
                                // Admin goes to approval page
                                navigate(`/errands/approval/${errand.id}`);
                              } else {
                                // Runner goes to view-only submit page
                                navigate(`/errands/submit/${errand.id}?view=true`);
                              }
                            }}
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2 whitespace-nowrap"
                          >
                            <FaEye />
                            {isAdmin ? 'Review Submission' : 'View Submission'}
                          </button>
                        )}

                        {activeTab === 'rejected' && user?.role === 'errand' && (
                          <>
                            <button
                              onClick={() => navigate(`/errands/submit/${errand.id}?rejected=true`)}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 whitespace-nowrap"
                            >
                              <FaTimesCircle />
                              View Rejection
                            </button>
                            <button
                              onClick={() => navigate(`/errands/submit/${errand.id}?resubmit=true`)}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 whitespace-nowrap"
                            >
                              <FaRedo />
                              Resubmit
                            </button>
                          </>
                        )}

                        {activeTab === 'history' && (
                          <button
                            onClick={() => navigate(`/errands/submit/${errand.id}?view=true`)}
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2 whitespace-nowrap"
                          >
                            <FaEye />
                            View Details
                          </button>
                        )}

                        <button
                          onClick={() => navigate(`/errands/details/${errand.id}`)}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 whitespace-nowrap"
                        >
                          <FaArrowRight />
                          Details
                        </button>
                      </div>
                    </div>

                    {/* Rejection reason if rejected */}
                    {activeTab === 'rejected' && errand.latest_submission?.approval && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm font-medium text-red-800 flex items-center gap-1">
                          <FaExclamationTriangle />
                          Rejection Reason: {errand.latest_submission.approval.rejection_reason}
                        </p>
                        {errand.latest_submission.approval.rejection_comments && (
                          <p className="text-sm text-red-600 mt-1">
                            "{errand.latest_submission.approval.rejection_comments}"
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrandDashboard;