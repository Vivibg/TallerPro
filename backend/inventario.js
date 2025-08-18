import { Router } from 'express';
import { pool } from './db.js';

const router = Router();

function calcularEstado(stock, minimo) {
  return stock <= minimo ? 'Crítico' : 'Disponible';
}

// Listar inventario
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM inventario');
    const inventario = rows.map(item => ({
      ...item,
      estado: calcularEstado(item.stock, item.minimo)
    }));
    res.json(inventario);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error consultando inventario' });
  }
});

// Crear producto
router.post('/', async (req, res) => {
  try {
    const { producto, categoria, unidad, stock, minimo, maximo, precio, costo_unitario } = req.body;
    const total = Number(stock) * Number(costo_unitario);
    const estado = calcularEstado(stock, minimo);
    const [result] = await pool.query(
      'INSERT INTO inventario (producto, categoria, unidad, stock, minimo, maximo, precio, costo_unitario, total, estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [producto, categoria, unidad, stock, minimo, maximo, precio, costo_unitario, total, estado]
    );
    res.status(201).json({ id: result.insertId, producto, categoria, unidad, stock, minimo, maximo, precio, costo_unitario, total, estado });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error creando producto' });
  }
});

// Editar producto
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { producto, categoria, unidad, stock, minimo, maximo, precio, costo_unitario } = req.body;
    const total = Number(stock) * Number(costo_unitario);
    const estado = calcularEstado(stock, minimo);
    await pool.query(
      'UPDATE inventario SET producto=?, categoria=?, unidad=?, stock=?, minimo=?, maximo=?, precio=?, costo_unitario=?, total=?, estado=? WHERE id=?',
      [producto, categoria, unidad, stock, minimo, maximo, precio, costo_unitario, total, estado, id]
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
