const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const Log = require('../models/Log');

const router = express.Router();

// Strong password: 8+ chars, uppercase, lowercase, number, special char
const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

async function saveLog(userId, inputString, result) {
  try {
    await Log.create({ userId: userId || null, inputString, result });
  } catch (error) {
    console.error('Log save error:', error.message);
  }
}

router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      await saveLog(null, 'REGISTER', 'Failed: Email and password are required');
      return res.status(400).json({ message: 'Email and password are required' });
    }

    if (!strongPasswordRegex.test(password)) {
      await saveLog(null, 'REGISTER', 'Failed: Weak password');
      return res.status(400).json({
        message:
          'Password must be 8+ chars and include uppercase, lowercase, number, and special character',
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      await saveLog(existingUser._id, 'REGISTER', 'Failed: User already exists');
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      email: email.toLowerCase(),
      password: hashedPassword,
      isVerified: false,
    });

    await newUser.save();
    await saveLog(newUser._id, 'REGISTER', 'Success: User registered');
    console.log(`[REGISTER] User created: ${newUser.email}`);

    return res.status(201).json({ message: 'Registration successful. Please login.' });
  } catch (error) {
    console.error('Register error:', error.message);
    await saveLog(null, 'REGISTER', `Failed: ${error.message}`);
    return res.status(500).json({ message: 'Server error during registration' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log(`[LOGIN] Attempt for email: ${email || 'N/A'}`);

    if (!email || !password) {
      console.log('[LOGIN] Failed: Missing email or password');
      await saveLog(null, 'LOGIN_ATTEMPT', 'Failed: Missing email or password');
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      console.log(`[LOGIN] Failed: User not found for email: ${email.toLowerCase()}`);
      await saveLog(null, 'LOGIN_ATTEMPT', `Failed: User not found (${email.toLowerCase()})`);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log(`[LOGIN] Failed: Incorrect password for email: ${user.email}`);
      await saveLog(user._id, 'LOGIN_ATTEMPT', 'Failed: Invalid credentials');
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    console.log(`[LOGIN] Credentials valid for email: ${user.email}`);
    console.log(`[OTP] Generating OTP for email: ${user.email}`);

    // Generate 6-digit OTP and set 5 minute expiry
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    // For lab/demo purpose, print OTP in server console
    console.log(`OTP for ${user.email}: ${otp}`);
    console.log(`[OTP] Saved for email: ${user.email}. Expires at: ${otpExpiry.toISOString()}`);
    await saveLog(user._id, 'LOGIN_ATTEMPT', 'Success: OTP generated');

    return res.json({ message: 'OTP generated. Please verify OTP to complete login.' });
  } catch (error) {
    console.error('Login error:', error.message);
    await saveLog(null, 'LOGIN_ATTEMPT', `Failed: ${error.message}`);
    return res.status(500).json({ message: 'Server error during login' });
  }
});

router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    if (!user.otp || !user.otpExpiry) {
      return res.status(400).json({ message: 'No OTP found. Please login again.' });
    }

    if (new Date() > user.otpExpiry) {
      user.otp = null;
      user.otpExpiry = null;
      await user.save();
      return res.status(400).json({ message: 'OTP expired. Please login again.' });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    user.isVerified = true;
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    return res.json({
      message: 'OTP verified. Login successful.',
      userId: user._id,
      email: user.email,
    });
  } catch (error) {
    console.error('OTP verify error:', error.message);
    return res.status(500).json({ message: 'Server error during OTP verification' });
  }
});

module.exports = router;
