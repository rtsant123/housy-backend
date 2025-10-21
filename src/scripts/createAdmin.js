require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

// Create admin user
async function createAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ phone: '9876543210' });

    if (existingAdmin) {
      console.log('⚠️  Admin user already exists');

      // Update to ensure it has admin role
      existingAdmin.role = 'admin';
      existingAdmin.password = 'admin123';
      await existingAdmin.save();

      console.log('✅ Admin user updated successfully');
      console.log('📱 Phone: 9876543210');
      console.log('🔑 Password: admin123');
      console.log('👤 Role:', existingAdmin.role);
    } else {
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

      console.log('✅ Admin user created successfully');
      console.log('📱 Phone: 9876543210');
      console.log('🔑 Password: admin123');
      console.log('👤 Role:', admin.role);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    process.exit(1);
  }
}

createAdmin();
