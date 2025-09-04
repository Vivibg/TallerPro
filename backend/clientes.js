import { Router } from 'express';
import { pool } from './db.js';
import { authRequired } from './middleware/auth.js';
import { withTenant, assertWritable } from './middlewares/tenant.js';

const router = Router();

// Listar todos los clientes
router.get('/', authRequired, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM clientes');
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'Error consultando clientes' });
  }
});

// Crear cliente
router.post('/', authRequired, withTenant, async (req, res) => {
  try {
    const { nombre, telefono, email, vehiculo, ultimaVisita, desde, patente } = req.body || {};
    // Insert dinámico para no fallar si faltan columnas y para incluir taller_id
    const [cols] = await pool.query('SHOW COLUMNS FROM clientes');
    const names = cols.map(c => c.Field);
    const fields = [];
    const values = [];
    const pushIf = (n, v) => { if (names.includes(n)) { fields.push(n); values.push(v ?? null); } };
    pushIf('nombre', nombre);
    pushIf('telefono', telefono);
    pushIf('email', email);
    pushIf('vehiculo', vehiculo);
    pushIf('ultimaVisita', ultimaVisita);
    pushIf('desde', desde);
    pushIf('patente', patente);
    pushIf('taller_id', req.tenantId);
    const sql = `INSERT INTO clientes (${fields.join(', ')}) VALUES (${fields.map(() => '?').join(', ')})`;
    const [result] = await pool.query(sql, values);
    res.status(201).json({ id: result.insertId, nombre, telefono, email, vehiculo, ultimaVisita, desde });
  } catch (e) {
    res.status(500).json({ error: 'Error creando cliente' });
  }
});

// Eliminar cliente
router.delete('/:id', authRequired, withTenant, async (req, res) => {
  try {
    const { id } = req.params;
    await assertWritable(pool, 'clientes', id, req.tenantId);
    await pool.query('DELETE FROM clientes WHERE id = ? AND taller_id = ?', [id, req.tenantId]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Error eliminando cliente' });
  }
});

export default router;
 
