import { Router } from 'express';
import { register, login, getMe, verifyEmail, resendVerificationToken, updateProfile, changePassword } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/register', register);
router.post('/login',    login);
router.post('/verify',   verifyEmail);
router.post('/resend-verification', resendVerificationToken);
router.get('/me',              authenticate, getMe);
router.patch('/me',            authenticate, updateProfile);
router.patch('/me/password',   authenticate, changePassword);

export default router;
