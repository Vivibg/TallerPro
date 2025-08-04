import express from 'express';
import { pool } from './db.js';

const router = express.Router();

// Obtener todas las reservas
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM reservas ORDER BY fecha, hora');
    res.json(rows);
  } catch (e) {
    console.error('Error consultando reservas:', e);
    res.status(500).json({ error: 'Error consultando reservas', details: e.message });
  }
});

// Crear nueva reserva
router.post('/', async (req, res) => {
  try {
    const { cliente, servicio, vehiculo, fecha, hora, motivo } = req.body;
    if (!cliente || !servicio || !vehiculo || !fecha || !hora || !motivo) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }
    const [result] = await pool.query(
      'INSERT INTO reservas (cliente, servicio, vehiculo, fecha, hora, motivo) VALUES (?, ?, ?, ?, ?, ?)',
      [cliente, servicio, vehiculo, fecha, hora, motivo]
    );
    res.status(201).json({ id: result.insertId, cliente, servicio, vehiculo, fecha, hora, motivo, asistio: null });
  } catch (e) {
    console.error('Error creando reserva:', e);
    res.status(500).json({ error: 'Error creando reserva', details: e.message });
  }
});

// Confirmar asistencia
router.put('/:id/asistencia', async (req, res) => {
  try {
    const { id } = req.params;
    const { asistio } = req.body;
    if (typeof asistio !== 'boolean') {
      return res.status(400).json({ error: 'El campo asistio debe ser booleano' });
    }
    await pool.query('UPDATE reservas SET asistio = ? WHERE id = ?', [asistio, id]);
    res.json({ ok: true });
  } catch (e) {
    console.error('Error actualizando asistencia:', e);
    res.status(500).json({ error: 'Error actualizando asistencia', details: e.message });
  }
});

// Eliminar reserva
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM reservas WHERE id = ?', [id]);
    res.json({ ok: true });
  } catch (e) {
    console.error('Error eliminando reserva:', e);
    res.status(500).json({ error: 'Error eliminando reserva', details: e.message });
  }
});

export default router;
