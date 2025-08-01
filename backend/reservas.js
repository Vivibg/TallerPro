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
    const { cliente, servicio, vehiculo, fecha, hora } = req.body;
    const [result] = await pool.query(
      'INSERT INTO reservas (cliente, servicio, vehiculo, fecha, hora) VALUES (?, ?, ?, ?, ?)',
      [cliente, servicio, vehiculo, fecha, hora]
    );
    res.status(201).json({ id: result.insertId, cliente, servicio, vehiculo, fecha, hora });
  } catch (e) {
    res.status(500).json({ error: 'Error creando reserva' });
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