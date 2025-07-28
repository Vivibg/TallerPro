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
