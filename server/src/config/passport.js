import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { User } from '../models/User.model.js';

export const configurePassport = () => {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID || 'dummy_client_id',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy_client_secret',
        callbackURL:
          process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          let user = await User.findOne({ googleId: profile.id });

          if (!user) {
            const email = profile.emails && profile.emails[0] ? profile.emails[0].value : '';
            const isAdmin =
              email && email.toLowerCase() === (process.env.OWNER_EMAIL || '').toLowerCase();

            user = await User.create({
              googleId: profile.id,
              name: profile.displayName || 'User',
              email: email,
              avatar: profile.photos && profile.photos[0] ? profile.photos[0].value : '',
              role: isAdmin ? 'admin' : 'visitor',
            });
          }

          return done(null, user);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );
};
