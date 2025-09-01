import { Router } from 'express';
import { pool } from './db.js';

const router = Router();

// Listar reparaciones
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM reparaciones');
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error consultando reparaciones' });
  }
});

// Obtener una reparación por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM reparaciones WHERE id = ?', [id]);
    const row = rows[0];
    if (!row) return res.status(404).json({ error: 'Reparación no encontrada' });
    res.json(row);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error consultando reparación' });
  }
});

// Crear reparación
router.post('/', async (req, res) => {
  try {
    const { cliente, vehiculo, problema, estado, costo, fecha } = req.body;
    const [result] = await pool.query(
      'INSERT INTO reparaciones (cliente, vehiculo, problema, estado, costo, fecha) VALUES (?, ?, ?, ?, ?, ?)',
      [cliente, vehiculo, problema, estado || 'pending', costo, fecha]
    );
    res.status(201).json({ id: result.insertId, cliente, vehiculo, problema, estado, costo, fecha });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error creando reparación' });
  }
});

// Actualizar reparación
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { problema, estado, costo, fecha } = req.body;
    // Construir SET dinámico
    const fields = [];
    const values = [];
    if (problema !== undefined) { fields.push('problema = ?'); values.push(problema); }
    if (estado !== undefined) { fields.push('estado = ?'); values.push(estado); }
    if (costo !== undefined) { fields.push('costo = ?'); values.push(costo); }
    if (fecha !== undefined) { fields.push('fecha = ?'); values.push(fecha); }
    if (fields.length === 0) return res.json({ ok: true });
    values.push(id);
    await pool.query(`UPDATE reparaciones SET ${fields.join(', ')} WHERE id = ?`, values);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error actualizando reparación' });
  }
});

// Eliminar reparación
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM reparaciones WHERE id = ?', [id]);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error eliminando reparación' });
  }
});

export default router;
 
