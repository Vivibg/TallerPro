import { Router } from 'express';
import { pool } from './db.js';

const router = Router();

// Función segura para la fecha
const safeDate = (v) => {
  if (!v || v === '') return new Date().toISOString().slice(0, 10);
  // Si ya está en formato YYYY-MM-DD, úsalo directo
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  // Si viene en formato ISO, extrae solo la fecha
  if (typeof v === 'string' && v.includes('T')) return v.split('T')[0];
  return v;
};

// Obtener todas las reparaciones o buscar por patente y fecha
router.get('/', async (req, res) => {
  const { patente, fecha } = req.query;
  let query = 'SELECT * FROM reparaciones WHERE 1=1';
  let params = [];
  if (patente) {
    query += ' AND patente = ?';
    params.push(patente);
  }
  if (fecha) {
    query += ' AND DATE(fecha) = DATE(?)';
    params.push(fecha);
  }
  try {
    const [rows] = await pool.query(query, params);
    const normalizados = rows.map(r => ({
      ...r,
      cliente: r.cliente && r.cliente.trim() ? r.cliente : 'Sin dato',
      vehiculo: r.vehiculo && r.vehiculo.trim() ? r.vehiculo : 'Sin dato',
      problema: r.problema && r.problema.trim() ? r.problema : 'Sin dato'
    }));
    res.json(normalizados);
  } catch (e) {
    console.error('Error buscando reparación:', e);
    res.status(500).json({ error: 'Error buscando reparación' });
  }
});

// Eliminar una reparación por ID
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM reparaciones WHERE id = ?', [id]);
    res.json({ ok: true });
  } catch (e) {
    console.error('Error eliminando reparación:', e);
    res.status(500).json({ error: 'Error eliminando reparación' });
  }
});

