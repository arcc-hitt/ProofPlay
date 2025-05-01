// Description: Authentication controller functions for handling user signup, login, and OAuth callback.
import { Request, Response, NextFunction } from 'express';
import passport from '../config/passport';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User';

const signToken = (userId: string) =>
  jwt.sign({ sub: userId }, process.env.JWT_SECRET!, { expiresIn: '7d' });

// Local signup
export const signup = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;
  const hash = await bcrypt.hash(password, 12);
  const user = new User({ email, passwordHash: hash });
  await user.save();
  res.json({ token: signToken(user.id) });
};

// Local login
export const login = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  passport.authenticate(
    'local',
    { session: false },
    (err: any, user: Express.User | false) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ error: 'Invalid credentials' });
      res.json({ token: signToken((user as any).id) });
    }
  )(req, res, next);
};

// OAuth callback handler
export const oauthCallback = (req: Request, res: Response): void => {
  const user = req.user as Express.User & { id: string };
  res.redirect(
    `${process.env.FRONTEND_URL}/oauth-success?token=${signToken(user.id)}`
  );
};
