import express from 'express';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import bcrypt from 'bcryptjs';
import { pool } from './db.js';
import { authRequired } from './middleware/auth.js';

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const adminEmails = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map(s => s.trim().toLowerCase())
  .filter(Boolean);

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name, taller_id: user.taller_id || null },
    process.env.JWT_SECRET,
    { expiresIn: '12h' }
  );
}

// Crea un taller por defecto y asigna taller_id al usuario si aún no tiene
async function ensureTenantForUser(userId, defaultUserName = '', preferredName) {
  // Verificar si users ya tiene taller_id
  const [uRows] = await pool.query('SELECT id, taller_id, name FROM users WHERE id = ? LIMIT 1', [userId]);
  const u = uRows[0];
  if (!u) return null;
  if (u.taller_id) return u.taller_id;

  // Comprobar existencia de tabla 'talleres'
  const [tables] = await pool.query("SHOW TABLES LIKE 'talleres'");
  if (!tables.length) {
    // No hay tabla talleres: no podemos crear registro, devolvemos null
    return null;
  }
  // Detectar columnas disponibles en 'talleres'
  const [tCols] = await pool.query('SHOW COLUMNS FROM talleres');
  const tNames = new Set(tCols.map(c => c.Field));

  // Nombre del taller
  const ownerName = (u.name || defaultUserName || '').trim();
  const nombreBase = preferredName && String(preferredName).trim()
    ? String(preferredName).trim()
    : (ownerName ? `Taller de ${ownerName}` : `Taller ${userId}`);

  // Construir INSERT dinámico
  const cols = [];
  const vals = [];
  const pushIf = (name, val) => { if (tNames.has(name)) { cols.push(name); vals.push(val); } };
  pushIf('nombre', nombreBase);
  pushIf('owner_user_id', userId);
  // created_at/updated_at manejados por default de la DB si existen
  const placeholders = cols.map(() => '?').join(', ');
  const sql = `INSERT INTO talleres (${cols.join(', ')}) VALUES (${placeholders})`;
  const [result] = await pool.query(sql, vals);
  const tallerId = result.insertId;

  // Actualizar usuario con taller_id si la columna existe
  const [uCols] = await pool.query('SHOW COLUMNS FROM users');
  const uNames = new Set(uCols.map(c => c.Field));
  if (uNames.has('taller_id')) {
    await pool.query('UPDATE users SET taller_id = ? WHERE id = ?', [tallerId, userId]);
  }

  return tallerId;
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

    // Asegurar taller_id
    if (!user.taller_id) {
      await ensureTenantForUser(user.id, user.name);
      const [fresh] = await pool.query('SELECT id, email, name, role, picture, taller_id FROM users WHERE id = ? LIMIT 1', [user.id]);
      if (fresh[0]) user = fresh[0];
    }

    const token = signToken(user);
    return res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, picture: user.picture, taller_id: user.taller_id || null } });
  } catch (e) {
    console.error('Google auth error:', e.code || e.name, e.sqlMessage || e.message);
    return res.status(401).json({ error: 'Token de Google inválido' });
  }
});

// POST /api/auth/register { email, password, name?, tallerNombre? }
router.post('/register', async (req, res) => {
  try {
    const { email, password, name = '', tallerNombre } = req.body || {};
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

    // Asegurar taller_id (crear taller si hace falta)
    await ensureTenantForUser(userId, name, tallerNombre);
    // Recuperar datos frescos con taller_id
    const [freshRows] = await pool.query('SELECT id, email, name, role, taller_id FROM users WHERE id = ?', [userId]);
    const fresh = freshRows[0] || { id: userId, email: normEmail, name, role, taller_id: null };
    const user = { id: fresh.id, email: fresh.email, name: fresh.name, role: fresh.role, taller_id: fresh.taller_id };
    const token = signToken(user);
    return res.status(201).json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role, taller_id: user.taller_id || null } });
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

    // Asegurar taller_id si el usuario es legacy sin taller asignado
    if (!user.taller_id) {
      await ensureTenantForUser(user.id, user.name);
      const [fresh] = await pool.query('SELECT id, email, name, role, taller_id FROM users WHERE id = ? LIMIT 1', [user.id]);
      if (fresh[0]) user = fresh[0];
    }

    const token = signToken(user);
    return res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role, taller_id: user.taller_id || null } });
  } catch (e) {
    console.error('Login error:', e.code || e.name, e.sqlMessage || e.message);
    return res.status(500).json({ error: 'Error iniciando sesión' });
  }
});

// GET /api/auth/me
router.get('/me', authRequired, (req, res) => {
  const u = req.user;
  return res.json({ user: { id: u.id, email: u.email, name: u.name, role: u.role, taller_id: u.taller_id || null } });
});

export default router;
