const User = require('../models/User');
const Otp = require('../models/Otp');
const jwt = require('jsonwebtoken');

// Generates and "sends" (console logs) a 6-digit OTP for a phone number
const sendOtp = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    // Generate a random 6-digit code, e.g. "483920"
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // OTP valid for 5 minutes
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Save this OTP attempt (we don't delete old ones yet — MVP simplicity)
    await Otp.create({ phone, otp: otpCode, expiresAt });

    // MOCK: print instead of sending real SMS
    console.log(`OTP for ${phone}: ${otpCode}`);

    res.status(200).json({
      message: 'OTP sent successfully',
      // Only include this in development so you can test without checking console
      devOtp: otpCode
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to send OTP', error: error.message });
  }
};

// Verifies the OTP, creates the user if new, returns a JWT
const verifyOtp = async (req, res) => {
  try {
    const { phone, otp, name } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ message: 'Phone and OTP are required' });
    }

    // Find the most recent OTP for this phone
    const otpRecord = await Otp.findOne({ phone }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).json({ message: 'No OTP found, please request again' });
    }

    if (otpRecord.otp !== otp) {
      return res.status(400).json({ message: 'Incorrect OTP' });
    }

    if (otpRecord.expiresAt < new Date()) {
      return res.status(400).json({ message: 'OTP expired, please request again' });
    }

    // Find existing user, or create a new one
    let user = await User.findOne({ phone });

    if (!user) {
      user = await User.create({
        phone,
        name: name || 'New User',
        isPhoneVerified: true
      });
    } else if (!user.isPhoneVerified) {
      user.isPhoneVerified = true;
      await user.save();
    }

    // Clean up used OTP
    await Otp.deleteMany({ phone });

    // Issue JWT — this is what the app will send on every future request
    const token = jwt.sign(
      { userId: user._id, phone: user.phone },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user
    });
  } catch (error) {
    res.status(500).json({ message: 'Verification failed', error: error.message });
  }
};

module.exports = { sendOtp, verifyOtp };
