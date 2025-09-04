import { Router } from 'express';
import { pool } from './db.js';
import { authRequired } from './middleware/auth.js';
import { withTenant, assertWritable } from './middlewares/tenant.js';

const router = Router();

// Listar historial
router.get('/', authRequired, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM historial_vehiculos');
    res.json(rows);
  } catch (e) {
    console.error(e); // <--- Esto imprime el error en los logs de Render
    res.status(500).json({ error: 'Error consultando historial' });
  }
});

// Listar historial con resumen de ficha de reparación (JOIN robusto solo por fecha)
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
    // Log para depuración
    console.log('Historial con ficha:', rows.length, 'resultados');
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error consultando historial con ficha' });
  }
});

// Crear registro de historial
router.post('/', authRequired, withTenant, async (req, res) => {
  try {
    const { vehiculo, patente, cliente, fecha, servicio, taller } = req.body || {};
    // Insert dinámico para incluir taller_id si existe
    const [cols] = await pool.query('SHOW COLUMNS FROM historial_vehiculos');
    const names = cols.map(c => c.Field);
    const fields = [];
    const values = [];
    const pushIf = (n, v) => { if (names.includes(n)) { fields.push(n); values.push(v ?? null); } };
    pushIf('vehiculo', vehiculo);
    pushIf('patente', patente);
    pushIf('cliente', cliente);
    pushIf('fecha', fecha);
    pushIf('servicio', servicio);
    pushIf('taller', taller);
    if (names.includes('taller_id')) { fields.push('taller_id'); values.push(req.tenantId); }
    const sql = `INSERT INTO historial_vehiculos (${fields.join(', ')}) VALUES (${fields.map(() => '?').join(', ')})`;
    const [result] = await pool.query(sql, values);
    res.status(201).json({ id: result.insertId, vehiculo, patente, cliente, fecha, servicio, taller });
  } catch (e) {
    res.status(500).json({ error: 'Error creando historial' });
  }
});

// Eliminar registro de historial
router.delete('/:id', authRequired, withTenant, async (req, res) => {
  try {
    const { id } = req.params;
    await assertWritable(pool, 'historial_vehiculos', id, req.tenantId);
    await pool.query('DELETE FROM historial_vehiculos WHERE id = ? AND taller_id = ?', [id, req.tenantId]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Error eliminando historial' });
  }
});

export default router;
