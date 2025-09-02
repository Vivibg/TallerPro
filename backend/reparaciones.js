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
    const { cliente, vehiculo, problema, estado, costo, fecha, patente } = req.body || {};
    // Reutilizar registro 'en progreso' por patente o por (cliente+vehiculo)
    try {
      const estadosProg = ['progress','process','en proceso','en progreso'];
      let row = null;
      if (patente) {
        const [rows] = await pool.query(
          `SELECT * FROM reparaciones WHERE LOWER(patente) = LOWER(?) AND LOWER(COALESCE(estado,'pending')) IN (${estadosProg.map(()=>'?').join(',')}) ORDER BY id DESC LIMIT 1`,
          [patente, ...estadosProg]
        );
        row = rows[0] || null;
      }
      if (!row && cliente && vehiculo) {
        const [rows] = await pool.query(
          `SELECT * FROM reparaciones WHERE LOWER(cliente) = LOWER(?) AND LOWER(vehiculo) = LOWER(?) AND LOWER(COALESCE(estado,'pending')) IN (${estadosProg.map(()=>'?').join(',')}) ORDER BY id DESC LIMIT 1`,
          [cliente, vehiculo, ...estadosProg]
        );
        row = rows[0] || null;
      }
      if (row) {
        return res.status(200).json(row);
      }
    } catch (dedupeErr) {
      console.warn('No se pudo deduplicar en POST /reparaciones:', dedupeErr?.code || dedupeErr?.message);
    }

    const est = estado || 'pending';
    const [result] = await pool.query(
      'INSERT INTO reparaciones (cliente, vehiculo, problema, estado, costo, fecha, patente) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [cliente || null, vehiculo || null, problema || null, est, costo || null, fecha || null, patente || null]
    );
    res.status(201).json({ id: result.insertId, cliente, vehiculo, problema, estado: est, costo, fecha, patente });
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
      observaciones, garantiaPeriodo, garantiaCondiciones, taller, mecanico, servicio,
      diagnostico, trabajos
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
    // punto 4 y 5 de la ficha
    addIfCol('diagnostico', diagnostico);
    addIfCol('trabajos', trabajos);
    // desglose de costos si existen las columnas
    addIfCol('costo_mano_obra', req.body?.costo_mano_obra);
    addIfCol('costo_insumos', req.body?.costo_insumos);
    // compatibilidad con nombres alternativos de columnas
    if (!fields.some(f => f.startsWith('costo_mano_obra')) && repNames.has('costoManoObra')) { fields.push('costoManoObra = ?'); values.push(req.body?.costo_mano_obra); }
    if (!fields.some(f => f.startsWith('costo_insumos')) && repNames.has('costoInsumos')) { fields.push('costoInsumos = ?'); values.push(req.body?.costo_insumos); }
    // repuestos como JSON si existe columna
    if (repNames.has('repuestos')) {
      try {
        const repuestosVal = Array.isArray(req.body?.repuestos) ? JSON.stringify(req.body.repuestos) : (typeof req.body?.repuestos === 'string' ? req.body.repuestos : null);
        if (repuestosVal !== null) { fields.push('repuestos = ?'); values.push(repuestosVal); }
      } catch {}
    }
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
    // actualizar 'servicio' solo si la columna existe
    addIfCol('servicio', servicio);
    if (!fields.some(f => f.startsWith('servicio')) && repNames.has('tipo_servicio')) { fields.push('tipo_servicio = ?'); values.push(servicio); }
    if (!fields.some(f => f.includes('servicio')) && repNames.has('tipoServicio')) { fields.push('tipoServicio = ?'); values.push(servicio); }

    if (fields.length > 0) {
      values.push(id);
      await pool.query(`UPDATE reparaciones SET ${fields.join(', ')} WHERE id = ?`, values);
    }

    // Upsert de historial se maneja en el bloque normalizado inferior

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

        // Valores base: preferir valores llegados en este PUT, luego los actuales en DB
        const safeVehiculo = (req.body?.vehiculo ?? current.vehiculo ?? 'Vehículo');
        const safeCliente = (req.body?.cliente ?? current.cliente ?? 'Cliente');
        const safeServicio = (req.body?.problema ?? current.problema ?? req.body?.servicio ?? 'Servicio');
        const safeTaller = (req.body?.taller ?? current.taller ?? process.env.TALLER_NOMBRE ?? 'Taller');
        const safePatente = (req.body?.patente ?? current.patente ?? '');
        const safeMecanico = (req.body?.mecanico ?? current.mecanico ?? '').toString();
        const safeDiagnostico = (req.body?.diagnostico ?? current.diagnostico ?? '')?.toString?.() || '';
        const safeTrabajos = (req.body?.trabajos ?? current.trabajos ?? '')?.toString?.() || '';
        const safeObs = (req.body?.observaciones ?? current.observaciones ?? '')?.toString?.() || '';
        const safeGarantiaPeriodo = (req.body?.garantiaPeriodo ?? current.garantiaPeriodo ?? '')?.toString?.() || '';
        const safeGarantiaCond = (req.body?.garantiaCondiciones ?? current.garantiaCondiciones ?? '')?.toString?.() || '';

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
          if (name === 'costo_total') return { val: (req.body?.costo ?? current.costo ?? 0) };
          if (name === 'costo_mano_obra') return { val: (req.body?.costo_mano_obra ?? 0) };
          if (name === 'costo_insumos') return { val: (req.body?.costo_insumos ?? 0) };
          if (name === 'diagnostico') return { val: safeDiagnostico };
          if (name === 'trabajos') return { val: safeTrabajos };
          if (name === 'observaciones') return { val: safeObs };
          if (name === 'garantiaPeriodo') return { val: safeGarantiaPeriodo };
          if (name === 'garantiaCondiciones') return { val: safeGarantiaCond };
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
              addIf('diagnostico', safeDiagnostico);
              addIf('trabajos', safeTrabajos);
              addIf('observaciones', safeObs);
              addIf('garantiaPeriodo', safeGarantiaPeriodo);
              addIf('garantiaCondiciones', safeGarantiaCond);
              if (names.includes('fecha')) common.push('fecha');
              addIf('servicio', safeServicio);
              addIf('taller', safeTaller);
              addIf('mecanico', safeMecanico);
              // Costos si existen
              addIf('costo_total', (req.body?.costo ?? current.costo ?? 0));
              addIf('costo_mano_obra', (req.body?.costo_mano_obra ?? 0));
              addIf('costo_insumos', (req.body?.costo_insumos ?? 0));
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

    // Sincronizar tabla 'clientes' (upsert por patente si existe, si no por nombre)
    try {
      const [cliCols] = await pool.query('SHOW COLUMNS FROM clientes');
      const cliNames = new Set(cliCols.map(c => c.Field));
      const useCols = (...names) => names.filter(n => cliNames.has(n));

      const cNombre = req.body?.cliente ?? current.cliente ?? null;
      const cTelefono = req.body?.telefono ?? current.telefono ?? null;
      const cEmail = req.body?.email ?? current.email ?? null;
      const cVehiculo = req.body?.vehiculo ?? current.vehiculo ?? null;
      const cPatente = req.body?.patente ?? current.patente ?? null;

      if (cNombre || cPatente) {
        let existing = null;
        if (cPatente && cliNames.has('patente')) {
          const [rows] = await pool.query('SELECT * FROM clientes WHERE patente = ? LIMIT 1', [cPatente]);
          existing = rows[0] || null;
        }
        if (!existing && cNombre) {
          const [rows] = await pool.query('SELECT * FROM clientes WHERE nombre = ? LIMIT 1', [cNombre]);
          existing = rows[0] || null;
        }

        const colsToSet = useCols('nombre','telefono','email','vehiculo','patente');
        const valsToSet = [];
        const pushIf = (name, val) => { if (colsToSet.includes(name)) valsToSet.push(val ?? null); };
        // Build SET for insert/update
        pushIf('nombre', cNombre);
        pushIf('telefono', cTelefono);
        pushIf('email', cEmail);
        pushIf('vehiculo', cVehiculo);
        pushIf('patente', cPatente);

        if (existing) {
          const setPairs = colsToSet.map(c => `${c} = ?`).join(', ');
          const ultima = cliNames.has('ultimaVisita') ? ', ultimaVisita = NOW()' : '';
          await pool.query(`UPDATE clientes SET ${setPairs}${ultima} WHERE id = ?`, [...valsToSet, existing.id]);
        } else {
          const cols = [...colsToSet];
          const placeholders = cols.map(() => '?');
          let sql = `INSERT INTO clientes (${cols.join(', ')}`;
          let placeholdersSql = `VALUES (${placeholders.join(', ')}`;
          if (cliNames.has('ultimaVisita')) { sql += ', ultimaVisita'; placeholdersSql += ', NOW()'; }
          sql += ') '; placeholdersSql += ')';
          await pool.query(sql + placeholdersSql, valsToSet);
        }
      }
    } catch (e) {
      console.error('No se pudo sincronizar clientes:', e.code || e.message);
    }

    // Sincronizar tabla 'reservas': insertar si no existe una para misma patente+fecha
    try {
      const [resCols] = await pool.query('SHOW COLUMNS FROM reservas');
      const resNames = new Set(resCols.map(c => c.Field));
      const rCliente = req.body?.cliente ?? current.cliente ?? null;
      const rVehiculo = req.body?.vehiculo ?? current.vehiculo ?? null;
      const rPatente = req.body?.patente ?? current.patente ?? null;
      const rServicio = req.body?.problema ?? current.problema ?? null;
      const rFechaNorm = normalizeFecha(req.body?.fecha ?? current.fecha ?? new Date());
      const rHora = (() => { try { const d = new Date(req.body?.fecha ?? current.fecha ?? Date.now()); return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:00`; } catch { return null; } })();
      if (resNames.size && (rCliente || rPatente || rVehiculo)) {
        let exists = false;
        if (rPatente && rFechaNorm && resNames.has('patente') && resNames.has('fecha')) {
          const [rows] = await pool.query('SELECT id FROM reservas WHERE patente = ? AND DATE(fecha) = DATE(?) LIMIT 1', [rPatente, rFechaNorm]);
          exists = !!rows[0];
        }
        if (!exists) {
          // Build dynamic insert
          const cols = [];
          const vals = [];
          const pushIf = (name, val) => { if (val !== null && val !== undefined && resNames.has(name)) { cols.push(name); vals.push(val); } };
          pushIf('cliente', rCliente);
          pushIf('vehiculo', rVehiculo);
          pushIf('patente', rPatente);
          pushIf('servicio', rServicio);
          pushIf('fecha', rFechaNorm);
          pushIf('hora', rHora);
          if (cols.length > 0) {
            const placeholders = cols.map(() => '?').join(', ');
            const sql = `INSERT INTO reservas (${cols.join(', ')}) VALUES (${placeholders})`;
            await pool.query(sql, vals);
          }
        }
      }
    } catch (e) {
      console.error('No se pudo sincronizar reservas:', e.code || e.message);
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
