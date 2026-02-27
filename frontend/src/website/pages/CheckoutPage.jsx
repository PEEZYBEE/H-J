// src/website/pages/CheckoutPage.jsx - FIXED with debugging and proper total calculation
import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FaArrowLeft, FaCreditCard, FaMapMarkerAlt, FaUser, 
  FaPhone, FaTruck, FaPlane, FaBus, FaCar, FaMotorcycle, FaShoppingBag,
  FaLock, FaShippingFast, FaSearch, FaSpinner
} from 'react-icons/fa';
import { useCart } from '../context/CartContext';

// Local placeholder data URI (no external dependencies)
const PLACEHOLDER_IMAGE = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'48\' height=\'48\' viewBox=\'0 0 48 48\'%3E%3Crect width=\'48\' height=\'48\' fill=\'%23f0f0f0\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' dominant-baseline=\'middle\' text-anchor=\'middle\' font-family=\'Arial\' font-size=\'12\' fill=\'%23999\'%3ENo Image%3C/text%3E%3C/svg%3E';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cartItems, getCartTotal, getTotalItems, clearCart } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const [agentSearch, setAgentSearch] = useState('');

  // ============ HELPER FUNCTIONS FOR SAFE PRICE FORMATTING ============
  
  const formatCurrency = (value) => {
    if (value === null || value === undefined || value === '') {
      return '0.00';
    }
    const num = parseFloat(value);
    return isNaN(num) ? '0.00' : num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const getItemPrice = (item) => {
    if (!item) return 0;
    // Check for offer price first
    if (item.is_on_offer && item.offer_price) {
      return parseFloat(item.offer_price) || 0;
    }
    // Then check for selling_price (new field)
    if (item.selling_price) {
      return parseFloat(item.selling_price) || 0;
    }
    // Then check for price (old field)
    if (item.price) {
      return parseFloat(item.price) || 0;
    }
    return 0;
  };

  // Calculate total manually to ensure it's correct
  const calculateManualTotal = () => {
    if (!cartItems || cartItems.length === 0) return 0;
    
    return cartItems.reduce((total, item) => {
      const price = getItemPrice(item);
      const quantity = item.quantity || 1;
      return total + (price * quantity);
    }, 0);
  };

  // Get total from context and also calculate manually
  const contextTotal = parseFloat(getCartTotal()) || 0;
  const manualTotal = calculateManualTotal();
  
  // Use the manual total if context total is 0 but items exist
  const total = manualTotal > 0 ? manualTotal : contextTotal;

  // Debug logging
  useEffect(() => {
    console.log('🛒 Checkout Page - Cart Items:', cartItems);
    console.log('💰 Context Total:', contextTotal);
    console.log('💰 Manual Total:', manualTotal);
    console.log('💰 Using Total:', total);
    
    cartItems.forEach((item, index) => {
      console.log(`Item ${index}:`, {
        name: item.name,
        price: getItemPrice(item),
        quantity: item.quantity,
        total: getItemPrice(item) * (item.quantity || 1)
      });
    });
  }, [cartItems, contextTotal, manualTotal, total]);

  // Form states
  const [customerInfo, setCustomerInfo] = useState({
    firstName: '',
    lastName: '',
    phone: '',
  });

  const [shippingAddress, setShippingAddress] = useState({
    county: '',
    city: '',
    deliveryMode: 'doorstep',
    deliveryDetails: '',
    additionalInfo: '',
  });

  const [error, setError] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Kenyan Counties array
  const kenyanCounties = [
    'Baringo', 'Bomet', 'Bungoma', 'Busia', 'Elgeyo Marakwet',
    'Embu', 'Garissa', 'Homa Bay', 'Isiolo', 'Kajiado',
    'Kakamega', 'Kericho', 'Kiambu', 'Kilifi', 'Kirinyaga',
    'Kisii', 'Kisumu', 'Kitui', 'Kwale', 'Laikipia',
    'Lamu', 'Machakos', 'Makueni', 'Mandera', 'Marsabit',
    'Meru', 'Migori', 'Mombasa', 'Murang\'a', 'Nairobi',
    'Nakuru', 'Nandi', 'Narok', 'Nyamira', 'Nyandarua',
    'Nyeri', 'Samburu', 'Siaya', 'Taita Taveta', 'Tana River',
    'Tharaka Nithi', 'Trans Nzoia', 'Turkana', 'Uasin Gishu',
    'Vihiga', 'Wajir', 'West Pokot'
  ].sort();

  // Delivery mode options with icons
  const deliveryModes = [
    { value: 'doorstep', label: 'Doorstep Delivery', icon: <FaTruck />, description: 'We deliver directly to your door' },
    { value: 'self-pick', label: 'Self Pickup', icon: <FaShoppingBag />, description: 'Pick up from our store' },
    { value: 'rider', label: 'Boda Boda/Rider', icon: <FaMotorcycle />, description: 'Delivery by motorcycle rider' },
    { value: 'bus', label: 'Bus/Shuttle Delivery', icon: <FaBus />, description: 'Send via bus company' },
    { value: 'car', label: 'Matatu/Car/Taxi Delivery', icon: <FaCar />, description: 'Send via car/taxi service' },
    { value: 'air', label: 'Air Delivery', icon: <FaPlane />, description: 'Send via air transport' },
    { value: 'mtaani', label: 'Pick up Mtaani', icon: <FaMapMarkerAlt />, description: 'Pick up from Mtaani agent' },
  ];

  // Popular bus companies in Kenya
  const busCompanies = [
    'Easy Coach', 'Modern Coast', 'Dreamline', 'Mash Poa', 'Guardian',
    'Molo Line', 'North Rift', 'Classic', 'Transline', 'Coach',
    'Other (specify below)'
  ];

  // Mtaani agents list
  const mtaaniAgents = [
    'RONGAI KWARE- XTREME MEDIA',
    'RUAKA JOYLAND BABY PARADISE 254',
    'ADANA KIDS FASHION- NEAR UWEZO HOSPITAL SAIKA',
    'Other Agent (specify below)'
  ].sort((a, b) => a.localeCompare(b));

  // Filter agents based on search
  const filteredMtaaniAgents = useMemo(() => {
    if (!agentSearch.trim()) return mtaaniAgents;
    
    const searchTerm = agentSearch.toLowerCase();
    return mtaaniAgents.filter(agent => 
      agent.toLowerCase().includes(searchTerm)
    );
  }, [agentSearch, mtaaniAgents]);

  const handleCustomerInfoChange = (e) => {
    const { name, value } = e.target;
    setCustomerInfo(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleShippingAddressChange = (e) => {
    const { name, value } = e.target;
    setShippingAddress(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleDeliveryModeChange = (mode) => {
    setShippingAddress(prev => ({
      ...prev,
      deliveryMode: mode,
      deliveryDetails: ''
    }));
    if (mode !== 'mtaani') {
      setAgentSearch('');
    }
    setError('');
  };

  const handleAgentSearchChange = (e) => {
    setAgentSearch(e.target.value);
    if (shippingAddress.deliveryMode === 'mtaani') {
      setShippingAddress(prev => ({
        ...prev,
        deliveryDetails: e.target.value
      }));
    }
    setError('');
  };

  const handleAgentSelect = (agent) => {
    setShippingAddress(prev => ({
      ...prev,
      deliveryDetails: agent
    }));
    setAgentSearch(agent);
    setError('');
  };

  const createOrderInDatabase = async () => {
    try {
      console.log('📝 Creating order in database...');
      
      const token = localStorage.getItem('access_token');
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
  
      let phoneNumber = customerInfo.phone.replace(/\D/g, '');
      if (phoneNumber.startsWith('0')) {
        phoneNumber = '254' + phoneNumber.substring(1);
      }
  
      // Calculate item prices safely
      const orderItems = cartItems.map(item => {
        const price = getItemPrice(item);
        return {
          product_id: item.id,
          product_name: item.name,
          quantity: item.quantity || 1,
          unit_price: price,
          total_price: price * (item.quantity || 1)
        };
      });
  
      const orderPayload = {
        customer_name: `${customerInfo.firstName} ${customerInfo.lastName}`.trim() || 'Guest Customer',
        customer_phone: phoneNumber || '254700000000',
        shipping_address: `${shippingAddress.county || 'N/A'}, ${shippingAddress.city || 'N/A'}. Delivery: ${shippingAddress.deliveryMode || 'N/A'} - ${shippingAddress.deliveryDetails || 'N/A'}. ${shippingAddress.additionalInfo || ''}`,
        billing_address: `${customerInfo.firstName || 'Guest'} ${customerInfo.lastName || 'Customer'}`.trim(),
        subtotal: total,
        tax_amount: 0,
        shipping_cost: 0,
        discount_amount: 0,
        total_amount: total,
        payment_method: 'pending',
        notes: `Delivery: ${shippingAddress.deliveryMode}${shippingAddress.deliveryDetails ? ` (${shippingAddress.deliveryDetails})` : ''}. ${shippingAddress.additionalInfo || ''}`,
        items: orderItems
      };
  
      console.log('📦 Sending order to:', '/api/orders/orders');
      console.log('📦 Order payload:', orderPayload);
  
      // FIXED: Using relative URL instead of localhost
      const response = await fetch('/api/orders/orders', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(orderPayload)
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        console.error('❌ Server response:', data);
        throw new Error(data.error || `Server error: ${response.status}`);
      }
  
      console.log('✅ Order created successfully:', data);
      return data;
  
    } catch (error) {
      console.error('❌ Error creating order:', error);
      throw error;
    }
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!termsAccepted) {
      setError('Please accept the terms and conditions');
      return;
    }

    if (!customerInfo.firstName || !customerInfo.lastName || !customerInfo.phone) {
      setError('Please fill in all customer information');
      return;
    }

    if (!shippingAddress.city || !shippingAddress.county || !shippingAddress.deliveryMode) {
      setError('Please fill in shipping address and delivery mode');
      return;
    }

    if ((shippingAddress.deliveryMode === 'bus' || 
         shippingAddress.deliveryMode === 'car' || 
         shippingAddress.deliveryMode === 'air' ||
         shippingAddress.deliveryMode === 'mtaani') && 
        !shippingAddress.deliveryDetails) {
      setError(`Please specify ${shippingAddress.deliveryMode === 'mtaani' ? 'Mtaani agent' : 'company'} details`);
      return;
    }

    const phoneRegex = /^0[17]\d{8}$/;
    if (!phoneRegex.test(customerInfo.phone.replace(/\s/g, ''))) {
      setError('Please enter a valid Kenyan phone number (e.g., 0712345678)');
      return;
    }

    // Check if total is valid
    if (total <= 0) {
      setError('Invalid order total. Please check your cart.');
      return;
    }

    setIsProcessing(true);

    try {
      const orderResponse = await createOrderInDatabase();
      
      if (!orderResponse || !orderResponse.order) {
        throw new Error('Failed to create order. Please try again.');
      }

      const orderData = {
        orderId: orderResponse.order.id,
        orderNumber: orderResponse.order.order_number,
        customerInfo: {
          firstName: customerInfo.firstName,
          lastName: customerInfo.lastName,
          phone: customerInfo.phone,
        },
        shippingAddress: {
          county: shippingAddress.county,
          city: shippingAddress.city,
          deliveryMode: shippingAddress.deliveryMode,
          deliveryDetails: shippingAddress.deliveryDetails,
          additionalInfo: shippingAddress.additionalInfo
        },
        cartItems: cartItems,
        total: total,
        realOrder: orderResponse.order,
        createdAt: new Date().toISOString()
      };

      console.log('🎯 Navigate to payment with REAL order ID:', orderData.orderId);
      
      navigate('/payment', { 
        state: { 
          orderData: orderData,
          message: 'Order created successfully. Please complete payment.'
        }
      });
      
    } catch (error) {
      console.error('❌ Checkout failed:', error);
      setError(error.message || 'Something went wrong. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">Add items to your cart before checking out.</p>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
            >
              <FaArrowLeft /> Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
          <Link
            to="/cart"
            className="inline-flex items-center gap-2 text-red-600 hover:text-red-800"
          >
            <FaArrowLeft /> Back to Cart
          </Link>
        </div>
        
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-700">
              <FaSpinner className="animate-spin" />
              <span className="font-medium">{error}</span>
            </div>
          </div>
        )}
        
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column - Forms */}
          <div className="lg:w-2/3">
            <form onSubmit={handlePlaceOrder} className="space-y-8">
              {/* Customer Information */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <FaUser /> Customer Information
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 mb-2">First Name *</label>
                    <input
                      type="text"
                      name="firstName"
                      value={customerInfo.firstName}
                      onChange={handleCustomerInfoChange}
                      required
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="John"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 mb-2">Last Name *</label>
                    <input
                      type="text"
                      name="lastName"
                      value={customerInfo.lastName}
                      onChange={handleCustomerInfoChange}
                      required
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Doe"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-gray-700 mb-2">Phone Number *</label>
                    <div className="relative">
                      <FaPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="tel"
                        name="phone"
                        value={customerInfo.phone}
                        onChange={handleCustomerInfoChange}
                        required
                        className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        placeholder="0712 345 678"
                        pattern="[0-9]{10}"
                        title="Enter a valid Kenyan phone number (e.g., 0712345678)"
                      />
                    </div>
                    <p className="text-gray-500 text-sm mt-2">
                      We'll send order updates via SMS to this number. Payments number will be input in the next page.
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Shipping Address */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <FaMapMarkerAlt /> Shipping Address
                </h2>
                
                <div className="space-y-6">
                  {/* County and City */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-700 mb-2">County *</label>
                      <div className="relative">
                        <select
                          name="county"
                          value={shippingAddress.county}
                          onChange={handleShippingAddressChange}
                          required
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent appearance-none bg-white pr-10"
                        >
                          <option value="">Select County</option>
                          {kenyanCounties.map((county) => (
                            <option key={county} value={county}>
                              {county}
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-gray-700 mb-2">City/Town *</label>
                      <input
                        type="text"
                        name="city"
                        value={shippingAddress.city}
                        onChange={handleShippingAddressChange}
                        required
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        placeholder="Embakasi/Maua/Mwembe Tayari..."
                      />
                    </div>
                  </div>
                  
                  {/* Delivery Mode */}
                  <div>
                    <label className="block text-gray-700 mb-3">Mode of Delivery *</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {deliveryModes.map((mode) => (
                        <label
                          key={mode.value}
                          className={`flex flex-col items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                            shippingAddress.deliveryMode === mode.value
                              ? 'border-red-500 bg-red-50'
                              : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="deliveryMode"
                            value={mode.value}
                            checked={shippingAddress.deliveryMode === mode.value}
                            onChange={() => handleDeliveryModeChange(mode.value)}
                            className="hidden"
                          />
                          <div className="text-2xl mb-2 text-gray-700">
                            {mode.icon}
                          </div>
                          <div className="font-semibold text-gray-900 text-center text-sm">
                            {mode.label}
                          </div>
                          <div className="text-gray-500 text-xs text-center mt-1">
                            {mode.description}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  {/* Delivery Details based on mode */}
                  {(shippingAddress.deliveryMode === 'bus' || 
                    shippingAddress.deliveryMode === 'car' || 
                    shippingAddress.deliveryMode === 'air' ||
                    shippingAddress.deliveryMode === 'mtaani') && (
                    <div>
                      <label className="block text-gray-700 mb-2">
                        {shippingAddress.deliveryMode === 'bus' ? 'Bus Company *' :
                         shippingAddress.deliveryMode === 'car' ? 'Car/Taxi Company *' :
                         shippingAddress.deliveryMode === 'air' ? 'Airline Company *' :
                         'Pick up Mtaani Agent *'}
                      </label>
                      
                      {shippingAddress.deliveryMode === 'bus' && (
                        <div className="space-y-2">
                          <select
                            name="deliveryDetails"
                            value={shippingAddress.deliveryDetails}
                            onChange={handleShippingAddressChange}
                            required
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                          >
                            <option value="">Select Bus Company</option>
                            {busCompanies.map((company) => (
                              <option key={company} value={company}>
                                {company}
                              </option>
                            ))}
                          </select>
                          {shippingAddress.deliveryDetails === 'Other (specify below)' && (
                            <input
                              type="text"
                              placeholder="Enter bus company name"
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                              value={shippingAddress.deliveryDetails}
                              onChange={(e) => setShippingAddress(prev => ({
                                ...prev,
                                deliveryDetails: e.target.value
                              }))}
                            />
                          )}
                        </div>
                      )}
                      
                      {shippingAddress.deliveryMode === 'mtaani' && (
                        <div className="space-y-4">
                          <div className="relative">
                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                              type="text"
                              value={agentSearch}
                              onChange={handleAgentSearchChange}
                              placeholder="Search for Mtaani agents (e.g., type 'ph' for pharmacies)"
                              className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            />
                          </div>
                          
                          <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-lg">
                            <select
                              name="deliveryDetails"
                              value={shippingAddress.deliveryDetails}
                              onChange={handleShippingAddressChange}
                              required
                              className="w-full p-3 border-0 focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white"
                              size={Math.min(filteredMtaaniAgents.length, 8)}
                            >
                              <option value="">Select Mtaani Agent</option>
                              {filteredMtaaniAgents.map((agent) => (
                                <option 
                                  key={agent} 
                                  value={agent}
                                  onClick={() => handleAgentSelect(agent)}
                                >
                                  {agent}
                                </option>
                              ))}
                            </select>
                          </div>
                          
                          <div className="text-sm text-gray-600">
                            <p>
                              Found {filteredMtaaniAgents.length} agent{filteredMtaaniAgents.length !== 1 ? 's' : ''}
                              {agentSearch && ` matching "${agentSearch}"`}
                            </p>
                            <p className="mt-1 text-gray-500">
                              Tip: Type "ph" to find pharmacies, "cyber" for cyber cafes, etc.
                            </p>
                          </div>
                          
                          {shippingAddress.deliveryDetails === 'Other Agent (specify below)' && (
                            <input
                              type="text"
                              placeholder="Enter Mtaani agent name and location"
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                              value={shippingAddress.deliveryDetails}
                              onChange={(e) => setShippingAddress(prev => ({
                                ...prev,
                                deliveryDetails: e.target.value
                              }))}
                            />
                          )}
                        </div>
                      )}
                      
                      {(shippingAddress.deliveryMode === 'car' || shippingAddress.deliveryMode === 'air') && (
                        <input
                          type="text"
                          name="deliveryDetails"
                          value={shippingAddress.deliveryDetails}
                          onChange={handleShippingAddressChange}
                          required
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                          placeholder={
                            shippingAddress.deliveryMode === 'car' 
                              ? 'Enter car/taxi company name' 
                              : 'Enter airline company name'
                          }
                        />
                      )}
                      
                      <p className="text-gray-500 text-sm mt-2">
                        {shippingAddress.deliveryMode === 'bus' && 'Please specify which bus company to use'}
                        {shippingAddress.deliveryMode === 'car' && 'Please specify which car/taxi service to use'}
                        {shippingAddress.deliveryMode === 'air' && 'Please specify which airline to use'}
                        {shippingAddress.deliveryMode === 'mtaani' && 'Search or select an agent from the list'}
                      </p>
                    </div>
                  )}
                  
                  {/* Additional Information */}
                  <div>
                    <label className="block text-gray-700 mb-2">Additional Information</label>
                    <textarea
                      name="additionalInfo"
                      value={shippingAddress.additionalInfo}
                      onChange={handleShippingAddressChange}
                      rows="3"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder={
                        shippingAddress.deliveryMode === 'doorstep' 
                          ? 'House number, estate, building, floor, landmarks, etc.' :
                        shippingAddress.deliveryMode === 'self-pick'
                          ? 'Pickup time preferences, ID requirements, etc.' :
                        shippingAddress.deliveryMode === 'rider'
                          ? 'Rider instructions, meeting point, etc.' :
                        shippingAddress.deliveryMode === 'bus'
                          ? 'Bus booking reference, departure terminal, etc.' :
                        shippingAddress.deliveryMode === 'car'
                          ? 'Driver contact, pickup location details, etc.' :
                        shippingAddress.deliveryMode === 'air'
                          ? 'Flight details, airport pickup information, etc.' :
                        'Agent contact information, pickup instructions, etc.'
                      }
                    />
                  </div>
                </div>
              </div>
              
              {/* Terms and Conditions */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <label className="flex items-start cursor-pointer">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="text-red-600 mt-1 mr-3"
                  />
                  <div>
                    <div className="font-semibold text-gray-900">I agree to the Terms and Conditions</div>
                    <p className="text-gray-600 text-sm mt-1">
                      By proceeding to payment, you agree to our terms of service and privacy policy.
                      You'll receive order updates via SMS.
                    </p>
                  </div>
                </label>
              </div>
              
              {/* Place Order Button - FIXED with safe formatting */}
              <div className="sticky bottom-0 bg-white p-4 rounded-lg shadow-lg">
                <button
                  type="submit"
                  disabled={isProcessing || cartItems.length === 0 || total <= 0}
                  className={`w-full py-4 rounded-lg font-bold text-white flex items-center justify-center gap-2 ${
                    isProcessing || cartItems.length === 0 || total <= 0
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      Creating Order...
                    </>
                  ) : (
                    <>
                      <FaLock /> Proceed to Payment • KSh {formatCurrency(total)}
                    </>
                  )}
                </button>
                
                <p className="text-gray-500 text-sm text-center mt-3">
                  {isProcessing ? 'Creating order in database...' : 'You\'ll be redirected to the payment page'}
                </p>
              </div>
            </form>
          </div>
          
          {/* Right Column - Order Summary */}
          <div className="lg:w-1/3">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <h2 className="text-xl font-bold text-gray-900 mb-6 pb-4 border-b">Order Summary</h2>
              
              {/* Cart Items Preview - FIXED with safe formatting and relative URL */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Items ({getTotalItems()})</h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {cartItems.map(item => {
                    const price = getItemPrice(item);
                    const itemTotal = price * (item.quantity || 1);
                    
                    return (
                      <div key={item.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                        <div className="w-12 h-12 flex-shrink-0">
                          {item.image_urls && item.image_urls.length > 0 ? (
                            <img 
                              // FIXED: Using relative URL instead of localhost
                              src={`/api/uploads/products/${item.image_urls[0]?.split('/').pop()}`}
                              alt={item.name}
                              className="w-full h-full object-cover rounded"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = PLACEHOLDER_IMAGE;
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-200 rounded">
                              <span className="text-xs text-gray-400">No Image</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 text-sm line-clamp-1">{item.name}</h4>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 text-sm">Qty: {item.quantity || 1}</span>
                            <span className="font-semibold text-red-600 text-sm">
                              KSh {formatCurrency(itemTotal)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Order Totals - FIXED with safe formatting */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center pt-2 border-t">
                  <div>
                    <span className="text-lg font-bold text-gray-900">Total to Pay</span>
                    <p className="text-gray-500 text-sm">Shipping paid separately</p>
                  </div>
                  <span className="text-2xl font-bold text-red-600">
                    KSh {formatCurrency(total)}
                  </span>
                </div>
              </div>
              
              {/* Order Notes */}
              <div className="mt-6 pt-6 border-t border-gray-200 bg-blue-50 p-4 rounded">
                <h3 className="font-semibold text-gray-900 mb-2">Important Notes</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li className="flex items-start">
                    <span className="text-red-600 mr-2">•</span>
                    <span>Order will be created in database before payment</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-600 mr-2">•</span>
                    <span>Payment page will use real order ID</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-600 mr-2">•</span>
                    <span>Cart will be cleared after successful payment</span>
                  </li>
                </ul>
              </div>
              
              {/* Contact Support */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3">Need Help?</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-600">
                    <FaPhone className="text-sm" />
                    <span className="text-sm">Call: 0712 345 678</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <FaTruck className="text-sm" />
                    <span className="text-sm">Delivery Support: 0722 987 654</span>
                  </div>
                  <Link to="/contact" className="text-red-600 hover:text-red-800 text-sm">
                    Contact Support →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;