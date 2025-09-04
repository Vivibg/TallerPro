import { Router } from 'express';
import { pool } from './db.js';
import { authRequired } from './middleware/auth.js';
import { withTenant, enforceTenantOnInsert, assertWritable } from './middlewares/tenant.js';

const router = Router();

// Listar inventario
router.get('/', authRequired, withTenant, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM inventario WHERE taller_id = ? ORDER BY producto', [req.tenantId]);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error consultando inventario' });
  }
});

// Crear producto
router.post('/', authRequired, withTenant, async (req, res) => {
  try {
    const { producto, categoria, stock, minimo, precio, estado } = req.body || {};
    // Insert dinámico por columnas presentes
    const [cols] = await pool.query('SHOW COLUMNS FROM inventario');
    const names = cols.map(c => c.Field);
    const fields = [];
    const values = [];
    const pushIf = (n, v) => { if (names.includes(n)) { fields.push(n); values.push(v ?? null); } };
    pushIf('producto', producto);
    pushIf('categoria', categoria);
    pushIf('stock', stock);
    pushIf('minimo', minimo);
    pushIf('precio', precio);
    pushIf('estado', estado || 'ok');
    pushIf('taller_id', req.tenantId);
    const sql = `INSERT INTO inventario (${fields.join(', ')}) VALUES (${fields.map(()=>'?').join(', ')})`;
    const [result] = await pool.query(sql, values);
    res.status(201).json({ id: result.insertId, producto, categoria, stock, minimo, precio, estado });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error creando producto' });
  }
});

// Eliminar producto
router.delete('/:id', authRequired, withTenant, async (req, res) => {
  try {
    const { id } = req.params;
    await assertWritable(pool, 'inventario', id, req.tenantId);
    await pool.query('DELETE FROM inventario WHERE id = ? AND taller_id = ?', [id, req.tenantId]);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error eliminando producto' });
  }
});

export default router;
 
