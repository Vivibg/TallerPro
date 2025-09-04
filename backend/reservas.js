// backend/reservas.js
import express from 'express';
import { pool } from './db.js';
import { authRequired } from './middleware/auth.js';
import { withTenant, enforceTenantOnInsert, assertWritable } from './middlewares/tenant.js';

const router = express.Router();

// Obtener todas las reservas
router.get('/', authRequired, withTenant, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM reservas WHERE taller_id = ? ORDER BY fecha, hora', [req.tenantId]);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'Error consultando reservas' });
  }
});

// Crear nueva reserva
router.post('/', authRequired, withTenant, async (req, res) => {
  try {
    const { cliente, servicio, vehiculo, patente, fecha, hora, motivo } = req.body || {};
    // Descubrir columnas existentes para evitar errores por columnas faltantes
    const [cols] = await pool.query('SHOW COLUMNS FROM reservas');
    const colNames = cols.map(c => c.Field);
    const fields = [];
    const values = [];
    const pushIf = (name, val) => { if (colNames.includes(name)) { fields.push(name); values.push(val ?? null); } };
    pushIf('cliente', cliente);
    pushIf('servicio', servicio);
    pushIf('vehiculo', vehiculo);
    pushIf('patente', patente);
    pushIf('fecha', fecha);
    pushIf('hora', hora);
    pushIf('motivo', motivo);
    pushIf('taller_id', req.tenantId);
    if (fields.length === 0) return res.status(400).json({ error: 'Sin columnas válidas para insertar' });
    const placeholders = fields.map(() => '?').join(', ');
    const sql = `INSERT INTO reservas (${fields.join(', ')}) VALUES (${placeholders})`;
    const [result] = await pool.query(sql, values);
    res.status(201).json({ id: result.insertId, cliente, servicio, vehiculo, patente, fecha, hora, motivo });
  } catch (e) {
    console.error('Error creando reserva:', e.code || e.message, e.sqlMessage || '');
    res.status(500).json({ error: 'Error creando reserva' });
  }
});

// Confirmar asistencia: crea una reparación a partir de la reserva
router.put('/:id/asistencia', authRequired, withTenant, async (req, res) => {
  try {
    const { id } = req.params;
    let { asiste } = req.body || {};
    // Normalizar a booleano
    asiste = asiste === true || asiste === 'true' || asiste === 1 || asiste === '1';

    const [rows] = await pool.query('SELECT * FROM reservas WHERE id = ? AND taller_id = ?', [id, req.tenantId]);
    const r = rows[0];
    if (!r) return res.status(404).json({ error: 'Reserva no encontrada' });

    // Intentar marcar la asistencia en la tabla de reservas (si existe la columna)
    try {
      await pool.query('UPDATE reservas SET asiste = ? WHERE id = ?', [asiste ? 1 : 0, id]);
    } catch (e) {
      // Si la columna no existe, continuar sin fallar
    }

    let reparacionId = null;
    if (asiste) {
      // Verificar columnas disponibles en reparaciones para incluir patente si existe
      let insertSql = 'INSERT INTO reparaciones (cliente, vehiculo, problema, estado, costo, fecha';
      let insertVals = [r.cliente, r.vehiculo, r.servicio || r.motivo || 'Servicio', 'pending', 0];
      const [repCols] = await pool.query('SHOW COLUMNS FROM reparaciones');
      const repNames = repCols.map(c => c.Field);
      const includePatente = repNames.includes('patente');
      const includeTaller = repNames.includes('taller_id');
      if (includePatente && includeTaller) {
        insertSql = 'INSERT INTO reparaciones (cliente, vehiculo, problema, estado, costo, fecha, patente, taller_id';
        insertVals = [r.cliente, r.vehiculo, r.servicio || r.motivo || 'Servicio', 'pending', 0, r.patente || null, req.tenantId];
      } else if (includePatente) {
        insertSql = 'INSERT INTO reparaciones (cliente, vehiculo, problema, estado, costo, fecha, patente';
        insertVals = [r.cliente, r.vehiculo, r.servicio || r.motivo || 'Servicio', 'pending', 0, r.patente || null];
      } else if (includeTaller) {
        insertSql = 'INSERT INTO reparaciones (cliente, vehiculo, problema, estado, costo, fecha, taller_id';
        insertVals = [r.cliente, r.vehiculo, r.servicio || r.motivo || 'Servicio', 'pending', 0, req.tenantId];
      }
      insertSql += (includePatente && includeTaller)
        ? ') VALUES (?, ?, ?, ?, ?, NOW(), ?, ?)'
        : includePatente
          ? ') VALUES (?, ?, ?, ?, ?, NOW(), ?)'
          : includeTaller
            ? ') VALUES (?, ?, ?, ?, ?, NOW(), ?)'
            : ') VALUES (?, ?, ?, ?, ?, NOW())';
      const [result] = await pool.query(insertSql, insertVals);
      reparacionId = result.insertId;
    }

    return res.json({ ok: true, reparacionId });
  } catch (e) {
    console.error('Asistencia reserva error:', e.code || e.message);
    return res.status(500).json({ error: 'Error confirmando asistencia' });
  }
});

// Eliminar reserva
router.delete('/:id', authRequired, withTenant, async (req, res) => {
  try {
    const { id } = req.params;
    await assertWritable(pool, 'reservas', id, req.tenantId);
    await pool.query('DELETE FROM reservas WHERE id = ? AND taller_id = ?', [id, req.tenantId]);

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Error eliminando reserva' });
  }
});

export default router;
