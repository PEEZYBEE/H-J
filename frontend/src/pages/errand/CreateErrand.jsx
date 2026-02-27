import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaArrowLeft, 
  FaUser, 
  FaPhone, 
  FaEnvelope, 
  FaBox,
  FaMapMarkerAlt,
  FaMoneyBillWave,
  FaTruck,
  FaBuilding,
  FaExclamationTriangle,
  FaCheckCircle,
  FaPlus, 
  FaSearch,
  FaTimes
} from 'react-icons/fa';

const CreateErrand = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [deliveryAgents, setDeliveryAgents] = useState([]);
  const [branches, setBranches] = useState([]);
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCustomOption, setShowCustomOption] = useState(false);
  const [errors, setErrors] = useState({});

  // Agent search states
  const [agentSearchTerm, setAgentSearchTerm] = useState('');
  const [showAgentDropdown, setShowAgentDropdown] = useState(false);
  const [filteredAgents, setFilteredAgents] = useState([]);
  const agentDropdownRef = useRef(null);

  // Predefined delivery agents list
  const agentOptions = [
    { id: 1, name: 'SuperMetro', code: 'SMT' },
    { id: 2, name: 'Enabled', code: 'ENB' },
    { id: 3, name: 'Buscar', code: 'BSR' },
    { id: 4, name: 'Ena Coach', code: 'ENA' },
    { id: 5, name: 'Nawaku', code: 'NWK' },
    { id: 6, name: 'Nawasuku', code: 'NWS' },
    { id: 7, name: 'Lopha', code: 'LPH' },
    { id: 8, name: '2NK', code: 'TNK' },
    { id: 9, name: 'Chania Genesis', code: 'CHG' },
    { id: 10, name: 'Unique Shuttle', code: 'UNQ' },
    { id: 11, name: 'Naekana', code: 'NEK' },
    { id: 12, name: 'North Rift', code: 'NRF' },
    { id: 13, name: 'Makos', code: 'MAK' },
    { id: 14, name: 'Likana', code: 'LIK' },
  ];

  const [formData, setFormData] = useState({
    type: 'sourcing',
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    product_id: '',
    product_name: '',
    quantity: 1,
    market_location: '',
    preferred_vendor: '',
    max_price: '',
    delivery_agent_id: '',
    agent_name: '',
    agent_branch: '',
    tracking_number: '',
    priority: 'normal',
    notes: '',
    assigned_to: ''
  });

  const [selectedRunner, setSelectedRunner] = useState(null);
  const [runners, setRunners] = useState([]);
  const [runnerSearchTerm, setRunnerSearchTerm] = useState('');
  const [showRunnerDropdown, setShowRunnerDropdown] = useState(false);

  // Filter agents based on search term
  useEffect(() => {
    if (agentSearchTerm) {
      const filtered = agentOptions.filter(agent =>
        agent.name.toLowerCase().includes(agentSearchTerm.toLowerCase()) ||
        agent.code.toLowerCase().includes(agentSearchTerm.toLowerCase())
      );
      setFilteredAgents(filtered);
    } else {
      setFilteredAgents(agentOptions);
    }
  }, [agentSearchTerm]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (agentDropdownRef.current && !agentDropdownRef.current.contains(event.target)) {
        setShowAgentDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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

  useEffect(() => {
    fetchProducts();
    fetchRunners();
  }, []);

  const fetchProducts = async () => {
    try {
      // FIXED: Changed to relative URL
      const response = await fetchWithAuth('/api/products/products?limit=100');
      const productsList = response.products || response.data?.products || [];
      setProducts(productsList);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  const fetchRunners = async () => {
    try {
      // FIXED: Changed to relative URL
      const response = await fetchWithAuth('/api/auth/users?role=errand');
      const usersList = response.users || response.data?.users || [];
      setRunners(usersList);
    } catch (error) {
      console.error('Failed to fetch runners:', error);
    }
  };

  const handleAgentSelect = (agent) => {
    setFormData({
      ...formData,
      delivery_agent_id: agent.id,
      agent_name: agent.name
    });
    setAgentSearchTerm(agent.name);
    setShowAgentDropdown(false);
  };

  const handleAgentInputChange = (e) => {
    const value = e.target.value;
    setAgentSearchTerm(value);
    setFormData({
      ...formData,
      delivery_agent_id: '', // Clear ID if custom
      agent_name: value
    });
    setShowAgentDropdown(true);
  };

  const clearAgentSelection = () => {
    setFormData({
      ...formData,
      delivery_agent_id: '',
      agent_name: ''
    });
    setAgentSearchTerm('');
  };

  const handleProductSelect = (product) => {
    setFormData({
      ...formData,
      product_id: product.id,
      product_name: product.name
    });
    setSearchTerm('');
  };

  const handleCustomProduct = () => {
    setFormData({
      ...formData,
      product_id: '',
      product_name: searchTerm
    });
    setSearchTerm('');
    setShowCustomOption(false);
  };

  const handleClearProduct = () => {
    setFormData({
      ...formData,
      product_id: '',
      product_name: ''
    });
    setSearchTerm('');
  };

  const handleRunnerSelect = (runner) => {
    setSelectedRunner(runner);
    setFormData({
      ...formData,
      assigned_to: runner.id
    });
    setRunnerSearchTerm('');
    setShowRunnerDropdown(false);
  };

  const handleClearRunner = () => {
    setSelectedRunner(null);
    setFormData({
      ...formData,
      assigned_to: ''
    });
  };

  const filteredProducts = searchTerm
    ? products.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const filteredRunners = runnerSearchTerm
    ? runners.filter(r => 
        r.full_name?.toLowerCase().includes(runnerSearchTerm.toLowerCase()) ||
        r.username?.toLowerCase().includes(runnerSearchTerm.toLowerCase()) ||
        r.phone?.toLowerCase().includes(runnerSearchTerm.toLowerCase())
      )
    : runners;

  useEffect(() => {
    if (searchTerm && filteredProducts.length === 0 && !formData.product_name) {
      setShowCustomOption(true);
    } else {
      setShowCustomOption(false);
    }
  }, [searchTerm, filteredProducts, formData.product_name]);

  useEffect(() => {
    const handleClickOutside = () => {
      setShowRunnerDropdown(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.customer_name) {
      newErrors.customer_name = 'Customer name is required';
    }
    if (!formData.customer_phone) {
      newErrors.customer_phone = 'Customer phone is required';
    }
    if (!formData.product_name) {
      newErrors.product_name = 'Product is required';
    }
    if (!formData.quantity || formData.quantity < 1) {
      newErrors.quantity = 'Valid quantity is required';
    }

    if (formData.type === 'sourcing') {
      if (!formData.market_location) {
        newErrors.market_location = 'Market location is required';
      }
    } else {
      if (!formData.agent_name) {
        newErrors.agent_name = 'Delivery agent is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const errandData = {
        type: formData.type,
        customer_name: formData.customer_name,
        customer_phone: formData.customer_phone,
        customer_email: formData.customer_email || undefined,
        product_name: formData.product_name,
        product_id: formData.product_id || undefined,
        quantity: parseInt(formData.quantity),
        priority: formData.priority,
        notes: formData.notes || undefined,
        assigned_to: formData.assigned_to || undefined
      };

      if (formData.type === 'sourcing') {
        errandData.market_location = formData.market_location;
        errandData.preferred_vendor = formData.preferred_vendor || undefined;
        errandData.max_price = formData.max_price ? parseFloat(formData.max_price) : undefined;
      } else {
        errandData.agent_name = formData.agent_name;
        if (formData.delivery_agent_id) {
          errandData.delivery_agent_id = parseInt(formData.delivery_agent_id);
        }
        errandData.agent_branch = formData.agent_branch || undefined;
        errandData.tracking_number = formData.tracking_number || undefined;
      }

      console.log('Submitting errand data:', errandData);

      // FIXED: Changed to relative URL
      const response = await fetch('/api/errands', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(errandData)
      });

      const data = await response.json();

      if (response.ok) {
        alert('✅ Errand created successfully!');
        navigate('/errands');
      } else {
        alert(data.message || 'Failed to create errand');
      }
    } catch (error) {
      console.error('Error creating errand:', error);
      alert('Failed to create errand');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/errands')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <FaArrowLeft className="mr-1" />
            Back to Errands
          </button>
          
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Create New Errand</h1>
          <p className="text-gray-600">Create a sourcing or delivery task for errand runners</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6">
          
          {/* Errand Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Errand Type *
            </label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setFormData({...formData, type: 'sourcing'})}
                className={`flex-1 p-4 border-2 rounded-lg text-center transition-colors ${
                  formData.type === 'sourcing'
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <FaMapMarkerAlt className="mx-auto text-2xl mb-2" />
                <span className="font-medium">Market Sourcing</span>
                <p className="text-xs text-gray-500 mt-1">Buy from market</p>
              </button>
              
              <button
                type="button"
                onClick={() => setFormData({...formData, type: 'delivery'})}
                className={`flex-1 p-4 border-2 rounded-lg text-center transition-colors ${
                  formData.type === 'delivery'
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <FaTruck className="mx-auto text-2xl mb-2" />
                <span className="font-medium">Delivery</span>
                <p className="text-xs text-gray-500 mt-1">Drop off at agent</p>
              </button>
            </div>
          </div>

          {/* Customer Information */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FaUser className="text-blue-600" />
              Customer Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.customer_name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., John Doe"
                />
                {errors.customer_name && (
                  <p className="text-red-500 text-sm mt-1">{errors.customer_name}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={formData.customer_phone}
                  onChange={(e) => setFormData({...formData, customer_phone: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.customer_phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., 0712345678"
                />
                {errors.customer_phone && (
                  <p className="text-red-500 text-sm mt-1">{errors.customer_phone}</p>
                )}
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  value={formData.customer_email}
                  onChange={(e) => setFormData({...formData, customer_email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="customer@example.com"
                />
              </div>
            </div>
          </div>

          {/* Runner Assignment */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FaBuilding className="text-blue-600" />
              Assign to Runner (Optional)
            </h2>
            
            <div>
              {selectedRunner ? (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">
                      {selectedRunner.full_name?.charAt(0) || selectedRunner.username?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium">{selectedRunner.full_name || selectedRunner.username}</p>
                      <p className="text-sm text-gray-600">{selectedRunner.phone || 'No phone'}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearRunner}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Clear
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={runnerSearchTerm}
                      onChange={(e) => {
                        setRunnerSearchTerm(e.target.value);
                        setShowRunnerDropdown(true);
                      }}
                      onFocus={() => setShowRunnerDropdown(true)}
                      placeholder="Search for a runner by name or phone..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  {showRunnerDropdown && (
                    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredRunners.length > 0 ? (
                        filteredRunners.map(runner => (
                          <button
                            key={runner.id}
                            type="button"
                            onClick={() => handleRunnerSelect(runner)}
                            className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 border-b last:border-0"
                          >
                            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                              {runner.full_name?.charAt(0) || runner.username?.charAt(0)}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">{runner.full_name || runner.username}</p>
                              <p className="text-sm text-gray-500">{runner.phone || 'No phone'}</p>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-gray-500 text-center">
                          No runners found
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Leave empty to assign later from the dashboard
              </p>
            </div>
          </div>

          {/* Product Information */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FaBox className="text-blue-600" />
              Product Information
            </h2>
            
            <div className="space-y-4">
              {/* Product Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product *
                </label>
                
                {/* Selected product display */}
                {formData.product_name && (
                  <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded-lg flex justify-between items-center">
                    <div>
                      <span className="font-medium">{formData.product_name}</span>
                      {formData.product_id ? (
                        <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                          Existing Product
                        </span>
                      ) : (
                        <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                          Custom Product
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleClearProduct}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Clear
                    </button>
                  </div>
                )}

                {/* Search input - only show if no product selected */}
                {!formData.product_name && (
                  <div className="relative">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search for existing product or type custom name..."
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.product_name ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    
                    {/* Dropdown for existing products */}
                    {searchTerm && filteredProducts.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {filteredProducts.map(product => (
                          <button
                            key={product.id}
                            type="button"
                            onClick={() => handleProductSelect(product)}
                            className="w-full text-left px-4 py-2 hover:bg-gray-50 flex justify-between items-center"
                          >
                            <span className="font-medium">{product.name}</span>
                            <span className="text-sm text-gray-500">{product.sku}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Custom product option */}
                    {showCustomOption && (
                      <div className="mt-2">
                        <button
                          type="button"
                          onClick={handleCustomProduct}
                          className="text-blue-600 hover:text-blue-800 flex items-center gap-2 text-sm font-medium"
                        >
                          <FaPlus className="text-xs" />
                          Use "{searchTerm}" as custom product
                        </button>
                      </div>
                    )}
                  </div>
                )}
                
                {errors.product_name && !formData.product_name && (
                  <p className="text-red-500 text-sm mt-1">{errors.product_name}</p>
                )}
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity *
                </label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                  min="1"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.quantity ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.quantity && (
                  <p className="text-red-500 text-sm mt-1">{errors.quantity}</p>
                )}
              </div>
            </div>
          </div>

          {/* Type-specific fields */}
          {formData.type === 'sourcing' ? (
            /* Market Sourcing Fields */
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FaMapMarkerAlt className="text-blue-600" />
                Sourcing Details
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Market Location *
                  </label>
                  <input
                    type="text"
                    value={formData.market_location}
                    onChange={(e) => setFormData({...formData, market_location: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.market_location ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="e.g., City Market, Nairobi"
                  />
                  {errors.market_location && (
                    <p className="text-red-500 text-sm mt-1">{errors.market_location}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preferred Vendor (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.preferred_vendor}
                    onChange={(e) => setFormData({...formData, preferred_vendor: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Shop A"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Price (KSh) (Optional)
                  </label>
                  <input
                    type="number"
                    value={formData.max_price}
                    onChange={(e) => setFormData({...formData, max_price: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., 1000"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Delivery Fields */
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FaTruck className="text-blue-600" />
                Delivery Details
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Searchable Delivery Agent Dropdown */}
                <div className="md:col-span-2 relative" ref={agentDropdownRef}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Delivery Agent *
                  </label>
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={agentSearchTerm}
                      onChange={handleAgentInputChange}
                      onFocus={() => setShowAgentDropdown(true)}
                      className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.agent_name ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Type to search or enter custom agent..."
                    />
                    {formData.agent_name && (
                      <button
                        type="button"
                        onClick={clearAgentSelection}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <FaTimes />
                      </button>
                    )}
                  </div>
                  
                  {/* Dropdown suggestions */}
                  {showAgentDropdown && filteredAgents.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredAgents.map(agent => (
                        <button
                          key={agent.id}
                          type="button"
                          onClick={() => handleAgentSelect(agent)}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center justify-between border-b last:border-0"
                        >
                          <span className="font-medium">{agent.name}</span>
                          <span className="text-sm text-gray-500">{agent.code}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {showAgentDropdown && filteredAgents.length === 0 && agentSearchTerm && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center">
                      <p className="text-gray-600">No matching agents found</p>
                      <p className="text-sm text-gray-500 mt-1">You can continue typing to use "{agentSearchTerm}" as custom agent</p>
                    </div>
                  )}
                  
                  {errors.agent_name && (
                    <p className="text-red-500 text-sm mt-1">{errors.agent_name}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Branch (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.agent_branch}
                    onChange={(e) => setFormData({...formData, agent_branch: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Main Branch"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tracking Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.tracking_number}
                    onChange={(e) => setFormData({...formData, tracking_number: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., EC-98765"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Additional Options */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Additional Options</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({...formData, priority: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes / Special Instructions
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Any special instructions for the runner..."
                />
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/errands')}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? 'Creating...' : 'Create Errand'}
              {!loading && <FaCheckCircle />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateErrand;