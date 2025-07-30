import { Router } from 'express';
import { pool } from './db.js';

const router = Router();

// Listar historial
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM historial_vehiculos');
    res.json(rows);
  } catch (e) {
  console.error(e); // <--- Esto imprime el error en los logs de Render
  res.status(500).json({ error: 'Error consultando historial' });
}
});

// Crear registro de historial
router.post('/', async (req, res) => {
  try {
    const { vehiculo, placas, cliente, fecha, servicio, taller } = req.body;
    const [result] = await pool.query(
      'INSERT INTO historial_vehiculos (vehiculo, placas, cliente, fecha, servicio, taller) VALUES (?, ?, ?, ?, ?, ?)',
      [vehiculo, placas, cliente, fecha, servicio, taller]
    );
    res.status(201).json({ id: result.insertId, vehiculo, placas, cliente, fecha, servicio, taller });
  } catch (e) {
    res.status(500).json({ error: 'Error creando historial' });
  }
});

// Eliminar registro de historial
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM historial_vehiculos WHERE id = ?', [id]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Error eliminando historial' });
  }
});

export default router;
