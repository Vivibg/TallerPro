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
  process.env.FRONTEND_ORIGIN, // p.ej. https://<tu-app>.vercel.app
  'https://tallerpro-vivian-branas-projects.vercel.app',
  'https://www.tallerpro.net/',
  'http://localhost:5173',
  'http://localhost:3000'
].filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    // Permitir requests sin origin (como Postman) o si está en la lista
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json());

// Salud pública para verificación de despliegue
app.get('/health', (req, res) => res.json({ ok: true }));

// Consulta pública por patente para Vista Cliente
app.get('/api/reparaciones/por-patente/:patente', async (req, res) => {
  try {
    const { patente } = req.params;
    // Buscar por coincidencia exacta de patente en tabla reparaciones
    const [rows] = await pool.query('SELECT * FROM reparaciones WHERE patente = ? ORDER BY fecha DESC', [patente]);
    // Sanitizar respuesta a los campos esperados por la vista pública
    const out = rows.map(r => ({
      fecha: r.fecha || null,
      diagnostico: r.diagnostico || null,
      trabajos: r.trabajos || null,
      estado: r.estado || null,
      costo: r.costo ?? null,
      taller: r.taller || null,
      mecanico: r.mecanico || null,
    }));
    res.json(out);
  } catch (e) {
    console.error('por-patente error:', e.code || e.message);
    res.status(500).json({ error: 'Error consultando por patente' });
  }
});

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

// Módulos: cualquier usuario autenticado puede acceder
app.use('/api/inventario', authRequired, inventarioRouter);
app.use('/api/reparaciones', authRequired, reparacionesRouter);
app.use('/api/clientes', authRequired, clientesRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend API corriendo en http://localhost:${PORT}`);
});
