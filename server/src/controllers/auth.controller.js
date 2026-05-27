import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';
import { AppError } from '../middleware/error.middleware.js';

const signToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

// Helper to generate a 6-digit verification code
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/* POST /api/auth/register */
export const register = async (req, res) => {
  const { name, email, password, role = 'user' } = req.body;

  if (!name || !email || !password) {
    throw new AppError('name, email, and password are required', 400);
  }
  if (password.length < 6) {
    throw new AppError('Password must be at least 6 characters', 400);
  }

  const exists = await query('SELECT id FROM users WHERE email = $1', [email]);
  if (exists.rows.length) throw new AppError('Email already in use', 409);

  const password_hash = await bcrypt.hash(password, 12);
  const verificationCode = generateVerificationCode();

  // Create unverified user with verification token
  const { rows } = await query(
    `INSERT INTO users (name, email, password_hash, role, is_verified, verification_token)
     VALUES ($1, $2, $3, $4, FALSE, $5)
     RETURNING id, name, email, role, is_verified, created_at`,
    [name, email, password_hash, role, verificationCode]
  );

  const user = rows[0];

  // ── IMPORTANT: DEV SERVER CONSOLE LOGGER ──
  console.log('\n======================================================');
  console.log(`✉️  [EMAIL VERIFICATION CODE FOR: ${email}]`);
  console.log(`👉  YOUR TEMPORARY KEY IS: ${verificationCode}`);
  console.log('======================================================\n');

  // Return user info and flag indicating verification is required
  res.status(201).json({
    message: 'Registration successful. Please verify your account.',
    requiresVerification: true,
    email: user.email
  });
};

/* POST /api/auth/login */
export const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new AppError('email and password are required', 400);

  const { rows } = await query(
    'SELECT id, name, email, role, is_verified, password_hash FROM users WHERE email = $1',
    [email]
  );
  const user = rows[0];
  if (!user) throw new AppError('Invalid credentials', 401);

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw new AppError('Invalid credentials', 401);

  // Check if account is verified
  if (!user.is_verified) {
    throw new AppError('Account not verified. Please verify your email.', 403);
  }

  const token = signToken(user);
  const { password_hash: _, ...safeUser } = user;
  res.json({ token, user: safeUser });
};

/* POST /api/auth/verify */
export const verifyEmail = async (req, res) => {
  const { email, token } = req.body;

  if (!email || !token) {
    throw new AppError('Email and verification code are required', 400);
  }

  const { rows } = await query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );
  const user = rows[0];

  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (user.is_verified) {
    throw new AppError('Email already verified', 400);
  }

  if (user.verification_token !== token.trim()) {
    throw new AppError('Invalid verification code', 400);
  }

  // Update user as verified and clear token
  const updateRes = await query(
    `UPDATE users 
     SET is_verified = TRUE, verification_token = NULL 
     WHERE id = $1 
     RETURNING id, name, email, role, is_verified`,
    [user.id]
  );

  const verifiedUser = updateRes.rows[0];
  const jwtToken = signToken(verifiedUser);

  res.status(200).json({
    message: 'Email verified successfully!',
    token: jwtToken,
    user: verifiedUser
  });
};

/* POST /api/auth/resend-verification */
export const resendVerificationToken = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new AppError('Email is required', 400);
  }

  const { rows } = await query('SELECT * FROM users WHERE email = $1', [email]);
  const user = rows[0];

  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (user.is_verified) {
    throw new AppError('Email already verified', 400);
  }

  const verificationCode = generateVerificationCode();

  await query(
    'UPDATE users SET verification_token = $1 WHERE id = $2',
    [verificationCode, user.id]
  );

  // ── IMPORTANT: DEV SERVER CONSOLE LOGGER ──
  console.log('\n======================================================');
  console.log(`✉️  [RESENT EMAIL VERIFICATION CODE FOR: ${email}]`);
  console.log(`👉  YOUR NEW TEMPORARY KEY IS: ${verificationCode}`);
  console.log('======================================================\n');

  res.status(200).json({
    message: 'Verification code resent successfully!'
  });
};

/* GET /api/auth/me */
export const getMe = async (req, res) => {
  const { rows } = await query(
    'SELECT id, name, email, role, is_verified, created_at FROM users WHERE id = $1',
    [req.user.id]
  );
  if (!rows[0]) throw new AppError('User not found', 404);
  res.json(rows[0]);
};
