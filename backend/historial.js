import { Router } from 'express';
import { pool } from './db.js';

const router = Router();

// Listar historial
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM historial_vehiculos');
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error consultando historial' });
  }
});

// Listar historial con resumen de ficha de reparación 
router.get('/con-ficha', async (req, res) => {
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
    // Log de depuración para ver los datos recibidos
    console.log('POST /api/historial body:', req.body);
    // Función de seguridad para evitar undefined/null
    const safe = (v) => (v === undefined || v === null ? '' : v);
    const { vehiculo, patente, cliente, fecha, servicio, taller } = req.body;
    const [result] = await pool.query(
      'INSERT INTO historial_vehiculos (vehiculo, patente, cliente, fecha, servicio, taller) VALUES (?, ?, ?, ?, ?, ?)',
      [
        safe(vehiculo),
        safe(patente),
        safe(cliente),
        safe(fecha),
        safe(servicio),
        safe(taller)
      ]
    );
    res.status(201).json({
      id: result.insertId,
      vehiculo: safe(vehiculo),
      patente: safe(patente),
      cliente: safe(cliente),
      fecha: safe(fecha),
      servicio: safe(servicio),
      taller: safe(taller)
    });
  } catch (e) {
    console.error('Error creando historial:', e);
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
    console.error(e);
    res.status(500).json({ error: 'Error eliminando historial' });
  }
});

export default router;
