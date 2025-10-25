/**
 * MongoDB Connection Test Script
 * Run this to diagnose connection issues
 */

require('dotenv').config();
const mongoose = require('mongoose');

console.log('\n🔍 Testing MongoDB Connection...\n');

// Check if .env is loaded
if (!process.env.MONGODB_URI) {
  console.error('❌ ERROR: MONGODB_URI not found in .env file!');
  console.log('\n📝 Steps to fix:');
  console.log('1. Make sure .env file exists in the backend folder');
  console.log('2. Add MONGODB_URI=your-connection-string to .env');
  process.exit(1);
}

// Show connection string (hide password for security)
const hiddenUri = process.env.MONGODB_URI.replace(/:[^:@]*@/, ':****@');
console.log('📡 Connection String:', hiddenUri);
console.log('');

// Attempt connection
mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
})
  .then(() => {
    console.log('✅ SUCCESS! MongoDB connected!\n');
    console.log('📊 Connection Details:');
    console.log('   Database:', mongoose.connection.name);
    console.log('   Host:', mongoose.connection.host);
    console.log('   Port:', mongoose.connection.port);
    console.log('');
    console.log('🎉 Your MongoDB connection is working perfectly!');
    console.log('You can now run: npm run dev');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ CONNECTION FAILED!\n');
    console.error('Error Type:', error.name);
    console.error('Error Message:', error.message);
    console.error('');

    // Provide specific help based on error type
    if (error.name === 'MongooseServerSelectionError') {
      console.log('💡 This usually means:');
      console.log('   1. Network Access not configured in MongoDB Atlas');
      console.log('   2. Wrong cluster address');
      console.log('   3. Firewall blocking the connection');
      console.log('');
      console.log('🔧 Fix:');
      console.log('   1. Go to MongoDB Atlas → Network Access');
      console.log('   2. Add IP Address: 0.0.0.0/0 (Allow from anywhere)');
      console.log('   3. Wait 1-2 minutes and try again');
    } else if (error.message.includes('authentication failed') || error.message.includes('Authentication failed')) {
      console.log('💡 This means:');
      console.log('   Wrong username or password');
      console.log('');
      console.log('🔧 Fix:');
      console.log('   1. Double-check your username and password');
      console.log('   2. Special characters in password must be URL-encoded:');
      console.log('      @ → %40');
      console.log('      # → %23');
      console.log('      $ → %24');
      console.log('   3. Or create a new user with simple password (no special chars)');
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('ETIMEDOUT')) {
      console.log('💡 This means:');
      console.log('   Network/DNS issue');
      console.log('');
      console.log('🔧 Fix:');
      console.log('   1. Check your internet connection');
      console.log('   2. Try using mobile hotspot');
      console.log('   3. Temporarily disable firewall/antivirus');
    }

    console.log('');
    console.log('📖 See MONGODB_TROUBLESHOOT.md for detailed solutions');
    process.exit(1);
  });

// Handle timeout
setTimeout(() => {
  console.log('⏰ Connection timeout - taking too long...');
  console.log('Check your network connection and MongoDB Atlas settings');
  process.exit(1);
}, 10000); // 10 second overall timeout
