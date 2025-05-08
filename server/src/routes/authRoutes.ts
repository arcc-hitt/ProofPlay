// Description: Authentication routes for signup, login, and OAuth callbacks
import { Router } from 'express';
import passport from '../config/passport';
import { login, oauthCallback, signup } from '../controllers/authController';
import { loginValidator, signupValidator } from '../middlewares/validateRequest';

const router = Router();

// Local
router.post('/signup', signupValidator, signup);
router.post('/login', loginValidator, login);

// Google
router.get('/google', passport.authenticate('google', { scope: ['email','profile'] }));
router.get('/google/callback',
  passport.authenticate('google', { session: false }),
  oauthCallback
);

// GitHub
router.get('/github', passport.authenticate('github', { scope: ['user:email'], prompt: 'select_account' }));
router.get('/github/callback',
  passport.authenticate('github', { session: false }),
  oauthCallback
);

export default router;
