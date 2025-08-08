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

const app = express();

const allowedOrigins = [
  'https://tallerpro-vivian-branas-projects.vercel.app'
  // Puedes agregar 'http://localhost:3000' si quieres probar localmente con React
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

app.use('/api/reparaciones', reparacionesRouter);
app.use('/api/inventario', inventarioRouter);
app.use('/api/clientes', clientesRouter);
app.use('/api/historial', historialRouter);
app.use('/api/reservas', reservasRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend API corriendo en http://localhost:${PORT}`);
});
