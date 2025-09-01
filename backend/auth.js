import express from 'express';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import bcrypt from 'bcryptjs';
import { pool } from './db.js';

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const adminEmails = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map(s => s.trim().toLowerCase())
  .filter(Boolean);

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: '12h' }
  );
}

// POST /api/auth/google { idToken: string }
router.post('/google', async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ error: 'idToken requerido' });

    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();
    const email = payload.email.toLowerCase();
    const name = payload.name || '';
    const picture = payload.picture || '';

    // Rol por email admin o por registro previo
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    let user = rows[0];

    if (!user) {
      const role = adminEmails.includes(email) ? 'admin' : 'client';
      const [result] = await pool.query(
        'INSERT INTO users (email, name, picture, role, provider) VALUES (?, ?, ?, ?, ?)',
        [email, name, picture, role, 'google']
      );
      user = { id: result.insertId, email, name, picture, role };
    } else {
      const newRole = adminEmails.includes(email) ? 'admin' : user.role;
      if (user.name !== name || user.picture !== picture || user.role !== newRole) {
        await pool.query('UPDATE users SET name=?, picture=?, role=? WHERE id=?', [
          name, picture, newRole, user.id
        ]);
        user.name = name;
        user.picture = picture;
        user.role = newRole;
      }
    }

    const token = signToken(user);
    return res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, picture: user.picture } });
  } catch (e) {
    console.error('Google auth error:', e.code || e.name, e.sqlMessage || e.message);
    return res.status(401).json({ error: 'Token de Google inválido' });
  }
});

// POST /api/auth/register { email, password, name? }
router.post('/register', async (req, res) => {
  try {
    const { email, password, name = '' } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Email y contraseña son requeridos' });

    const normEmail = String(email).trim().toLowerCase();
    if (password.length < 8) return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });

    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [normEmail]);
    const existing = rows[0];

    if (existing && existing.password_hash) {
      return res.status(409).json({ error: 'El correo ya está registrado' });
    }

    const hash = await bcrypt.hash(password, 10);
    const role = adminEmails.includes(normEmail) ? 'admin' : 'client';

    let userId;
    if (!existing) {
      const [result] = await pool.query(
        'INSERT INTO users (email, name, password_hash, role, provider) VALUES (?, ?, ?, ?, ?)',
        [normEmail, name, hash, role, 'local']
      );
      userId = result.insertId;
    } else {
      await pool.query(
        'UPDATE users SET name = COALESCE(?, name), password_hash = ?, provider = COALESCE(provider, ?) WHERE id = ?',
        [name || existing.name, hash, 'local', existing.id]
      );
      userId = existing.id;
    }

    const user = { id: userId, email: normEmail, name, role };
    const token = signToken(user);
    return res.status(201).json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (e) {
    console.error('Register error:', e.code || e.name, e.sqlMessage || e.message);
    return res.status(500).json({ error: 'Error registrando usuario' });
  }
});

// POST /api/auth/login { email, password }
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Email y contraseña son requeridos' });

    const normEmail = String(email).trim().toLowerCase();

    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [normEmail]);
    const user = rows[0];
    if (!user || !user.password_hash) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Credenciales inválidas' });

    const token = signToken(user);
    return res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (e) {
    console.error('Login error:', e.code || e.name, e.sqlMessage || e.message);
    return res.status(500).json({ error: 'Error iniciando sesión' });
  }
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(200).json({ user: null });
  try {
    const u = jwt.verify(token, process.env.JWT_SECRET);
    return res.json({ user: { id: u.id, email: u.email, name: u.name, role: u.role } });
  } catch {
    return res.status(200).json({ user: null });
  }
});

export default router;
