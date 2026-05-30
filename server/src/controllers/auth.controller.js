import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';
import { AppError } from '../middleware/error.middleware.js';
import { sendVerificationEmail } from '../utils/email.js';

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

  // Send verification email using SMTP / Resend HTTPS (with console print as fallback)
  const emailSent = await sendVerificationEmail(email, verificationCode);

  // Return user info and flag indicating verification is required, plus fallback code if email failed
  res.status(201).json({
    message: emailSent 
      ? 'Registration successful. Please verify your account.' 
      : 'Registration successful! (Sandbox Bypass: Email service unavailable, code displayed)',
    requiresVerification: true,
    email: user.email,
    ...(!emailSent && { fallbackCode: verificationCode })
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

  // Send verification email using SMTP / Resend HTTPS (with console print as fallback)
  const emailSent = await sendVerificationEmail(email, verificationCode);

  res.status(200).json({
    message: emailSent 
      ? 'Verification code resent successfully!' 
      : 'Verification code generated! (Sandbox Bypass: Email service unavailable, code displayed)',
    ...(!emailSent && { fallbackCode: verificationCode })
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

/* PATCH /api/auth/me — update name and/or email */
export const updateProfile = async (req, res) => {
  const { name, email } = req.body;
  if (!name && !email) throw new AppError('No fields to update', 400);

  // If changing email, check it isn't already taken by another account
  if (email) {
    const exists = await query(
      'SELECT id FROM users WHERE email = $1 AND id != $2',
      [email, req.user.id]
    );
    if (exists.rows.length) throw new AppError('Email already in use by another account', 409);
  }

  const { rows } = await query(
    `UPDATE users
     SET name  = COALESCE($1, name),
         email = COALESCE($2, email)
     WHERE id = $3
     RETURNING id, name, email, role, is_verified, created_at`,
    [name || null, email || null, req.user.id]
  );
  if (!rows[0]) throw new AppError('User not found', 404);
  res.json(rows[0]);
};

/* PATCH /api/auth/me/password — change password */
export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    throw new AppError('currentPassword and newPassword are required', 400);
  }
  if (newPassword.length < 6) {
    throw new AppError('New password must be at least 6 characters', 400);
  }

  const { rows } = await query(
    'SELECT id, password_hash FROM users WHERE id = $1',
    [req.user.id]
  );
  if (!rows[0]) throw new AppError('User not found', 404);

  const valid = await bcrypt.compare(currentPassword, rows[0].password_hash);
  if (!valid) throw new AppError('Current password is incorrect', 401);

  const newHash = await bcrypt.hash(newPassword, 12);
  await query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, req.user.id]);

  res.json({ message: 'Password updated successfully' });
};
