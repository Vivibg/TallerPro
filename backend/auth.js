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
      const role = adminEmails.includes(email) ? 'admin' : 'cliente';
      const [result] = await pool.query(
        'INSERT INTO users (email, name, picture, role) VALUES (?, ?, ?, ?)',
        [email, name, picture, role]
      );
      user = { id: result.insertId, email, name, picture, role };
    } else {
      // Opcional: actualizar nombre/foto y elevar a admin si está en la lista
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
