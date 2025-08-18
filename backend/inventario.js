import { Router } from 'express';
import { pool } from './db.js';

const router = Router();

// Función para determinar estado según stock y mínimo
function calcularEstado(stock, minimo) {
  return stock <= minimo ? 'Crítico' : 'Disponible';
}

// Listar inventario (estado actualizado)
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM inventario');
    // Opcional: recalcula estado en la respuesta
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
    const { producto, categoria, stock, minimo, precio } = req.body;
    const estado = calcularEstado(stock, minimo);
    const [result] = await pool.query(
      'INSERT INTO inventario (producto, categoria, stock, minimo, precio, estado) VALUES (?, ?, ?, ?, ?, ?)',
      [producto, categoria, stock, minimo, precio, estado]
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
    const { producto, categoria, stock, minimo, precio } = req.body;
    const estado = calcularEstado(stock, minimo);
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

// Descontar stock por reparación
router.post('/descontar', async (req, res) => {
  // Espera [{ productoId, cantidad }]
  const items = req.body.items;
  if (!Array.isArray(items)) {
    return res.status(400).json({ error: 'Formato inválido' });
  }
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    for (const { productoId, cantidad } of items) {
      // Obtiene stock y mínimo actual
      const [[prod]] = await connection.query('SELECT stock, minimo FROM inventario WHERE id = ?', [productoId]);
      if (!prod) throw new Error('Producto no encontrado');
      const nuevoStock = Math.max(0, prod.stock - cantidad);
      const nuevoEstado = calcularEstado(nuevoStock, prod.minimo);
      await connection.query(
        'UPDATE inventario SET stock=?, estado=? WHERE id=?',
        [nuevoStock, nuevoEstado, productoId]
      );
    }
    await connection.commit();
    res.json({ ok: true });
  } catch (e) {
    await connection.rollback();
    console.error(e);
    res.status(500).json({ error: 'Error descontando inventario' });
  } finally {
    connection.release();
  }
});

export default router;
