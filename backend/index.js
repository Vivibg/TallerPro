import express from 'express';
import cors from 'cors';
import { pool } from './db.js';
import clientesRouter from './clientes.js';
import reparacionesRouter from './reparaciones.js';
import inventarioRouter from './inventario.js';
import historialRouter from './historial.js';
import reservasRouter from './reservas.js';

const cors = require('cors');

const allowedOrigins = [
  'https://tallerpro-vivian-branas-projects.vercel.app',
 app.use(cors({
  origin: function(origin, callback){
    // Permitir requests sin origin (como Postman) o si está en la lista
    if(!origin || allowedOrigins.indexOf(origin) !== -1){
      callback(null, true);
    }else{
      callback(new Error('Not allowed by CORS'));
    }
  }
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

app.use('/api/reservas', reservasRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend API corriendo en http://localhost:${PORT}`);
});
