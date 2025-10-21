const express = require('express');
const router = express.Router();
const User = require('../models/User');

// @desc    Create initial admin user (one-time setup)
// @route   POST /api/setup/create-admin
// @access  Public (but should be disabled after first use)
router.post('/create-admin', async (req, res) => {
  try {
    // Check if any admin exists
    const adminExists = await User.findOne({ role: 'admin' });

    if (adminExists) {
      return res.status(400).json({
        success: false,
        message: 'Admin user already exists. This endpoint is disabled.',
      });
    }

    // Check if user with phone exists
    const existingUser = await User.findOne({ phone: '9876543210' });

    if (existingUser) {
      // Update existing user to admin
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

    // Create new admin user
    const admin = await User.create({
      name: 'Admin User',
      phone: '9876543210',
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
