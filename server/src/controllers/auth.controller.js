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

/* POST /api/auth/register */
export const register = async (req, res) => {
  const { name, email, password, role = 'user' } = req.body;

  if (!name || !email || !password) {
    throw new AppError('name, email, and password are required');
  }
  if (password.length < 6) {
    throw new AppError('Password must be at least 6 characters');
  }

  const exists = await query('SELECT id FROM users WHERE email = $1', [email]);
  if (exists.rows.length) throw new AppError('Email already in use', 409);

  const password_hash = await bcrypt.hash(password, 12);
  const { rows } = await query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, role, created_at`,
    [name, email, password_hash, role]
  );

  const user  = rows[0];
  const token = signToken(user);
  res.status(201).json({ token, user });
};

/* POST /api/auth/login */
export const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new AppError('email and password are required');

  const { rows } = await query(
    'SELECT id, name, email, role, password_hash FROM users WHERE email = $1',
    [email]
  );
  const user = rows[0];
  if (!user) throw new AppError('Invalid credentials', 401);

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw new AppError('Invalid credentials', 401);

  const token = signToken(user);
  const { password_hash: _, ...safeUser } = user;
  res.json({ token, user: safeUser });
};

/* GET /api/auth/me */
export const getMe = async (req, res) => {
  const { rows } = await query(
    'SELECT id, name, email, role, created_at FROM users WHERE id = $1',
    [req.user.id]
  );
  if (!rows[0]) throw new AppError('User not found', 404);
  res.json(rows[0]);
};
