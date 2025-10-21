const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { formatPhoneNumber } = require('../utils/otp.util');

// @desc    Create initial admin user (one-time setup)
// @route   POST /api/setup/create-admin
// @access  Public (but should be disabled after first use)
router.post('/create-admin', async (req, res) => {
  try {
    const formattedPhone = formatPhoneNumber('9876543210');

    // Check if user with formatted phone exists
    let existingUser = await User.findOne({ phone: formattedPhone });

    if (existingUser) {
      // Update to admin if not already
      if (existingUser.role === 'admin') {
        return res.status(400).json({
          success: false,
          message: 'Admin user already exists. Login at admin panel.',
        });
      }

      existingUser.role = 'admin';
      existingUser.password = 'admin123';
      existingUser.kycVerified = true;
      existingUser.kycStatus = 'verified';
      await existingUser.save();

      return res.json({
        success: true,
        message: 'Existing user updated to admin',
        data: {
          phone: '9876543210',
          role: 'admin',
        },
      });
    }

    // Delete any old admin with wrong phone format
    await User.deleteMany({ role: 'admin', phone: { $ne: formattedPhone } });

    // Create new admin user
    const admin = await User.create({
      name: 'Admin User',
      phone: formattedPhone,
      password: 'admin123',
      role: 'admin',
      kycVerified: true,
      kycStatus: 'verified',
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: 'Admin user created successfully',
      data: {
        phone: '9876543210',
        password: 'admin123',
        role: admin.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
