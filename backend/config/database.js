/**
 * MongoDB Database Configuration
 */

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const options = {
      // useNewUrlParser: true, // deprecated in Mongoose 6+
      // useUnifiedTopology: true, // deprecated in Mongoose 6+
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    const conn = await mongoose.connect(process.env.MONGODB_URI, options);

    console.log(`
    ╔═══════════════════════════════════════╗
    ║   MongoDB Connected Successfully     ║
    ╠═══════════════════════════════════════╣
    ║   Host: ${conn.connection.host.padEnd(28)}║
    ║   Database: ${conn.connection.name.padEnd(24)}║
    ╚═══════════════════════════════════════╝
    `);

    // Connection event listeners
    mongoose.connection.on('connected', () => {
      console.log('✓ MongoDB connection established');
    });

    mongoose.connection.on('error', (err) => {
      console.error('✗ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('✗ MongoDB disconnected');
    });

  } catch (error) {
    console.error('✗ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
