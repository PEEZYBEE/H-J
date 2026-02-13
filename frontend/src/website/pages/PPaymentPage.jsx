// src/website/pages/PaymentPage.jsx - UPDATED
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  FaArrowLeft, FaCreditCard, FaMobileAlt, FaMoneyBillWave,
  FaSpinner, FaCheckCircle, FaTimesCircle, FaLock,
  FaShieldAlt, FaClock, FaReceipt, FaRedo, FaInfoCircle,
  FaExclamationTriangle, FaDatabase, FaStore, FaPhone,
  FaShoppingCart, FaQrcode, FaCaretDown
} from 'react-icons/fa';
import { useCart } from '../context/CartContext';
import { mpesaService , checkOrderPaymentStatus } from '../services/mpesaService';

const PaymentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { clearCart } = useCart();
  
  // Get order data from location state
  const orderData = location.state?.orderData || {};
  const successMessage = location.state?.message || '';
  
  const [paymentMethod, setPaymentMethod] = useState('mpesa');
  const [mpesaOption, setMpesaOption] = useState('stk'); // 'stk' or 'buygoods'
  const [paymentPhone, setPaymentPhone] = useState('');
  const [tillNumber] = useState('112233'); // Static till number for Buy Goods
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [transactionId, setTransactionId] = useState('');
  const [realOrderData, setRealOrderData] = useState(orderData.realOrder || null);
  
  const [mpesaStatus, setMpesaStatus] = useState({
    checkoutRequestID: '',
    merchantRequestID: '',
    isPromptSent: false,
    isCheckingStatus: false,
    lastCheck: null,
    resultCode: null,
    resultDesc: ''
  });
  
  const [countdown, setCountdown] = useState(120);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState(successMessage);
  const [retryCount, setRetryCount] = useState(0);
  const [isSandboxMode, setIsSandboxMode] = useState(false);
  const [isDatabaseOrder, setIsDatabaseOrder] = useState(false);
  const maxRetries = 3;

  // Calculate total from order data - NO TAX
  const total = orderData.total || 0;

  // Check if we're in sandbox mode and verify order data
  useEffect(() => {
    const checkEnvironment = async () => {
      try {
        const config = await mpesaService.getConfig();
        if (config.success && config.config?.env === 'sandbox') {
          setIsSandboxMode(true);
          setInfoMessage(prev => prev + ' 🔧 Sandbox Mode Active');
        }
      } catch (error) {
        console.log('Could not determine environment:', error);
      }
      
      // Check if order has REAL database ID
      if (orderData.orderId && typeof orderData.orderId === 'number') {
        setIsDatabaseOrder(true);
        console.log(`✅ REAL DATABASE ORDER ID: ${orderData.orderId}`);
        console.log(`   Order Number: ${orderData.orderNumber}`);
      } else {
        console.warn('⚠️ No real order ID found. Using fallback.');
        setIsDatabaseOrder(false);
      }
    };
    
    checkEnvironment();
    
    // Redirect if no order data
    if (!orderData || !orderData.customerInfo || !orderData.shippingAddress) {
      console.warn('Missing order data, redirecting to cart');
      navigate('/cart');
    }
  }, [orderData, navigate]);

  // Countdown for M-PESA prompt
  useEffect(() => {
    let interval;
    if (mpesaStatus.isPromptSent && countdown > 0 && paymentStatus === 'processing') {
      interval = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (countdown === 0 && paymentStatus === 'processing') {
      checkMpesaPaymentStatus();
      setPaymentStatus('failed');
      setErrorMessage('Payment prompt timed out. Please check your phone and try again.');
    }
    return () => clearInterval(interval);
  }, [mpesaStatus.isPromptSent, countdown, paymentStatus]);

  // Auto-check payment status every 10 seconds when prompt is sent
  useEffect(() => {
    let interval;
    if (mpesaStatus.isPromptSent && paymentStatus === 'processing' && !mpesaStatus.isCheckingStatus) {
      interval = setInterval(() => {
        checkMpesaPaymentStatus();
      }, 10000);
    }
    return () => clearInterval(interval);
  }, [mpesaStatus.isPromptSent, paymentStatus, mpesaStatus.isCheckingStatus]);

  const generateTransactionId = () => {
    return `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`;
  };

  const handlePayment = async () => {
    if (!paymentMethod) {
      setErrorMessage('Please select a payment method');
      return;
    }

    // Validate M-PESA options
    if (paymentMethod === 'mpesa') {
      if (mpesaOption === 'stk' && !paymentPhone) {
        setErrorMessage('Please enter your phone number for M-PESA prompt');
        return;
      }
      if (mpesaOption === 'stk' && !mpesaService.validatePhoneNumber(paymentPhone)) {
        setErrorMessage('Please enter a valid Kenyan phone number (e.g., 0712345678 or 254712345678)');
        return;
      }
    }

    setIsProcessing(true);
    setPaymentStatus('processing');
    setErrorMessage('');
    setInfoMessage('');
    
    const txId = generateTransactionId();
    setTransactionId(txId);

    try {
      switch (paymentMethod) {
        case 'mpesa':
          if (mpesaOption === 'stk') {
            await processMpesaSTKPayment(txId);
          } else if (mpesaOption === 'buygoods') {
            await processMpesaBuyGoods(txId);
          }
          break;
        case 'card':
          await processCardPayment(txId);
          break;
        default:
          throw new Error('Invalid payment method');
      }
    } catch (error) {
      console.error('Payment failed:', error);
      setPaymentStatus('failed');
      setErrorMessage(error.message || 'Payment failed. Please try again.');
      setIsProcessing(false);
    }
  };

  const processMpesaSTKPayment = async (txId) => {
    // Use the payment phone entered by user, not checkout phone
    if (!paymentPhone) {
      throw new Error('Phone number is required for M-PESA STK Push');
    }

    // Validate phone number
    if (!mpesaService.validatePhoneNumber(paymentPhone)) {
      throw new Error('Please enter a valid Kenyan phone number (e.g., 0712345678 or 254712345678)');
    }

    // =============================================
    // CRITICAL: USE REAL DATABASE ORDER ID
    // =============================================
    let orderId;
    
    if (isDatabaseOrder && orderData.orderId) {
      // Use REAL database order ID
      orderId = orderData.orderId;
      console.log(`🎯 Using REAL database Order ID: ${orderId}`);
      console.log(`   Order Number: ${orderData.orderNumber}`);
    } else {
      // Fallback (should not happen if checkout worked)
      console.warn('⚠️ No real order ID, using timestamp as fallback');
      orderId = `${Date.now()}`;
      setInfoMessage('⚠️ Using fallback order ID. Payment may not link to order.');
    }

    // Show sandbox info
    if (isSandboxMode) {
      setInfoMessage('🔧 Sandbox Mode: Payment will be automatically simulated. Test PIN: 174379');
    }

    let result;
    if (isSandboxMode) {
      console.log('🔧 Using sandbox test payment');
      result = await mpesaService.testPayment(
        paymentPhone, // Use user's entered phone
        total,
        orderId,
        orderData.orderNumber || orderId
      );
    } else {
      console.log('🚀 Initiating REAL M-PESA STK Push');
      result = await mpesaService.initiateSTKPush(
        paymentPhone, // Use user's entered phone
        total,
        orderId
      );
    }

    if (!result.success) {
      throw new Error(result.error || 'Failed to initiate M-PESA payment');
    }

    // Update M-PESA status
    setMpesaStatus(prev => ({
      ...prev,
      checkoutRequestID: result.checkoutRequestID,
      merchantRequestID: result.merchantRequestID,
      isPromptSent: true,
      resultDesc: result.customerMessage || result.message
    }));

    // Show additional info
    if (result.env === 'sandbox' && result.note) {
      setInfoMessage(result.note);
    }

    // Store order info for reference
    localStorage.setItem('current_order_id', orderId);
    localStorage.setItem('current_order_number', orderData.orderNumber || orderId);

    // Start countdown
    setCountdown(120);
    
    // Start checking status
    setTimeout(() => {
      checkMpesaPaymentStatus();
    }, 5000);
  };

  const processMpesaBuyGoods = async (txId) => {
    // For Buy Goods, we don't need to make an API call - just show instructions
    // User will pay directly via their M-PESA app
    console.log('🛒 M-PESA Buy Goods selected');
    console.log(`   Till Number: ${tillNumber}`);
    console.log(`   Amount: KSh ${total}`);
    
    // Show instructions for Buy Goods payment
    setInfoMessage(`💡 Pay via M-PESA Buy Goods:
1. Go to M-PESA on your phone
2. Select "Lipa na M-PESA"
3. Select "Buy Goods and Services"
4. Enter Till Number: ${tillNumber}
5. Enter Amount: KSh ${total.toLocaleString()}
6. Enter your M-PESA PIN
7. You'll receive a confirmation SMS`);
    
    // Simulate successful payment (in real scenario, you'd need webhooks to confirm)
    // For now, we'll simulate a successful payment after a delay
    setTimeout(() => {
      setPaymentStatus('success');
      setIsProcessing(false);
      completeOrder(txId);
    }, 5000);
  };

  const processCardPayment = async (txId) => {
    await new Promise(resolve => setTimeout(resolve, 3000));
    setPaymentStatus('success');
    setIsProcessing(false);
    completeOrder(txId);
  };

  const checkMpesaPaymentStatus = async () => {
    if (!mpesaStatus.checkoutRequestID || mpesaStatus.isCheckingStatus) {
      return;
    }
  
    setMpesaStatus(prev => ({ ...prev, isCheckingStatus: true }));
  
    try {
      // Try the M-Pesa query first
      const result = await mpesaService.checkPaymentStatus(mpesaStatus.checkoutRequestID);
  
      setMpesaStatus(prev => ({
        ...prev,
        lastCheck: new Date().toISOString(),
        resultCode: result.resultCode,
        resultDesc: result.resultDesc,
        isCheckingStatus: false
      }));
  
      const statusInfo = mpesaService.interpretResultCode(result.resultCode);
  
      if (result.success && result.resultCode === '0') {
        // Payment successful via M-Pesa query
        handlePaymentSuccess(result.data);
      } else if (result.resultCode === '1037' || result.resultCode === '1032') {
        // Keep waiting
        console.log(`⏳ Payment status: ${statusInfo.message}`);
        
        if (result.resultCode === '1037') {
          setMpesaStatus(prev => ({
            ...prev,
            resultDesc: 'Waiting for you to enter your M-PESA PIN...'
          }));
        }
      } else {
        // M-Pesa query says failed, but check our database to be sure
        await checkDatabaseForPayment();
      }
    } catch (error) {
      console.error('M-Pesa query failed, checking database directly:', error);
      // M-Pesa query failed, check our database
      await checkDatabaseForPayment();
    }
  };
  
  // New helper function to check database payment status
  const checkDatabaseForPayment = async () => {
    try {
      // Get the real order ID from orderData
      const realOrderId = orderData.orderId;
      
      if (!realOrderId) {
        console.error('No order ID found for database check');
        setPaymentStatus('failed');
        setErrorMessage('Cannot verify payment. Missing order information.');
        setIsProcessing(false);
        setMpesaStatus(prev => ({ ...prev, isCheckingStatus: false }));
        return;
      }
      
      console.log(`🔍 Checking database for order payment status: ${realOrderId}`);
      
      // Use the imported checkOrderPaymentStatus function
      const statusResult = await checkOrderPaymentStatus(realOrderId);
      
      console.log('📊 Database check result:', statusResult);
      
      if (statusResult.success && statusResult.paid) {
        // Payment is confirmed in our database!
        handlePaymentSuccess({
          MpesaReceiptNumber: statusResult.payment?.receipt || 'DB_CONFIRMED',
          Amount: statusResult.payment?.amount || total,
          PhoneNumber: statusResult.payment?.phone || paymentPhone,
          orderId: realOrderId,
          orderNumber: statusResult.order_number
        });
      } else {
        // Not paid in database either
        setPaymentStatus('failed');
        setErrorMessage('Payment not confirmed. Please try again.');
        setIsProcessing(false);
        setMpesaStatus(prev => ({ ...prev, isCheckingStatus: false }));
      }
    } catch (dbError) {
      console.error('Database check also failed:', dbError);
      setPaymentStatus('failed');
      setErrorMessage('Unable to verify payment. Please contact support.');
      setIsProcessing(false);
      setMpesaStatus(prev => ({ ...prev, isCheckingStatus: false }));
    }
  };
  
  // Extract success handling to a separate function
  const handlePaymentSuccess = (paymentData) => {
    setPaymentStatus('success');
    setIsProcessing(false);
    const txId = generateTransactionId();
    setTransactionId(txId);
    setInfoMessage('✅ Payment successful! Processing your order...');
    completeOrder(txId, paymentData);
    
    setMpesaStatus(prev => ({ ...prev, isCheckingStatus: false }));
  };

  const completeOrder = (txId, mpesaData = null) => {
    // Clear cart
    clearCart();
    
    // Get current order info
    const orderId = localStorage.getItem('current_order_id') || orderData.orderId || `ORD-${Date.now()}`;
    const orderNumber = localStorage.getItem('current_order_number') || orderData.orderNumber || orderId;
    
    // Create order object
    const order = {
      id: orderId,
      orderNumber: orderNumber,
      transactionId: txId,
      paymentMethod: paymentMethod === 'mpesa' ? `mpesa_${mpesaOption}` : paymentMethod,
      status: 'paid',
      amount: total,
      items: orderData.cartItems || [],
      customerInfo: orderData.customerInfo,
      shippingAddress: orderData.shippingAddress,
      realOrderId: isDatabaseOrder ? orderData.orderId : null,
      mpesaDetails: mpesaStatus.checkoutRequestID ? {
        checkoutRequestID: mpesaStatus.checkoutRequestID,
        merchantRequestID: mpesaStatus.merchantRequestID,
        resultCode: mpesaStatus.resultCode,
        resultDesc: mpesaStatus.resultDesc,
        ...mpesaData
      } : null,
      paymentPhone: paymentPhone,
      tillNumber: mpesaOption === 'buygoods' ? tillNumber : null,
      createdAt: new Date().toISOString(),
    };
    
    // Save to localStorage for user history
    const existingOrders = JSON.parse(localStorage.getItem('hnj_orders') || '[]');
    existingOrders.push(order);
    localStorage.setItem('hnj_orders', JSON.stringify(existingOrders));
    
    // Navigate to success page
    setTimeout(() => {
      navigate('/payment-success', { 
        state: { 
          orderId: order.id,
          orderNumber: order.orderNumber,
          transactionId: txId,
          paymentMethod: paymentMethod === 'mpesa' ? `M-PESA (${mpesaOption === 'stk' ? 'STK Push' : 'Buy Goods'})` : 'Card',
          amount: total,
          customerInfo: orderData.customerInfo,
          mpesaDetails: order.mpesaDetails,
          paymentPhone: paymentPhone,
          tillNumber: mpesaOption === 'buygoods' ? tillNumber : null,
          isDatabaseOrder: isDatabaseOrder,
          realOrderId: orderData.orderId
        }
      });
    }, 1500);
  };

  const retryPayment = () => {
    if (retryCount >= maxRetries) {
      setErrorMessage('Maximum retry attempts reached. Please try a different payment method.');
      return;
    }

    setPaymentStatus('pending');
    setMpesaStatus({
      checkoutRequestID: '',
      merchantRequestID: '',
      isPromptSent: false,
      isCheckingStatus: false,
      lastCheck: null,
      resultCode: null,
      resultDesc: ''
    });
    setCountdown(120);
    setErrorMessage('');
    setInfoMessage('');
    setRetryCount(prev => prev + 1);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleBackToCheckout = () => {
    navigate('/checkout', { state: { orderData } });
  };

  const handleResendPrompt = async () => {
    if (mpesaStatus.isPromptSent && retryCount < maxRetries) {
      await checkMpesaPaymentStatus();
    }
  };

  // Loading state while checking order data
  if (!orderData.customerInfo) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="text-4xl text-red-600 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900">Loading order data...</h2>
        </div>
      </div>
    );
  }

  if (paymentStatus === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <div className="mb-6">
                <FaSpinner className="text-4xl text-green-500 animate-spin mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Processing Your Payment</h1>
                <p className="text-gray-600">Completing your order...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (paymentStatus === 'failed') {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <div className="mb-6">
                <FaTimesCircle className="text-6xl text-red-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h1>
                <p className="text-gray-600 mb-4">{errorMessage}</p>
                
                {mpesaStatus.resultDesc && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <p className="text-red-700 text-sm">{mpesaStatus.resultDesc}</p>
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                {retryCount < maxRetries ? (
                  <button
                    onClick={retryPayment}
                    className="w-full py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <FaRedo /> Try Payment Again ({maxRetries - retryCount} attempts left)
                  </button>
                ) : (
                  <div className="text-red-600 font-semibold mb-4">
                    Maximum retry attempts reached
                  </div>
                )}
                
                <button
                  onClick={handleBackToCheckout}
                  className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg font-bold hover:bg-gray-50 transition-colors"
                >
                  Back to Checkout
                </button>
                
                <Link
                  to="/cart"
                  className="inline-block w-full py-3 border border-gray-300 text-gray-700 rounded-lg font-bold hover:bg-gray-50 transition-colors"
                >
                  Back to Cart
                </Link>
              </div>
              
              <div className="mt-6 pt-6 border-t">
                <p className="text-gray-500 text-sm">
                  Need help? Call us at <span className="font-semibold">0712 345 678</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Complete Payment</h1>
          <button
            onClick={handleBackToCheckout}
            className="inline-flex items-center gap-2 text-red-600 hover:text-red-800"
          >
            <FaArrowLeft /> Back to Checkout
          </button>
        </div>
        
        {/* Order Info Banner */}
        {isDatabaseOrder ? (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <FaDatabase className="text-green-600" />
              <span className="font-semibold text-green-800">Order Created in Database ✓</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div className="text-green-700">
                <span className="font-medium">Order ID:</span> {orderData.orderId}
              </div>
              <div className="text-green-700">
                <span className="font-medium">Order Number:</span> {orderData.orderNumber || 'N/A'}
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <FaExclamationTriangle className="text-yellow-600" />
              <span className="font-semibold text-yellow-800">Test Order</span>
            </div>
            <p className="text-yellow-700 text-sm">
              Using test order ID. For real orders, please go through checkout.
            </p>
          </div>
        )}
        
        {/* Sandbox Mode Banner */}
        {isSandboxMode && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <FaStore className="text-blue-600" />
              <span className="font-semibold text-blue-800">Sandbox Testing Mode</span>
            </div>
            <p className="text-blue-700 text-sm">
              💡 <strong>Test Phone:</strong> 254708374149 | <strong>Test PIN:</strong> 174379
            </p>
            <p className="text-blue-700 text-sm">
              Payments are automatically simulated. No actual M-PESA transactions occur.
            </p>
          </div>
        )}
        
        {/* Info Message */}
        {infoMessage && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 text-blue-700">
              <FaInfoCircle />
              <span>{infoMessage}</span>
            </div>
          </div>
        )}
        
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column - Payment Methods */}
          <div className="lg:w-2/3">
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <FaLock /> Select Payment Method
              </h2>
              
              <div className="space-y-4">
                {/* M-PESA Option */}
                <div className={`p-4 border-2 rounded-lg transition-all ${
                  paymentMethod === 'mpesa' ? 'border-green-500 bg-green-50' : 'border-gray-300'
                }`}>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="mpesa"
                      checked={paymentMethod === 'mpesa'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="text-green-600 mr-3"
                      disabled={isProcessing}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <FaMobileAlt className="text-green-600 text-xl" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">M-PESA</div>
                          <p className="text-gray-600 text-sm">Pay via M-PESA</p>
                        </div>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="w-12 h-8 bg-green-100 rounded flex items-center justify-center">
                        <span className="text-xs font-bold text-green-700">MPESA</span>
                      </div>
                    </div>
                  </label>
                  
                  {/* M-PESA Options Dropdown (only shown when M-PESA is selected) */}
                  {paymentMethod === 'mpesa' && (
                    <div className="mt-4 ml-10 pl-4 border-l-2 border-green-200">
                      <div className="mb-3">
                        <label className="block text-gray-700 mb-2 font-medium">Select M-PESA Option</label>
                        <div className="relative">
                          <select
                            value={mpesaOption}
                            onChange={(e) => {
                              setMpesaOption(e.target.value);
                              setPaymentPhone('');
                              setMpesaStatus({
                                checkoutRequestID: '',
                                merchantRequestID: '',
                                isPromptSent: false,
                                isCheckingStatus: false,
                                lastCheck: null,
                                resultCode: null,
                                resultDesc: ''
                              });
                            }}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none bg-white pr-10"
                            disabled={isProcessing}
                          >
                            <option value="stk">STK Push (Receive prompt on phone)</option>
                            <option value="buygoods">Lipa na M-PESA Buy Goods (Pay via Till)</option>
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                            <FaCaretDown />
                          </div>
                        </div>
                      </div>
                      
                      {/* STK Push Phone Input */}
                      {mpesaOption === 'stk' && (
                        <div className="mb-4">
                          <label className="block text-gray-700 mb-2 font-medium">
                            Phone Number for M-PESA Prompt *
                          </label>
                          <div className="relative">
                            <FaPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                              type="tel"
                              value={paymentPhone}
                              onChange={(e) => setPaymentPhone(e.target.value)}
                              placeholder="0712 345 678"
                              className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                              disabled={isProcessing}
                            />
                          </div>
                          <p className="text-gray-500 text-sm mt-1">
                            Enter the phone number that will receive the M-PESA prompt
                          </p>
                          {paymentPhone && !mpesaService.validatePhoneNumber(paymentPhone) && (
                            <p className="text-red-500 text-sm mt-1">
                              Please enter a valid Kenyan phone number
                            </p>
                          )}
                        </div>
                      )}
                      
                      {/* Buy Goods Till Number Display */}
                      {mpesaOption === 'buygoods' && (
                        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-3">
                            <FaShoppingCart className="text-yellow-600" />
                            <h3 className="font-semibold text-gray-900">Pay via Buy Goods</h3>
                          </div>
                          
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-700">Till Number:</span>
                              <span className="font-bold text-xl text-green-600">{tillNumber}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-700">Amount to Pay:</span>
                              <span className="font-bold text-green-600">KSh {total.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-700">Account Name:</span>
                              <span className="font-semibold text-gray-900">HNJ STORE</span>
                            </div>
                          </div>
                          
                          <div className="mt-4 p-3 bg-white border border-yellow-300 rounded">
                            <h4 className="font-semibold text-gray-900 mb-2">Instructions:</h4>
                            <ol className="text-sm text-gray-600 space-y-1">
                              <li className="flex items-start">
                                <span className="font-bold mr-2">1.</span>
                                <span>Go to M-PESA on your phone</span>
                              </li>
                              <li className="flex items-start">
                                <span className="font-bold mr-2">2.</span>
                                <span>Select "Lipa na M-PESA"</span>
                              </li>
                              <li className="flex items-start">
                                <span className="font-bold mr-2">3.</span>
                                <span>Select "Buy Goods and Services"</span>
                              </li>
                              <li className="flex items-start">
                                <span className="font-bold mr-2">4.</span>
                                <span>Enter Till Number: <strong>{tillNumber}</strong></span>
                              </li>
                              <li className="flex items-start">
                                <span className="font-bold mr-2">5.</span>
                                <span>Enter Amount: <strong>KSh {total.toLocaleString()}</strong></span>
                              </li>
                              <li className="flex items-start">
                                <span className="font-bold mr-2">6.</span>
                                <span>Enter your M-PESA PIN</span>
                              </li>
                              <li className="flex items-start">
                                <span className="font-bold mr-2">7.</span>
                                <span>You'll receive a confirmation SMS</span>
                              </li>
                            </ol>
                          </div>
                          
                          <p className="text-gray-600 text-sm mt-3">
                            💡 <strong>Note:</strong> Please send payment from the same phone number you used at checkout
                            so we can match your payment with your order.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Card Option */}
                <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  paymentMethod === 'card' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                }`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="card"
                    checked={paymentMethod === 'card'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="text-blue-600 mr-3"
                    disabled={isProcessing}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FaCreditCard className="text-blue-600 text-xl" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">Credit/Debit Card</div>
                        <p className="text-gray-600 text-sm">Pay securely with your card</p>
                      </div>
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="w-12 h-8 bg-blue-50 rounded flex items-center justify-center">
                      <span className="text-xs font-bold text-blue-700">VISA</span>
                    </div>
                  </div>
                </label>
              </div>
              
              {/* Error Message */}
              {errorMessage && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 text-red-700">
                    <FaTimesCircle />
                    <span className="font-medium">{errorMessage}</span>
                  </div>
                </div>
              )}
              
              {/* M-PESA Prompt Status (for STK Push) */}
              {mpesaStatus.isPromptSent && paymentMethod === 'mpesa' && mpesaOption === 'stk' && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <FaMobileAlt className="text-green-600 text-xl" />
                    <div>
                      <h3 className="font-bold text-gray-900">M-PESA Prompt Sent ✓</h3>
                      <p className="text-gray-600 text-sm">Check your phone to complete payment</p>
                      
                      {/* Order Info */}
                      {isDatabaseOrder && (
                        <div className="mt-2 p-2 bg-green-100 border border-green-200 rounded">
                          <div className="flex items-center gap-2 text-green-700 text-sm">
                            <FaDatabase />
                            <span className="font-medium">Order #{orderData.orderNumber}</span>
                          </div>
                        </div>
                      )}
                      
                      {/* Sandbox testing info */}
                      {isSandboxMode && (
                        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                          <div className="flex items-center gap-2 text-blue-700 text-sm">
                            <FaStore />
                            <span className="font-medium">Simulation in Progress</span>
                          </div>
                          <p className="text-blue-600 text-xs mt-1">
                            Payment will be automatically completed in a few seconds...
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Phone Number:</span>
                      <span className="font-semibold">{paymentPhone}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Amount:</span>
                      <span className="font-bold text-green-600">KSh {total.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Order ID:</span>
                      <span className="font-mono text-sm text-gray-900">
                        {isDatabaseOrder ? `#${orderData.orderId}` : orderData.orderId}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Time remaining:</span>
                      <span className={`font-bold ${countdown < 30 ? 'text-red-600' : 'text-gray-900'}`}>
                        {formatTime(countdown)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Status:</span>
                      <span className="font-medium text-blue-600">
                        {mpesaStatus.isCheckingStatus ? 'Checking...' : 'Waiting for confirmation'}
                      </span>
                    </div>
                    {mpesaStatus.resultCode && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">Last Result:</span>
                        <span className="text-sm text-gray-600">{mpesaStatus.resultCode} - {mpesaStatus.resultDesc}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={checkMpesaPaymentStatus}
                      disabled={mpesaStatus.isCheckingStatus}
                      className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {mpesaStatus.isCheckingStatus ? (
                        <>
                          <FaSpinner className="animate-spin" /> Checking...
                        </>
                      ) : (
                        <>
                          <FaRedo /> Check Status
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleResendPrompt}
                      disabled={mpesaStatus.isCheckingStatus || retryCount >= maxRetries}
                      className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Refresh Status
                    </button>
                  </div>
                </div>
              )}
              
              {/* Payment Instructions */}
              <div className="mt-6 pt-6 border-t">
                <h3 className="font-semibold text-gray-900 mb-3">Payment Instructions</h3>
                {paymentMethod === 'mpesa' && mpesaOption === 'stk' && (
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li className="flex items-start">
                      <span className="text-green-600 mr-2">1.</span>
                      <span>Enter your M-PESA PIN when prompted on your phone</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-600 mr-2">2.</span>
                      <span>You'll receive a confirmation SMS from M-PESA</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-600 mr-2">3.</span>
                      <span>Payment will be automatically recorded against your order</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-600 mr-2">4.</span>
                      <span>Your order status will update to "Paid" in our system</span>
                    </li>
                  </ul>
                )}
                {paymentMethod === 'mpesa' && mpesaOption === 'buygoods' && (
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li className="flex items-start">
                      <span className="text-green-600 mr-2">1.</span>
                      <span>Pay via M-PESA Buy Goods using Till Number: {tillNumber}</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-600 mr-2">2.</span>
                      <span>Enter Amount: KSh {total.toLocaleString()}</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-600 mr-2">3.</span>
                      <span>After payment, our system will verify and update your order status</span>
                    </li>
                  </ul>
                )}
                {paymentMethod === 'card' && (
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li className="flex items-start">
                      <span className="text-blue-600 mr-2">1.</span>
                      <span>You'll be redirected to a secure payment page</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-600 mr-2">2.</span>
                      <span>Enter your card details</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-600 mr-2">3.</span>
                      <span>Complete 3D Secure authentication if required</span>
                    </li>
                  </ul>
                )}
              </div>
            </div>
            
            {/* Security Assurance */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center gap-3 mb-4">
                <FaShieldAlt className="text-2xl text-green-600" />
                <h3 className="font-bold text-gray-900">Secure Payment</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4">
                  <div className="text-2xl text-green-600 mb-2">🔒</div>
                  <p className="text-sm font-medium text-gray-900">SSL Encrypted</p>
                  <p className="text-xs text-gray-600">Bank-level security</p>
                </div>
                <div className="text-center p-4">
                  <div className="text-2xl text-green-600 mb-2">✓</div>
                  <p className="text-sm font-medium text-gray-900">PCI Compliant</p>
                  <p className="text-xs text-gray-600">Card data protected</p>
                </div>
                <div className="text-center p-4">
                  <div className="text-2xl text-green-600 mb-2">🛡️</div>
                  <p className="text-sm font-medium text-gray-900">Safe & Secure</p>
                  <p className="text-xs text-gray-600">Your data is protected</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Column - Order Summary */}
          <div className="lg:w-1/3">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <h2 className="text-xl font-bold text-gray-900 mb-6 pb-4 border-b">Payment Summary</h2>
              
              {/* Order Totals - SIMPLIFIED (NO TAX/VAT) */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center pt-2 border-t">
                  <div>
                    <span className="text-lg font-bold text-gray-900">Total to Pay Now</span>
                    <p className="text-gray-500 text-sm mt-1">
                      <span className="text-yellow-600 font-semibold">
                        Paid differently depending on location and means
                      </span>
                    </p>
                  </div>
                  <span className="text-2xl font-bold text-red-600">
                    KSh {total.toLocaleString()}
                  </span>
                </div>
              </div>
              
              {/* Order Details */}
              <div className="mt-6 pt-6 border-t">
                <h3 className="font-semibold text-gray-900 mb-3">Order Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order ID:</span>
                    <span className="font-mono font-medium text-gray-900">
                      {isDatabaseOrder ? `#${orderData.orderId}` : 'Test Order'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order Status:</span>
                    <span className="font-medium text-yellow-600">Pending Payment</span>
                  </div>
                  {orderData.orderNumber && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Order Number:</span>
                      <span className="font-medium text-gray-900">{orderData.orderNumber}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Created:</span>
                    <span className="font-medium text-gray-900">
                      {new Date(orderData.createdAt || Date.now()).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Customer Info */}
              <div className="mt-6 pt-6 border-t">
                <h3 className="font-semibold text-gray-900 mb-3">Customer Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium text-gray-900">
                      {orderData.customerInfo?.firstName} {orderData.customerInfo?.lastName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phone:</span>
                    <span className="font-medium text-gray-900">
                      {orderData.customerInfo?.phone}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Delivery to:</span>
                    <span className="font-medium text-gray-900 text-right">
                      {orderData.shippingAddress?.city}, {orderData.shippingAddress?.county}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Terms */}
              <div className="mt-6 pt-6 border-t">
                <p className="text-gray-500 text-sm">
                  By clicking "Complete Payment", you agree to our{' '}
                  <Link to="/terms" className="text-red-600 hover:text-red-800">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="text-red-600 hover:text-red-800">
                    Privacy Policy
                  </Link>
                </p>
              </div>
              
              {/* Payment Button */}
              <div className="mt-6">
                <button
                  onClick={handlePayment}
                  disabled={isProcessing || 
                    (paymentMethod === 'mpesa' && mpesaStatus.isPromptSent && mpesaOption === 'stk') ||
                    (paymentMethod === 'mpesa' && mpesaOption === 'stk' && !paymentPhone)
                  }
                  className={`w-full py-4 rounded-lg font-bold text-white flex items-center justify-center gap-2 ${
                    isProcessing || 
                    (paymentMethod === 'mpesa' && mpesaStatus.isPromptSent && mpesaOption === 'stk') ||
                    (paymentMethod === 'mpesa' && mpesaOption === 'stk' && !paymentPhone)
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <FaSpinner className="animate-spin" /> Processing...
                    </>
                  ) : mpesaStatus.isPromptSent && mpesaOption === 'stk' ? (
                    <>
                      <FaClock /> Waiting for M-PESA...
                    </>
                  ) : paymentMethod === 'mpesa' && mpesaOption === 'buygoods' ? (
                    <>
                      <FaShoppingCart /> Pay via Buy Goods
                    </>
                  ) : (
                    <>
                      <FaLock /> Complete Payment • KSh {total.toLocaleString()}
                    </>
                  )}
                </button>
                
                {mpesaStatus.isPromptSent && mpesaOption === 'stk' && (
                  <p className="text-gray-500 text-sm mt-3 text-center">
                    Waiting for you to accept the M-PESA prompt on your phone
                  </p>
                )}
                
                <button
                  onClick={handleBackToCheckout}
                  className="block text-center text-gray-600 hover:text-gray-800 text-sm mt-4 w-full"
                >
                  Need to change something? Go back
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;