// Actualizar una reparación existente y sincronizar historial
router.put('/:id', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    const [rows] = await connection.query('SELECT cliente, vehiculo, problema, estado, patente, fecha FROM reparaciones WHERE id = ?', [id]);
    const reparacionActual = rows[0] || {};

    let {
      cliente, vehiculo, problema, estado, costo, fecha,
      telefono, email, marca, modelo, anio, patente, kilometraje,
      fallaReportada, diagnostico, trabajos, repuestos,
      observaciones, garantiaPeriodo, garantiaCondiciones
    } = req.body;

    const safe = (v, def = '') => (v === undefined || v === null ? def : v);
    const safeArray = (v) => Array.isArray(v) ? v : [];
    cliente = (cliente && cliente.trim() && cliente !== 'Sin dato') ? cliente : (reparacionActual.cliente || '');
    vehiculo = (vehiculo && vehiculo.trim() && vehiculo !== 'Sin dato') ? vehiculo : (reparacionActual.vehiculo || '');
    problema = (problema && problema.trim() && problema !== 'Sin dato') ? problema : (reparacionActual.problema || '');
    estado = safe(estado, reparacionActual.estado || 'pending');
    costo = safe(costo, 0);
    fecha = safeDate(fecha || reparacionActual.fecha);
    telefono = safe(telefono);
    email = safe(email);
    marca = safe(marca);
    modelo = safe(modelo);
    anio = safe(anio);
    patente = safe(patente || reparacionActual.patente);
    kilometraje = safe(kilometraje);
    fallaReportada = safe(fallaReportada);
    diagnostico = safe(diagnostico);
    trabajos = safe(trabajos);
    repuestos = JSON.stringify(safeArray(repuestos));
    observaciones = safe(observaciones);
    garantiaPeriodo = safe(garantiaPeriodo);
    garantiaCondiciones = safe(garantiaCondiciones);

    const estadoAnterior = reparacionActual.estado;
    const estadoNuevo = estado;

    // Actualiza la reparación
    await connection.query(
      `UPDATE reparaciones SET
        cliente = ?, vehiculo = ?, problema = ?, estado = ?, costo = ?, fecha = ?,
        telefono = ?, email = ?, marca = ?, modelo = ?, anio = ?, patente = ?, kilometraje = ?,
        fallaReportada = ?, diagnostico = ?, trabajos = ?, repuestos = ?,
        observaciones = ?, garantiaPeriodo = ?, garantiaCondiciones = ?
      WHERE id = ?`,
      [
        cliente, vehiculo, problema, estadoNuevo, costo, fecha,
        telefono, email, marca, modelo, anio, patente, kilometraje,
        fallaReportada, diagnostico, trabajos, repuestos,
        observaciones, garantiaPeriodo, garantiaCondiciones, id
      ]
    );

    // Sincroniza historial: si está en "progress", inserta si no existe, actualiza si existe
    const [historialRows] = await connection.query(
      'SELECT id FROM historial_vehiculos WHERE reparacion_id = ?', [id]
    );
    if (estadoNuevo === 'progress') {
      if (historialRows.length === 0) {
        // Solo inserta si no existe
        await connection.query(
          `INSERT INTO historial_vehiculos (reparacion_id, vehiculo, cliente, fecha, servicio, taller, patente)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            vehiculo,
            cliente,
            fecha,
            problema,
            'TallerPro',
            patente
          ]
        );
      } else {
        // Si ya existe, actualiza
        await connection.query(
          `UPDATE historial_vehiculos SET
            vehiculo = ?, cliente = ?, fecha = ?, servicio = ?, taller = ?, patente = ?
          WHERE reparacion_id = ?`,
          [
            vehiculo,
            cliente,
            fecha,
            problema,
            'TallerPro',
            patente,
            id
          ]
        );
      }
    }
    // (Opcional) Si quieres eliminar del historial cuando sale de "progress", descomenta:
    // else if (historialRows.length > 0) {
    //   await connection.query('DELETE FROM historial_vehiculos WHERE reparacion_id = ?', [id]);
    // }

    res.json({ ok: true });
  } catch (e) {
    console.error('Error actualizando reparación:', e);
    res.status(500).json({ error: 'Error actualizando reparación' });
  } finally {
    connection.release();
  }
});

// Crear una reparación nueva
router.post('/', async (req, res) => {
  try {
    let {
      cliente, vehiculo, problema, estado, costo, fecha,
      telefono, email, marca, modelo, anio, patente, kilometraje,
      fallaReportada, diagnostico, trabajos, repuestos,
      observaciones, garantiaPeriodo, garantiaCondiciones
    } = req.body;

    const safe = (v, def = '') => (v === undefined || v === null ? def : v);
    const safeArray = (v) => Array.isArray(v) ? v : [];
    cliente = safe(cliente);
    vehiculo = safe(vehiculo);
    problema = safe(problema);
    estado = safe(estado, 'pending');
    costo = safe(costo, 0);
    fecha = safeDate(fecha);
    telefono = safe(telefono);
    email = safe(email);
    marca = safe(marca);
    modelo = safe(modelo);
    anio = safe(anio);
    patente = safe(patente);
    kilometraje = safe(kilometraje);
    fallaReportada = safe(fallaReportada);
    diagnostico = safe(diagnostico);
    trabajos = safe(trabajos);
    repuestos = JSON.stringify(safeArray(repuestos));
    observaciones = safe(observaciones);
    garantiaPeriodo = safe(garantiaPeriodo);
    garantiaCondiciones = safe(garantiaCondiciones);

    const [result] = await pool.query(
      `INSERT INTO reparaciones (
        cliente, vehiculo, problema, estado, costo, fecha,
        telefono, email, marca, modelo, anio, patente, kilometraje,
        fallaReportada, diagnostico, trabajos, repuestos,
        observaciones, garantiaPeriodo, garantiaCondiciones
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        cliente, vehiculo, problema, estado, costo, fecha,
        telefono, email, marca, modelo, anio, patente, kilometraje,
        fallaReportada, diagnostico, trabajos, repuestos,
        observaciones, garantiaPeriodo, garantiaCondiciones
      ]
    );
    res.status(201).json({ id: result.insertId });
  } catch (e) {
    console.error('Error creando reparación:', e);
    res.status(500).json({ error: 'Error creando reparación' });
  }
});

// Obtener historial de vehículos con datos de la reparación (JOIN)
router.get('/historial', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT h.*, r.*
      FROM historial_vehiculos h
      JOIN reparaciones r ON h.reparacion_id = r.id
      ORDER BY h.fecha DESC
    `);
    res.json(rows);
  } catch (e) {
    console.error('Error consultando historial:', e);
    res.status(500).json({ error: 'Error consultando historial', details: e.message });
  }
});

export default router;
