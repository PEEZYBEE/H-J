// src/website/pages/PaymentPendingPage.jsx - FIXED with safe formatting
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaHourglassHalf, FaCheckCircle, FaPhone, FaShoppingBag, FaHome } from 'react-icons/fa';

const PaymentPendingPage = () => {
  const location = useLocation();
  const {
    orderId,
    orderNumber,
    mpesaCode,
    amount,
    customerInfo,
    tillNumber,
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

  // Safely get values with fallbacks
  const displayOrderNumber = orderNumber || orderId || 'N/A';
  const displayAmount = formatCurrency(amount);
  const displayTillNumber = tillNumber || 'N/A';
  const displayMpesaCode = mpesaCode || 'N/A';
  const displayCustomerName = customerInfo 
    ? `${customerInfo.firstName || ''} ${customerInfo.lastName || ''}`.trim() || 'N/A'
    : 'N/A';
  const displayCustomerPhone = customerInfo?.phone || 'N/A';
  const displaySubmittedAt = formatDate(submittedAt);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-blue-600 text-white p-6 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
                <FaHourglassHalf className="text-3xl" />
              </div>
              <h1 className="text-3xl font-bold mb-2">Order Submitted</h1>
              <p className="text-blue-100">Pending Admin Verification</p>
            </div>
            
            <div className="p-6 md:p-8">
              {/* Order Status */}
              <div className="mb-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <FaHourglassHalf className="text-2xl text-blue-600" />
                  <span className="text-xl font-bold text-blue-800">PENDING VERIFICATION</span>
                </div>
                <p className="text-center text-blue-700">
                  Your M-PESA code has been submitted. Our admin team will verify the payment within 24 hours.
                </p>
              </div>
              
              {/* Order Details - FIXED with safe values */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-gray-50 p-5 rounded-lg">
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <FaCheckCircle className="text-green-600" />
                    Order Information
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Order Number:</span>
                      <span className="font-bold text-gray-900">{displayOrderNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Amount:</span>
                      <span className="font-bold text-red-600">KSh {displayAmount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Till Number:</span>
                      <span className="font-bold text-green-600">{displayTillNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">M-PESA Code:</span>
                      <span className="font-mono font-bold text-blue-600">{displayMpesaCode}</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-5 rounded-lg">
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <FaPhone className="text-blue-600" />
                    Customer Info
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
                      <span className="text-gray-600">Submitted:</span>
                      <span className="font-medium text-gray-900">{displaySubmittedAt}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* What Happens Next */}
              <div className="mb-8 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h3 className="font-bold text-gray-900 mb-3">What Happens Next?</h3>
                <ol className="space-y-3 text-gray-700">
                  <li className="flex items-start">
                    <span className="font-bold text-yellow-600 mr-2">1.</span>
                    <span>Our admin team will cross-check your M-PESA code <strong className="font-mono">{displayMpesaCode}</strong> with our M-PESA statements</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-bold text-yellow-600 mr-2">2.</span>
                    <span>If the code matches a payment, your order will be confirmed</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-bold text-yellow-600 mr-2">3.</span>
                    <span>You will receive a confirmation email/SMS</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-bold text-yellow-600 mr-2">4.</span>
                    <span>Your order will be processed for shipping</span>
                  </li>
                </ol>
                <div className="mt-4 p-4 bg-white border border-yellow-300 rounded">
                  <p className="text-sm font-medium text-gray-900">
                    ⚠️ <strong>Important:</strong> If the code doesn't match any payment, your order will be cancelled.
                  </p>
                </div>
              </div>
              
              {/* Support Info */}
              <div className="p-6 bg-gray-100 rounded-lg mb-8">
                <h3 className="font-bold text-gray-900 mb-3">Need Help?</h3>
                <div className="space-y-2">
                  <p className="text-gray-700">
                    If you have questions about your order, contact our support team:
                  </p>
                  <div className="flex items-center gap-2 text-gray-900">
                    <FaPhone className="text-red-600" />
                    <span className="font-bold">0712 345 678</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Please have your order number <strong>{displayOrderNumber}</strong> ready.
                  </p>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/"
                  className="flex-1 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                >
                  <FaHome /> Continue Shopping
                </Link>
                <Link
                  to="/orders"
                  className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-bold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                  <FaShoppingBag /> View My Orders
                </Link>
              </div>
              
              {/* Note */}
              <div className="mt-6 pt-6 border-t">
                <p className="text-center text-gray-500 text-sm">
                  You can check your order status anytime in "My Orders" section
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPendingPage;