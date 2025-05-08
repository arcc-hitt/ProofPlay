// Description: Authentication controller functions for handling user signup, login, and OAuth callback.
import { Request, Response, NextFunction } from 'express';
import passport from '../config/passport';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import expressAsyncHandler from 'express-async-handler';
import env from '../config/env';

const signToken = (userId: string) =>
  jwt.sign({ sub: userId }, process.env.JWT_SECRET!, { expiresIn: '7d' });

// Local signup
export const signup = [
  expressAsyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;
    const exists = await User.exists({ email });
    if (exists) res.status(409).json({ error: 'Email already in use' });
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ email, passwordHash });
    res.status(201).json({ token: signToken(user.id) });
  }),
];

// Local login
export const login = [
  expressAsyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    (req as any).params = {};
    passport.authenticate(
      'local',
      { session: false },
      (err: any, user: Express.User | false, info: any) => {
        if (err) return next(err);
        if (!user) return res.status(401).json({ error: info?.message || 'Unauthorized' });
        res.json({ token: signToken((user as any).id) });
      }
    )(req, res, next);
  }),
];

// OAuth callback handler
export const oauthCallback = (req: Request, res: Response): void => {
  const user = req.user as Express.User & { id: string };
  res.redirect(
    `${env.FRONTEND_URL}/oauth-success?token=${signToken(user.id)}`
  );
};
