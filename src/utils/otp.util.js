// OTP Utility for sending and verifying OTPs

// Generate random 6-digit OTP
exports.generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Get OTP expiry time
exports.getOTPExpiry = () => {
  const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES) || 10;
  return new Date(Date.now() + expiryMinutes * 60 * 1000);
};

// Send OTP via SMS
exports.sendOTP = async (phone, otp) => {
  // TODO: Integrate with SMS service (MSG91, Twilio, Fast2SMS)

  // For development, just log the OTP
  if (process.env.NODE_ENV === 'development') {
    console.log(`\n📱 OTP for ${phone}: ${otp}`);
    console.log(`⏰ Valid for ${process.env.OTP_EXPIRY_MINUTES || 10} minutes\n`);
    return true;
  }

  // Production SMS integration example (MSG91)
  /*
  try {
    const axios = require('axios');
    const response = await axios.post(
      process.env.SMS_API_URL,
      {
        authkey: process.env.SMS_API_KEY,
        mobile: phone,
        otp: otp,
        template_id: 'YOUR_TEMPLATE_ID',
      }
    );
    return response.data.type === 'success';
  } catch (error) {
    console.error('SMS sending failed:', error);
    throw new Error('Failed to send OTP');
  }
  */

  // For now, return true (OTP logged to console)
  return true;
};

// Verify OTP
exports.verifyOTP = (storedOTP, storedExpiry, providedOTP) => {
  // Check if OTP exists
  if (!storedOTP || !storedExpiry) {
    return { valid: false, message: 'OTP not found or expired' };
  }

  // Check if OTP has expired
  if (new Date() > new Date(storedExpiry)) {
    return { valid: false, message: 'OTP has expired' };
  }

  // Check if OTP matches
  if (storedOTP !== providedOTP) {
    return { valid: false, message: 'Invalid OTP' };
  }

  return { valid: true, message: 'OTP verified successfully' };
};

// Format phone number (remove spaces, add country code if needed)
exports.formatPhoneNumber = (phone) => {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');

  // If doesn't start with country code, add +91 (India)
  if (!cleaned.startsWith('91') && cleaned.length === 10) {
    cleaned = '91' + cleaned;
  }

  return '+' + cleaned;
};
