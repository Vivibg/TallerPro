import express from 'express';
import cors from 'cors';
import { pool } from './db.js';
import clientesRouter from './clientes.js';
import reparacionesRouter from './reparaciones.js';
import inventarioRouter from './inventario.js';
import historialRouter from './historial.js';
import reservasRouter from './reservas.js';

const app = express(); // ¡Esto es esencial!

const allowedOrigins = [
  'https://tallerpro-vivian-branas-projects.vercel.app'
];

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

// Si usas reservasRouter, elimina las rutas manuales para evitar conflicto
// app.get('/api/reservas', ...)
// app.post('/api/reservas', ...)
// app.delete('/api/reservas/:id', ...)

app.use('/api/reparaciones', reparacionesRouter);
app.use('/api/inventario', inventarioRouter);
app.use('/api/clientes', clientesRouter);
app.use('/api/historial', historialRouter);
app.use('/api/reservas', reservasRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend API corriendo en http://localhost:${PORT}`);
});
