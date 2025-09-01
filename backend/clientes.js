import { Router } from 'express';
import { pool } from './db.js';

const router = Router();

// Listar todos los clientes
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM clientes');
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'Error consultando clientes' });
  }
});

// Crear cliente
router.post('/', async (req, res) => {
  try {
    const { nombre, telefono, email, vehiculo, ultimaVisita, desde } = req.body;
    const [result] = await pool.query(
      'INSERT INTO clientes (nombre, telefono, email, vehiculo, ultimaVisita, desde) VALUES (?, ?, ?, ?, ?, ?)',
      [nombre, telefono, email, vehiculo, ultimaVisita, desde]
    );
    res.status(201).json({ id: result.insertId, nombre, telefono, email, vehiculo, ultimaVisita, desde });
  } catch (e) {
    res.status(500).json({ error: 'Error creando cliente' });
  }
});

// Eliminar cliente
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM clientes WHERE id = ?', [id]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Error eliminando cliente' });
  }
});

export default router;
