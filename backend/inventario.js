import { Router } from 'express';
import { pool } from './db.js';

const router = Router();

// Listar inventario
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM inventario');
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error consultando inventario' });
  }
});

// Crear producto
router.post('/', async (req, res) => {
  try {
    const { producto, categoria, stock, minimo, precio, estado } = req.body;
    const [result] = await pool.query(
      'INSERT INTO inventario (producto, categoria, stock, minimo, precio, estado) VALUES (?, ?, ?, ?, ?, ?)',
      [producto, categoria, stock, minimo, precio, estado || 'ok']
    );
    res.status(201).json({ id: result.insertId, producto, categoria, stock, minimo, precio, estado });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error creando producto' });
  }
});

// Editar producto
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { producto, categoria, stock, minimo, precio, estado } = req.body;
    await pool.query(
      'UPDATE inventario SET producto=?, categoria=?, stock=?, minimo=?, precio=?, estado=? WHERE id=?',
      [producto, categoria, stock, minimo, precio, estado, id]
    );
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error actualizando producto' });
  }
});

// Eliminar producto
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM inventario WHERE id = ?', [id]);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error eliminando producto' });
  }
});

export default router;
