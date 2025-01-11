const otpStore = new Map();

exports.sendOTP = (phone) => {
  const otp = "1234"; // Replace with random OTP generation logic
  otpStore.set(phone, otp); // Store OTP temporarily
  console.log(`OTP sent to ${phone}: ${otp}`);
  return otp; // For testing purposes only
};

exports.verifyOTP = (phone, otp) => {
  const storedOTP = otpStore.get(phone);
  if (storedOTP === otp) {
    otpStore.delete(phone); // OTP is one-time use
    return true;
  }
  return false;
};
