// backend/reservas.js
import express from 'express';
import { pool } from './db.js';

const router = express.Router();

// Obtener todas las reservas
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
    const { cliente, servicio, vehiculo, patente, fecha, hora, motivo } = req.body;
    const [result] = await pool.query(
      'INSERT INTO reservas (cliente, servicio, vehiculo, patente, fecha, hora, motivo) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [cliente, servicio, vehiculo, patente, fecha, hora, motivo]
    );
    res.status(201).json({ id: result.insertId, cliente, servicio, vehiculo, patente, fecha, hora, motivo });
  } catch (e) {
    console.error('Error creando reserva:', e.code || e.message, e.sqlMessage || '');
    res.status(500).json({ error: 'Error creando reserva' });
  }
});

// Confirmar asistencia: crea una reparación a partir de la reserva
router.put('/:id/asistencia', async (req, res) => {
  try {
    const { id } = req.params;
    let { asiste } = req.body || {};
    // Normalizar a booleano
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
      // Crear reparación usando datos de la reserva
      const [result] = await pool.query(
        'INSERT INTO reparaciones (cliente, vehiculo, problema, estado, costo, fecha) VALUES (?, ?, ?, ?, ?, NOW())',
        [r.cliente, r.vehiculo, r.servicio || r.motivo || 'Servicio', 'pending', 0]
      );
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
