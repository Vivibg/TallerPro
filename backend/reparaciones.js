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

    // Construir SET dinámico
    const fields = [];
    const values = [];
    if (problema !== undefined) { fields.push('problema = ?'); values.push(problema); }
    if (estado !== undefined) { fields.push('estado = ?'); values.push(estado); }
    if (costo !== undefined) { fields.push('costo = ?'); values.push(costo); }
    if (fecha !== undefined) { fields.push('fecha = ?'); values.push(fecha); }
    // extendidos
    if (cliente !== undefined) { fields.push('cliente = ?'); values.push(cliente); }
    if (telefono !== undefined) { fields.push('telefono = ?'); values.push(telefono); }
    if (email !== undefined) { fields.push('email = ?'); values.push(email); }
    if (vehiculo !== undefined) { fields.push('vehiculo = ?'); values.push(vehiculo); }
    if (marca !== undefined) { fields.push('marca = ?'); values.push(marca); }
    if (modelo !== undefined) { fields.push('modelo = ?'); values.push(modelo); }
    if (anio !== undefined) { fields.push('anio = ?'); values.push(anio); }
    if (patente !== undefined) { fields.push('patente = ?'); values.push(patente); }
    if (kilometraje !== undefined) { fields.push('kilometraje = ?'); values.push(kilometraje); }
    if (observaciones !== undefined) { fields.push('observaciones = ?'); values.push(observaciones); }
    if (garantiaPeriodo !== undefined) { fields.push('garantiaPeriodo = ?'); values.push(garantiaPeriodo); }
    if (garantiaCondiciones !== undefined) { fields.push('garantiaCondiciones = ?'); values.push(garantiaCondiciones); }
    if (taller !== undefined) { fields.push('taller = ?'); values.push(taller); }
    if (mecanico !== undefined) { fields.push('mecanico = ?'); values.push(mecanico); }
    if (servicio !== undefined) { fields.push('servicio = ?'); values.push(servicio); }

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
