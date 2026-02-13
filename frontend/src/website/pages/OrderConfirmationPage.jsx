// src/website/pages/OrderConfirmationPage.jsx - COMPLETE VERSION
import React, { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  FaCheckCircle, FaPrint, FaWhatsapp, FaEnvelope,
  FaHome, FaShoppingBag, FaReceipt, FaPhone,
  FaTruck, FaBox, FaClock, FaUser
} from 'react-icons/fa';

const OrderConfirmationPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const {
    orderId,
    orderNumber,
    transactionId,
    paymentMethod,
    amount,
    customerInfo,
    orderItems,
    shippingAddress,
    estimatedDelivery,
    submittedAt
  } = location.state || {};

  // ============ HELPER FUNCTIONS FOR SAFE FORMATTING ============
  
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

  const formatDate = (dateString) => {
    if (!dateString) {
      return new Date().toLocaleString();
    }
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? new Date().toLocaleString() : date.toLocaleString();
    } catch {
      return new Date().toLocaleString();
    }
  };

  // Redirect if no order data
  useEffect(() => {
    if (!orderId && !orderNumber) {
      navigate('/');
    }
  }, [orderId, orderNumber, navigate]);

  // Safely get values with fallbacks
  const displayOrderNumber = orderNumber || orderId || 'N/A';
  const displayAmount = formatCurrency(amount);
  const displayPaymentMethod = paymentMethod || 'N/A';
  const displayTransactionId = transactionId || 'N/A';
  const displayCustomerName = customerInfo 
    ? `${customerInfo.firstName || ''} ${customerInfo.lastName || ''}`.trim() || 'N/A'
    : 'N/A';
  const displayCustomerPhone = customerInfo?.phone || 'N/A';
  const displayCustomerEmail = customerInfo?.email || 'N/A';
  const displaySubmittedAt = formatDate(submittedAt);
  const displayEstimatedDelivery = estimatedDelivery || '2-4 business days';
  const displayShippingAddress = shippingAddress || 'To be confirmed';

  // Print receipt
  const handlePrint = () => {
    window.print();
  };

  // Share via WhatsApp
  const shareViaWhatsApp = () => {
    const message = `I just placed an order on HNJ Store! Order #: ${displayOrderNumber}\nAmount: KSh ${displayAmount}`;
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  // Download receipt
  const downloadReceipt = () => {
    const receiptContent = `
      HNJ STORE ORDER CONFIRMATION
      ============================
      
      Order Number: ${displayOrderNumber}
      Transaction ID: ${displayTransactionId}
      Date: ${displaySubmittedAt}
      
      Customer: ${displayCustomerName}
      Phone: ${displayCustomerPhone}
      Email: ${displayCustomerEmail}
      
      Shipping Address: ${displayShippingAddress}
      
      Payment Method: ${displayPaymentMethod.toUpperCase()}
      Amount Paid: KSh ${displayAmount}
      
      Estimated Delivery: ${displayEstimatedDelivery}
      
      ============================
      Thank you for your purchase!
      
      HNJ Store
      Contact: 0712 345 678
      Email: support@hnjstore.com
    `;

    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hnj-order-${displayOrderNumber}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Success Card */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
                <FaCheckCircle className="text-4xl text-green-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
              <p className="text-gray-600">Thank you for shopping with HNJ Store</p>
            </div>
            
            {/* Order Status Badge */}
            <div className="flex justify-center mb-8">
              <div className="bg-green-100 text-green-800 px-6 py-2 rounded-full font-bold flex items-center gap-2">
                <FaCheckCircle />
                <span>Order #{displayOrderNumber} - Confirmed</span>
              </div>
            </div>
            
            {/* Order Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Order Information */}
              <div className="bg-gray-50 p-5 rounded-lg">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <FaReceipt className="text-blue-600" />
                  Order Details
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order Number:</span>
                    <span className="font-bold text-gray-900">{displayOrderNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Transaction ID:</span>
                    <span className="font-medium text-gray-900">{displayTransactionId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Method:</span>
                    <span className="font-medium text-gray-900 capitalize">{displayPaymentMethod}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount Paid:</span>
                    <span className="font-bold text-red-600">KSh {displayAmount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order Date:</span>
                    <span className="font-medium text-gray-900">{displaySubmittedAt}</span>
                  </div>
                </div>
              </div>
              
              {/* Customer Information */}
              <div className="bg-gray-50 p-5 rounded-lg">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <FaUser className="text-blue-600" />
                  Customer Information
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium text-gray-900">{displayCustomerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phone:</span>
                    <span className="font-medium text-gray-900">{displayCustomerPhone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium text-gray-900">{displayCustomerEmail}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Shipping Information */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <FaTruck className="text-blue-600" />
                Shipping Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-600 text-sm">Delivery Address</p>
                  <p className="font-medium text-gray-900">{displayShippingAddress}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Estimated Delivery</p>
                  <div className="flex items-center gap-2">
                    <FaClock className="text-blue-600" />
                    <p className="font-bold text-blue-700">{displayEstimatedDelivery}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Order Items - if available */}
            {orderItems && orderItems.length > 0 && (
              <div className="mb-8">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FaBox className="text-gray-600" />
                  Order Items ({orderItems.length})
                </h3>
                <div className="border rounded-lg divide-y">
                  {orderItems.map((item, index) => {
                    const itemPrice = formatCurrency(item.price || item.selling_price);
                    const itemTotal = formatCurrency((item.price || item.selling_price || 0) * (item.quantity || 1));
                    
                    return (
                      <div key={index} className="p-4 flex items-center gap-4">
                        <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                          {item.image_urls && item.image_urls[0] ? (
                            <img 
                              src={`http://localhost:5000/api/uploads/products/${item.image_urls[0].split('/').pop()}`}
                              alt={item.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://via.placeholder.com/64x64?text=No+Image';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-200">
                              <span className="text-gray-400 text-xs">No Image</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{item.name}</p>
                          <p className="text-sm text-gray-600">Qty: {item.quantity || 1}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">KSh {itemTotal}</p>
                          <p className="text-sm text-gray-500">KSh {itemPrice} each</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Order Total */}
                <div className="mt-4 p-4 bg-gray-50 rounded-lg flex justify-between items-center">
                  <span className="font-bold text-gray-900">Order Total</span>
                  <span className="text-2xl font-bold text-red-600">KSh {displayAmount}</span>
                </div>
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <button
                onClick={handlePrint}
                className="flex flex-col items-center justify-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <FaPrint className="text-2xl text-gray-700 mb-2" />
                <span className="text-sm font-medium text-gray-900">Print Receipt</span>
              </button>
              
              <button
                onClick={downloadReceipt}
                className="flex flex-col items-center justify-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <FaReceipt className="text-2xl text-gray-700 mb-2" />
                <span className="text-sm font-medium text-gray-900">Download Receipt</span>
              </button>
              
              <button
                onClick={shareViaWhatsApp}
                className="flex flex-col items-center justify-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <FaWhatsapp className="text-2xl text-green-600 mb-2" />
                <span className="text-sm font-medium text-gray-900">Share on WhatsApp</span>
              </button>
              
              <Link
                to="/shop"
                className="flex flex-col items-center justify-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <FaShoppingBag className="text-2xl text-red-600 mb-2" />
                <span className="text-sm font-medium text-gray-900">Continue Shopping</span>
              </Link>
            </div>
            
            {/* Customer Support */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-bold text-gray-900 mb-4">Need Help With Your Order?</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <FaPhone className="text-gray-600" />
                    <span className="font-medium text-gray-900">Call Us</span>
                  </div>
                  <p className="text-gray-600 text-sm">0712 345 678</p>
                  <p className="text-gray-500 text-xs">Mon-Sun, 8AM-8PM</p>
                </div>
                
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <FaEnvelope className="text-gray-600" />
                    <span className="font-medium text-gray-900">Email Us</span>
                  </div>
                  <p className="text-gray-600 text-sm">support@hnjstore.com</p>
                  <p className="text-gray-500 text-xs">Response within 2 hours</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-4 pt-4 border-t">
                Please have your order number <strong>{displayOrderNumber}</strong> ready when contacting support.
              </p>
            </div>
          </div>
          
          {/* Navigation Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/shop"
              className="inline-flex items-center justify-center gap-2 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
            >
              <FaShoppingBag /> Continue Shopping
            </Link>
            
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FaHome /> Go to Homepage
            </Link>
            
            <Link
              to="/orders"
              className="inline-flex items-center justify-center gap-2 border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FaReceipt /> View My Orders
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmationPage;