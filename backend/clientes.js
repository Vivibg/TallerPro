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
    const { nombre, telefono, email, vehiculo, patente, ultimaVisita, desde } = req.body;
    const [result] = await pool.query(
      'INSERT INTO clientes (nombre, telefono, email, vehiculo, patente, ultimaVisita, desde) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [nombre, telefono, email, vehiculo, patente, ultimaVisita, desde]
    );
    res.status(201).json({ id: result.insertId, nombre, telefono, email, vehiculo, patente, ultimaVisita, desde });
  } catch (e) {
    res.status(500).json({ error: 'Error creando cliente' });
  }
});

// Actualizar cliente (para uso interno desde reservas u otros módulos)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, telefono, email, vehiculo, patente, ultimaVisita, desde } = req.body;
    await pool.query(
      'UPDATE clientes SET nombre = ?, telefono = ?, email = ?, vehiculo = ?, patente = ?, ultimaVisita = ?, desde = ? WHERE id = ?',
      [nombre, telefono, email, vehiculo, patente, ultimaVisita, desde, id]
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Error actualizando cliente' });
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

// Endpoint para actualizar por nombre (útil para sincronización automática)
router.put('/byname/:nombre', async (req, res) => {
  try {
    const { nombre } = req.params;
    const { telefono, email, vehiculo, patente, ultimaVisita } = req.body;
    await pool.query(
      'UPDATE clientes SET telefono = ?, email = ?, vehiculo = ?, patente = ?, ultimaVisita = ? WHERE nombre = ?',
      [telefono, email, vehiculo, patente, ultimaVisita, nombre]
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Error actualizando cliente por nombre' });
  }
});

export default router;
