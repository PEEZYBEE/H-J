// src/website/services/mpesaService.js
const API_BASE_URL = 'http://localhost:5000/api'; // Your backend URL

export const mpesaService = {
  // Validate phone number
  async validatePhone(phoneNumber) {
    try {
      const response = await fetch(`${API_BASE_URL}/mpesa/validate-phone`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: phoneNumber }),
      });

      if (!response.ok) {
        throw new Error('Failed to validate phone number');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error validating phone:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Get access token (via your backend)
  async getAccessToken() {
    try {
      const response = await fetch(`${API_BASE_URL}/mpesa/token`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to get access token');
      }
      
      const data = await response.json();
      return data.access_token;
    } catch (error) {
      console.error('Error getting access token:', error);
      throw error;
    }
  },

  // Initiate STK Push (Send payment prompt) - Simplified
  async initiateSTKPush(phoneNumber, amount, orderId) {
    try {
      // First validate phone
      const validation = await this.validatePhone(phoneNumber);
      if (!validation.success || !validation.valid) {
        return {
          success: false,
          error: 'Invalid phone number. Please use format: 07XXXXXXXX or 2547XXXXXXXX'
        };
      }

      const formattedPhone = validation.formatted || phoneNumber;

      const response = await fetch(`${API_BASE_URL}/mpesa/stkpush`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: formattedPhone,
          amount: Math.round(amount),
          order_id: orderId
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to initiate payment');
      }

      const data = await response.json();
      return {
        success: true,
        checkoutRequestID: data.checkout_request_id,
        merchantRequestID: data.merchant_request_id,
        customerMessage: data.message || 'Success. Request accepted for processing',
        responseCode: data.response_code,
        env: data.env,
        note: data.note || '',
        data: data
      };
    } catch (error) {
      console.error('Error initiating STK Push:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Check payment status - Simplified
  async checkPaymentStatus(checkoutRequestID) {
    try {
      const response = await fetch(`${API_BASE_URL}/mpesa/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          checkout_request_id: checkoutRequestID
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to check payment status');
      }

      const data = await response.json();
      return {
        success: true,
        resultCode: data.result_code,
        resultDesc: data.result_desc,
        checkoutRequestID: data.checkout_request_id,
        merchantRequestID: data.merchant_request_id,
        env: data.env,
        data: data
      };
    } catch (error) {
      console.error('Error checking payment status:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Test payment (for sandbox only)
  async testPayment(phoneNumber, amount, orderId) {
    try {
      const response = await fetch(`${API_BASE_URL}/mpesa/test-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: phoneNumber,
          amount: Math.round(amount),
          order_id: orderId
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to test payment');
      }

      const data = await response.json();
      return {
        success: true,
        checkoutRequestID: data.checkout_request_id,
        receiptNumber: data.receipt_number,
        orderId: data.order_id,
        message: data.message,
        env: data.env,
        simulated: data.simulated,
        note: data.note || '',
        data: data
      };
    } catch (error) {
      console.error('Error testing payment:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Get M-PESA configuration
  async getConfig() {
    try {
      const response = await fetch(`${API_BASE_URL}/mpesa/config`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get M-PESA config');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting config:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Test connection
  async testConnection() {
    try {
      const response = await fetch(`${API_BASE_URL}/mpesa/test-connection`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to test connection');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error testing connection:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Helper function to validate Kenyan phone number (client-side)
  validatePhoneNumber(phone) {
    // Remove any spaces or special characters
    const cleanedPhone = phone.replace(/\D/g, '');
    
    // Check length
    if (cleanedPhone.length !== 10 && cleanedPhone.length !== 12) {
      return false;
    }
    
    // Check if it starts with valid Kenyan prefixes
    const validPrefixes = ['07', '01', '2547', '2541'];
    const isValid = validPrefixes.some(prefix => cleanedPhone.startsWith(prefix));
    
    return isValid;
  },

  // Helper function to format phone number (client-side)
  formatPhoneNumber(phone) {
    let cleaned = phone.replace(/\D/g, '');
    
    // If it starts with 0, replace with 254
    if (cleaned.startsWith('0')) {
      cleaned = '254' + cleaned.substring(1);
    }
    
    // If it's 9 digits, add 254
    if (cleaned.length === 9) {
      cleaned = '254' + cleaned;
    }
    
    return cleaned;
  },

  // Helper to interpret result codes
  interpretResultCode(resultCode) {
    const codes = {
      '0': { 
        message: 'Payment completed successfully',
        status: 'success',
        shouldRetry: false
      },
      '1': { 
        message: 'Insufficient funds or transaction cancelled',
        status: 'failed',
        shouldRetry: true
      },
      '1032': { 
        message: 'Request cancelled by customer',
        status: 'cancelled',
        shouldRetry: true
      },
      '1037': { 
        message: 'Request timeout - no response from user',
        status: 'timeout',
        shouldRetry: true
      },
      '2001': { 
        message: 'Invalid amount',
        status: 'failed',
        shouldRetry: false
      }
    };

    return codes[resultCode] || { 
      message: 'Unknown error occurred',
      status: 'failed',
      shouldRetry: false
    };
  }
};

// Add this function to your mpesaService.jsx
export const checkOrderPaymentStatus = async (orderId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}/payment-status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error checking order payment status:', error);
    throw error;
  }
};