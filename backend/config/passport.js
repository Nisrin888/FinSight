/**
 * Passport.js Configuration
 * Google OAuth 2.0 Strategy
 */

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User.model');
const Category = require('../models/category.model');

// Serialize user for the session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from the session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      scope: ['profile', 'email'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          // User exists, update last login
          await user.updateLastLogin();
          return done(null, user);
        }

        // Check if user exists with same email
        user = await User.findOne({ email: profile.emails[0].value });

        if (user) {
          // User exists with email, link Google account
          user.googleId = profile.id;
          user.profilePicture = profile.photos[0]?.value;
          await user.save();
          await user.updateLastLogin();
          return done(null, user);
        }

        // Create new user
        user = await User.create({
          name: profile.displayName,
          email: profile.emails[0].value,
          googleId: profile.id,
          profilePicture: profile.photos[0]?.value,
          isActive: true,
          emailVerified: true, // Google emails are verified
        });

        // Create default categories for new user
        try {
          await Category.createDefaultCategories(user._id);
        } catch (error) {
          console.error('Error creating default categories for OAuth user:', error);
        }

        await user.updateLastLogin();
        done(null, user);
      } catch (error) {
        console.error('Google OAuth Error:', error);
        done(error, null);
      }
    }
  )
);

module.exports = passport;
