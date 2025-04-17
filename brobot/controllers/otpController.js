const { auth } = require('../config/firebaseConfig');

async function sendOTP(req, res) {
  const { phoneNumber } = req.body;
  try {
    const session = await auth.createVerificationCode(phoneNumber);
    res.json({ session });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).send('Failed to send OTP');
  }
}

async function verifyOTP(req, res) {
  const { phoneNumber, code } = req.body;
  try {
    const result = await auth.verifyCode(phoneNumber, code);
    res.json({ message: 'User verified successfully', result });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).send('OTP verification failed');
  }
}

module.exports = { sendOTP, verifyOTP };
