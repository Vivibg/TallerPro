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

// Salud de base de datos (diagnóstico)
app.get('/health/db', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 AS ok');
    res.json({ db: 'up', result: rows[0] });
  } catch (e) {
    console.error('DB health error:', e.code, e.sqlMessage || e.message);
    res.status(500).json({ db: 'down' });
  }
});

// Rutas de autenticación (Google, register, login, me)
app.use('/api/auth', authRouter);

// Inspector temporal de rutas (diagnóstico)
app.get('/routes', (req, res) => {
  const collect = (stack, base = '') => {
    const out = [];
    stack.forEach(layer => {
      if (layer.route && layer.route.path) {
        const methods = Object.keys(layer.route.methods)
          .filter(k => layer.route.methods[k])
          .map(m => m.toUpperCase())
          .join(',');
        out.push(`${methods} ${base}${layer.route.path}`);
      } else if (layer.name === 'router' && layer.handle?.stack) {
        const prefix = layer.regexp && layer.regexp.source
          ? layer.regexp.source
              .replace('^\\', '/')
              .replace('\\/?(?=\\/|$)', '')
              .replace('(?=\\/|$)', '')
              .replace('$/i', '')
          : '';
        out.push(...collect(layer.handle.stack, prefix));
      }
    });
    return out;
  };
  res.json({ routes: collect(app._router.stack) });
});

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
