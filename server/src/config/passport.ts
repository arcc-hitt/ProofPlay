// Description: This file configures the passport authentication strategies for local, Google, GitHub, and JWT authentication.
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as GoogleStrategy, Profile as GoogleProfile } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy, Profile as GitHubProfile } from 'passport-github2';
import { Strategy as JwtStrategy, ExtractJwt, VerifiedCallback as JwtVerify } from 'passport-jwt';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

import User, { IUser } from '../models/User';
import logger from './logger';
import env from './env';

dotenv.config();

// --- Local (email/password) strategy ---
passport.use(new LocalStrategy(
  { usernameField: 'email' },
  async (
    email: string,
    password: string,
    done: (err: any, user?: IUser, info?: any) => void
  ) => {
    try {
      const user = await User.findOne({ email }).select('+passwordHash');
      if (!user || !user.passwordHash) {
        return done(null, undefined, { message: 'Invalid credentials' });
      }

      const match = await bcrypt.compare(password, user.passwordHash);
      return match
        ? done(null, user)
        : done(null, undefined, { message: 'Invalid credentials' });

    } catch (err) {
      logger.error('LocalStrategy error', err);
      return done(err);
    }
  }
));

// --- Google OAuth2 strategy ---
passport.use(new GoogleStrategy(
  {
    clientID: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${env.BACKEND_URL}/auth/google/callback`,
  },
  async (
    _accessToken: string,
    _refreshToken: string,
    _params: any,
    profile: GoogleProfile,
    done: (err: any, user?: IUser, info?: any) => void
  ) => {
    try {
      let user = await User.findOne({ 'federated.providerId': profile.id });

      if (!user) {
        const email = profile.emails?.[0]?.value;
        if (email) {
          user = await User.findOne({ email });
        }
      }

      if (user) {
        const exists = user.federated?.some(
          f => f.provider === 'google' && f.providerId === profile.id
        );
        if (!exists) {
          user.federated = user.federated || [];
          user.federated.push({ provider: 'google', providerId: profile.id });
          await user.save();
        }
      } else {
        user = new User({
          email: profile.emails?.[0]?.value,
          federated: [{ provider: 'google', providerId: profile.id }],
        });
        await user.save();
      }

      done(null, user);

    } catch (err) {
      logger.error('GoogleStrategy error', err);
      done(err as Error);
    }
  }
));

// --- GitHub OAuth2 strategy ---
passport.use(new GitHubStrategy(
  {
    clientID: env.GITHUB_CLIENT_ID,
    clientSecret: env.GITHUB_CLIENT_SECRET,
    callbackURL: `${env.BACKEND_URL}/auth/github/callback`,
    scope: ['user:email'], 
  },
  async (
    _accessToken: string,
    _refreshToken: string,
    _params: any,
    profile: GitHubProfile,
    done: (err: any, user?: IUser, info?: any) => void
  ) => {
    try {
      let user = await User.findOne({ 'federated.providerId': profile.id });

      if (!user) {
        const email = profile.emails?.[0]?.value;
        if (email) {
          user = await User.findOne({ email });
        }
      }

      if (user) {
        const exists = user.federated?.some(
          f => f.provider === 'github' && f.providerId === profile.id
        );
        if (!exists) {
          user.federated = user.federated || [];
          user.federated.push({ provider: 'github', providerId: profile.id });
          await user.save();
        }
      } else {
        user = new User({
          email: profile.emails?.[0]?.value,
          federated: [{ provider: 'github', providerId: profile.id }],
        });
        await user.save();
      }

      done(null, user);

    } catch (err) {
      logger.error('GitHubStrategy error', err);
      done(err as Error);
    }
  }
));

// --- JWT strategy for protecting routes ---
passport.use(new JwtStrategy(
  {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: env.JWT_SECRET,
  },
  async (
    jwtPayload: any,
    done: JwtVerify
  ) => {
    try {
      const user = await User.findById(jwtPayload.sub);
      done(null, user || undefined);
    } catch (err) {
      logger.error('JwtStrategy error', err);
      return done(err as Error, undefined);
    }
  }
));

export default passport;
