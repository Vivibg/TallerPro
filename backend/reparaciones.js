import { Router } from 'express';
import { pool } from './db.js';

const router = Router();

// Listar reparaciones
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM reparaciones');
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error consultando reparaciones' });
  }
});

// Obtener una reparación por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM reparaciones WHERE id = ?', [id]);
    const row = rows[0];
    if (!row) return res.status(404).json({ error: 'Reparación no encontrada' });
    res.json(row);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error consultando reparación' });
  }
});

// Crear reparación
router.post('/', async (req, res) => {
  try {
    const { cliente, vehiculo, problema, estado, costo, fecha } = req.body;
    const [result] = await pool.query(
      'INSERT INTO reparaciones (cliente, vehiculo, problema, estado, costo, fecha) VALUES (?, ?, ?, ?, ?, ?)',
      [cliente, vehiculo, problema, estado || 'pending', costo, fecha]
    );
    res.status(201).json({ id: result.insertId, cliente, vehiculo, problema, estado, costo, fecha });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error creando reparación' });
  }
});

// Actualizar reparación
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { problema, estado, costo, fecha } = req.body || {};

    // Obtener estado actual antes de actualizar
    const [currentRows] = await pool.query('SELECT * FROM reparaciones WHERE id = ?', [id]);
    const current = currentRows[0];
    if (!current) return res.status(404).json({ error: 'Reparación no encontrada' });

    // Construir SET dinámico
    const fields = [];
    const values = [];
    if (problema !== undefined) { fields.push('problema = ?'); values.push(problema); }
    if (estado !== undefined) { fields.push('estado = ?'); values.push(estado); }
    if (costo !== undefined) { fields.push('costo = ?'); values.push(costo); }
    if (fecha !== undefined) { fields.push('fecha = ?'); values.push(fecha); }

    if (fields.length > 0) {
      values.push(id);
      await pool.query(`UPDATE reparaciones SET ${fields.join(', ')} WHERE id = ?`, values);
    }

    // Si pasa a 'progress' desde otro estado, registrar en historial
    const norm = (s) => {
      const v = (s || '').toString().toLowerCase().trim().replace(/_/g, ' ');
      if (v === 'progress' || v === 'en progreso' || v === 'enprogreso') return 'progress';
      if (v === 'pending' || v === 'pendiente') return 'pending';
      if (v === 'completed' || v === 'completado') return 'completed';
      return v;
    };
    const prevEstado = norm(current.estado);
    const newEstado = norm(estado !== undefined ? estado : current.estado);
    if (prevEstado !== 'progress' && newEstado === 'progress') {
      try {
        // Descubrir columnas de historial_vehiculos para insertar lo que exista
        const [cols] = await pool.query('SHOW COLUMNS FROM historial_vehiculos');
        const names = cols.map(c => c.Field);
        const hFields = [];
        const hValues = [];
        const pushIf = (name, val) => { if (names.includes(name)) { hFields.push(name); hValues.push(val ?? null); } };
        pushIf('reparacion_id', id);
        pushIf('vehiculo', current.vehiculo);
        // Preferir 'patente'; si no existe, usar 'placas'
        if (names.includes('patente')) {
          pushIf('patente', current.patente || null);
        } else {
          pushIf('placas', current.patente || null);
        }
        pushIf('cliente', current.cliente);
        // Fecha: si existe columna 'fecha', usar NOW() en SQL; si no, ignorar
        const hasFecha = names.includes('fecha');
        if (hasFecha) hFields.push('fecha');
        pushIf('servicio', problema !== undefined ? problema : current.problema);
        pushIf('taller', process.env.TALLER_NOMBRE || null);
        if (hFields.length > 0) {
          // Construir SQL con NOW() si 'fecha' va incluida
          let sql = `INSERT INTO historial_vehiculos (`;
          const placeholders = [];
          for (const f of hFields) {
            if (f !== 'fecha') placeholders.push('?');
          }
          sql += hFields.join(', ') + ') VALUES (' + hFields.map(f => f === 'fecha' ? 'NOW()' : '?').join(', ') + ')';
          await pool.query(sql, hValues);
        }
      } catch (e) {
        // No bloquear la respuesta si historial falla
        console.error('No se pudo registrar en historial:', e.code || e.message);
      }
    }

    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error actualizando reparación' });
  }
});

// Eliminar reparación
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM reparaciones WHERE id = ?', [id]);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error eliminando reparación' });
  }
});

export default router;
 
