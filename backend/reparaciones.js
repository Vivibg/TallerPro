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
    const {
      problema, estado, costo, fecha,
      cliente, telefono, email, vehiculo, marca, modelo, anio, patente, kilometraje,
      observaciones, garantiaPeriodo, garantiaCondiciones, taller, mecanico, servicio
    } = req.body || {};

    // Obtener estado actual antes de actualizar
    const [currentRows] = await pool.query('SELECT * FROM reparaciones WHERE id = ?', [id]);
    const current = currentRows[0];
    if (!current) return res.status(404).json({ error: 'Reparación no encontrada' });

    // Descubrir columnas existentes para evitar errores por columnas faltantes
    const [repCols] = await pool.query('SHOW COLUMNS FROM reparaciones');
    const repNames = new Set(repCols.map(c => c.Field));
    const fechaCol = repCols.find(c => c.Field === 'fecha');

    const pad2 = (n) => String(n).padStart(2, '0');
    const toMySQLDate = (d) => `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
    const toMySQLDateTime = (d) => `${toMySQLDate(d)} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
    const normalizeFecha = (val) => {
      if (val === undefined || val === null || !repNames.has('fecha')) return undefined;
      try {
        // Parse admite string ISO o número timestamp
        const d = new Date(val);
        if (isNaN(d.getTime())) return undefined;
        const t = (fechaCol?.Type || '').toLowerCase();
        if (t.includes('datetime') || t.includes('timestamp')) return toMySQLDateTime(d);
        // por defecto DATE
        return toMySQLDate(d);
      } catch { return undefined; }
    };

    // Helper para añadir solo si existe la columna
    const fields = [];
    const values = [];
    const addIfCol = (col, val) => {
      if (val !== undefined && repNames.has(col)) { fields.push(`${col} = ?`); values.push(val); }
    };

    addIfCol('problema', problema);
    addIfCol('estado', estado);
    addIfCol('costo', costo);
    addIfCol('fecha', normalizeFecha(fecha));
    // extendidos
    addIfCol('cliente', cliente);
    addIfCol('telefono', telefono);
    addIfCol('email', email);
    addIfCol('vehiculo', vehiculo);
    addIfCol('marca', marca);
    addIfCol('modelo', modelo);
    addIfCol('anio', anio);
    addIfCol('patente', patente);
    addIfCol('kilometraje', kilometraje);
    addIfCol('observaciones', observaciones);
    addIfCol('garantiaPeriodo', garantiaPeriodo);
    addIfCol('garantiaCondiciones', garantiaCondiciones);
    addIfCol('taller', taller);
    addIfCol('mecanico', mecanico);
    // 'servicio' puede no existir en algunas bases, no intentar actualizarlo

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

        // Valores base
        const safeVehiculo = current.vehiculo || 'Vehículo';
        const safeCliente = current.cliente || 'Cliente';
        const safeServicio = (problema !== undefined ? problema : current.problema) || 'Servicio';
        const safeTaller = process.env.TALLER_NOMBRE || 'Taller';
        const safePatente = current.patente || '';
        const safeMecanico = (req.body?.mecanico ?? current.mecanico ?? '').toString();

        // Decidir valores por columna, cubriendo NOT NULL sin default
        const hFields = [];
        const hValues = [];
        const valueFor = (col) => {
          const name = col.Field;
          if (name === 'id') return { skip: true };
          if (name === 'reparacion_id') return { val: Number(id) || 0 };
          if (name === 'vehiculo') return { val: safeVehiculo };
          if (name === 'cliente') return { val: safeCliente };
          if (name === 'servicio') return { val: safeServicio };
          if (name === 'taller') return { val: safeTaller };
          if (name === 'mecanico') return { val: safeMecanico };
          if (name === 'patente') return { val: safePatente };
          if (name === 'placas') return { skip: true };
          if (name === 'fecha' || name === 'created_at' || name === 'updated_at') return { now: true };
          // Para otras columnas, si son NOT NULL sin default, proveer por tipo
          if (col.Null === 'NO' && col.Default === null) {
            const type = (col.Type || '').toLowerCase();
            if (type.includes('int') || type.includes('decimal') || type.includes('float') || type.includes('double')) return { val: 0 };
            if (type.includes('date') || type.includes('time')) return { now: true };
            return { val: '' }; // varchar/text
          }
          // Si permite NULL, podemos omitir
          return { skip: true };
        };

        for (const col of cols) {
          const d = valueFor(col);
          if (d.skip) continue;
          hFields.push(col.Field);
          if (d.now) {
            hValues.push('__NOW__'); // marcador temporal, reemplazamos en SQL
          } else {
            hValues.push(d.val ?? null);
          }
        }

        if (hFields.length > 0) {
          try {
            // Construir SQL, reemplazando marcadores __NOW__ por NOW()
            const placeholders = hValues.map(v => v === '__NOW__' ? 'NOW()' : '?');
            const sql = `INSERT INTO historial_vehiculos (${hFields.join(', ')}) VALUES (${placeholders.join(', ')})`;
            const realValues = hValues.filter(v => v !== '__NOW__');
            await pool.query(sql, realValues);
          } catch (err) {
            // Fallback duro si alguna columna NOT NULL quedó sin cubrir
            if (err && err.code === 'ER_BAD_NULL_ERROR') {
              const common = [];
              const vals = [];
              const addIf = (name, val) => { if (names.includes(name)) { common.push(name); vals.push(val); } };
              addIf('reparacion_id', Number(id) || 0);
              addIf('vehiculo', safeVehiculo);
              addIf('patente', safePatente);
              addIf('cliente', safeCliente);
              if (names.includes('fecha')) common.push('fecha');
              addIf('servicio', safeServicio);
              addIf('taller', safeTaller);
              addIf('mecanico', safeMecanico);
              if (common.length > 0) {
                const placeholders2 = common.map(f => f === 'fecha' ? 'NOW()' : '?');
                const sql2 = `INSERT INTO historial_vehiculos (${common.join(', ')}) VALUES (${placeholders2.join(', ')})`;
                await pool.query(sql2, vals);
              } else {
                throw err;
              }
            } else {
              throw err;
            }
          }
        }
      } catch (e) {
        // No bloquear la respuesta si historial falla
        console.error('No se pudo registrar en historial:', e.code || e.message, e.sqlMessage || '', {fields: 'computed dynamically'});
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
