import { Router } from 'express';
import { pool } from './db.js';
import { authRequired } from './middleware/auth.js';
import { withTenant, assertWritable } from './middlewares/tenant.js';

const router = Router();

// Listar historial
router.get('/', authRequired, async (req, res) => {
  try {
    try {
      const [rows] = await pool.query('SELECT * FROM historial_vehiculos ORDER BY fecha DESC, id DESC');
      return res.json(rows);
    } catch (e) {
      // Fallback a tabla legacy 'historial'
      const [rows] = await pool.query('SELECT * FROM historial ORDER BY fecha DESC, id DESC');
      return res.json(rows);
    }
  } catch (e) {
    res.status(500).json({ error: 'Error consultando historial' });
  }
});

// Historial con ficha (mantener bajo nombre original)
router.get('/con-ficha', authRequired, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT h.*, r.diagnostico, r.trabajos, r.repuestos, r.observaciones, r.garantiaPeriodo, r.garantiaCondiciones
      FROM historial_vehiculos h
      LEFT JOIN reparaciones r
        ON h.vehiculo = r.vehiculo
        AND h.cliente = r.cliente
        AND h.patente = r.patente
        AND DATE(h.fecha) = DATE(r.fecha)
      ORDER BY h.fecha DESC
    `);
    return res.json(rows);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Error consultando historial con ficha' });
  }
});

// Crear registro de historial
router.post('/', authRequired, withTenant, async (req, res) => {
  try {
    const { reparacion_id, vehiculo, patente, cliente, fecha, servicio, taller } = req.body || {};
    // Detectar columnas existentes según el modelo y el estado real de la BD
    let names = [];
    let table = 'historial_vehiculos';
    try {
      const [cols] = await pool.query('SHOW COLUMNS FROM historial_vehiculos');
      names = cols.map(c => c.Field);
      table = 'historial_vehiculos';
    } catch (e) {
      const [cols] = await pool.query('SHOW COLUMNS FROM historial');
      names = cols.map(c => c.Field);
      table = 'historial';
    }
    const fields = [];
    const values = [];
    const pushIf = (name, val) => { if (names.includes(name)) { fields.push(name); values.push(val ?? null); } };
    pushIf('reparacion_id', reparacion_id);
    pushIf('vehiculo', vehiculo);
    pushIf('patente', patente ?? null);
    pushIf('cliente', cliente);
    pushIf('fecha', fecha);
    pushIf('servicio', servicio);
    pushIf('taller', taller);
    if (names.includes('taller_id')) { fields.push('taller_id'); values.push(req.tenantId); }

    if (fields.length === 0) return res.status(400).json({ error: 'Sin columnas válidas para insertar' });
    const placeholders = fields.map(() => '?').join(', ');
    const sql = `INSERT INTO ${table} (${fields.join(', ')}) VALUES (${placeholders})`;
    const [result] = await pool.query(sql, values);
    // Responder con eco de valores normalizados
    res.status(201).json({ id: result.insertId, reparacion_id, vehiculo, patente: patente ?? null, cliente, fecha, servicio, taller });
  } catch (e) {
    console.error('Error creando historial:', e.code || e.message);
    res.status(500).json({ error: 'Error creando historial' });
  }
});

// Eliminar registro de historial
router.delete('/:id', authRequired, withTenant, async (req, res) => {
  try {
    const { id } = req.params;
    // Intentar borrar sobre tabla nueva; si no existe, sobre legacy
    try {
      await assertWritable(pool, 'historial_vehiculos', id, req.tenantId);
      await pool.query('DELETE FROM historial_vehiculos WHERE id = ? AND taller_id = ?', [id, req.tenantId]);
    } catch (e) {
      await assertWritable(pool, 'historial', id, req.tenantId);
      await pool.query('DELETE FROM historial WHERE id = ? AND taller_id = ?', [id, req.tenantId]);
    }
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Error eliminando historial' });
  }
});

export default router;
