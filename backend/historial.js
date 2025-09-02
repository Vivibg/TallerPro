import { Router } from 'express';
import { pool } from './db.js';

const router = Router();

// Listar historial
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM historial_vehiculos');
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'Error consultando historial' });
  }
});

// Crear registro de historial
router.post('/', async (req, res) => {
  try {
    const { reparacion_id, vehiculo, patente, placas, cliente, fecha, servicio, taller } = req.body || {};
    // Detectar columnas existentes según el modelo y el estado real de la BD
    const [cols] = await pool.query('SHOW COLUMNS FROM historial_vehiculos');
    const names = cols.map(c => c.Field);
    const fields = [];
    const values = [];
    const pushIf = (name, val) => { if (names.includes(name)) { fields.push(name); values.push(val ?? null); } };
    pushIf('reparacion_id', reparacion_id);
    pushIf('vehiculo', vehiculo);
    // Preferir 'patente'; si no existe, usar 'placas'
    if (names.includes('patente')) {
      pushIf('patente', patente ?? placas ?? null);
    } else {
      pushIf('placas', placas ?? patente ?? null);
    }
    pushIf('cliente', cliente);
    pushIf('fecha', fecha);
    pushIf('servicio', servicio);
    pushIf('taller', taller);

    if (fields.length === 0) return res.status(400).json({ error: 'Sin columnas válidas para insertar' });
    const placeholders = fields.map(() => '?').join(', ');
    const sql = `INSERT INTO historial_vehiculos (${fields.join(', ')}) VALUES (${placeholders})`;
    const [result] = await pool.query(sql, values);
    // Responder con eco de valores normalizados
    res.status(201).json({ id: result.insertId, reparacion_id, vehiculo, patente: patente ?? placas ?? null, cliente, fecha, servicio, taller });
  } catch (e) {
    console.error('Error creando historial:', e.code || e.message);
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
 
