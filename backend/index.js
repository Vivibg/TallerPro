import express from 'express';
import cors from 'cors';
import { pool } from './db.js';
import clientesRouter from './clientes.js';
import reparacionesRouter from './reparaciones.js';
import inventarioRouter from './inventario.js';
import historialRouter from './historial.js';

const app = express();
app.use(cors({
  origin: 'https://tallerpro-git-master-vivian-branas-projects.vercel.app', // Cambia por tu dominio real de Vercel
  credentials: true
}));
app.use(express.json());

// CRUD Reservas
app.get('/api/reservas', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM reservas');
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'Error consultando reservas' });
  }
});

app.post('/api/reservas', async (req, res) => {
  try {
    const { cliente, servicio, vehiculo, fecha, hora } = req.body;
    const [result] = await pool.query(
      'INSERT INTO reservas (cliente, servicio, vehiculo, fecha, hora) VALUES (?, ?, ?, ?, ?)',
      [cliente, servicio, vehiculo, fecha, hora]
    );
    res.status(201).json({ id: result.insertId, cliente, servicio, vehiculo, fecha, hora });
  } catch (e) {
    res.status(500).json({ error: 'Error creando reserva' });
  }
});

app.delete('/api/reservas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM reservas WHERE id = ?', [id]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Error eliminando reserva' });
  }
});


app.use('/api/reparaciones', reparacionesRouter);

app.use('/api/inventario', inventarioRouter);

app.use('/api/clientes', clientesRouter);

app.use('/api/historial', historialRouter);

app.listen(4000, () => {
  console.log('Backend API corriendo en http://localhost:4000');
});
