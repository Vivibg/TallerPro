// backend/reservas.js
import express from 'express';
import { pool } from './db.js';

const router = express.Router();


router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM reservas ORDER BY fecha, hora');
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'Error consultando reservas' });
  }
});

// Crear nueva reserva
router.post('/', async (req, res) => {
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


router.put('/:id/asistencia', async (req, res) => {
  try {
    const { id } = req.params;
    let { asiste } = req.body || {};
   
    asiste = asiste === true || asiste === 'true' || asiste === 1 || asiste === '1';

    const [rows] = await pool.query('SELECT * FROM reservas WHERE id = ?', [id]);
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
      if (repNames.includes('patente')) {
        insertSql = 'INSERT INTO reparaciones (cliente, vehiculo, problema, estado, costo, fecha, patente';
        insertVals = [r.cliente, r.vehiculo, r.servicio || r.motivo || 'Servicio', 'pending', 0, r.patente || null];
      }
      insertSql += repNames.includes('patente') ? ') VALUES (?, ?, ?, ?, ?, NOW(), ?)' : ') VALUES (?, ?, ?, ?, ?, NOW())';
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
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM reservas WHERE id = ?', [id]);

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Error eliminando reserva' });
  }
});

export default router;

