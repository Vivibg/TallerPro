import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { pool } from './db.js';
import clientesRouter from './clientes.js';
import reparacionesRouter from './reparaciones.js';
import inventarioRouter from './inventario.js';
import historialRouter from './historial.js';
import reservasRouter from './reservas.js';
import authRouter from './auth.js';
import { authRequired, roleRequired } from './middleware/auth.js';

const app = express();

const allowedOrigins = [
  'https://tallerpro-vivian-branas-projects.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000'
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

// Salud pública para verificación de despliegue
app.get('/health', (req, res) => res.json({ ok: true }));

// Rutas de autenticación (Google, register, login, me)
app.use('/api/auth', authRouter);

// Rutas protegidas
// Cliente (y admin) pueden acceder
app.use('/api/reservas', authRequired, reservasRouter);
app.use('/api/historial', authRequired, historialRouter);

// Solo admin
app.use('/api/inventario', authRequired, roleRequired('admin'), inventarioRouter);
app.use('/api/reparaciones', authRequired, roleRequired('admin'), reparacionesRouter);
app.use('/api/clientes', authRequired, roleRequired('admin'), clientesRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend API corriendo en http://localhost:${PORT}`);
});
