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

// Listar historial con resumen de ficha de reparación (JOIN robusto solo por fecha)
router.get('/con-ficha', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT h.*, r.diagnostico, r.trabajos, r.repuestos, r.observaciones, r.garantiaPeriodo, r.garantiaCondiciones
      FROM historial_vehiculos h
      LEFT JOIN reparaciones r
        ON h.vehiculo = r.vehiculo
        AND h.cliente = r.cliente
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
