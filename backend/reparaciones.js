import { Router } from 'express';
import { pool } from './db.js';

const router = Router();

// Función segura para la fecha
const safeDate = (v) => {
  if (!v || v === '') return new Date().toISOString().slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
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
      problema: r.problema && r.problema.trim() ? r.problema : 'Sin dato',
      taller: r.taller || 'TallerPro',
      mecanico: r.mecanico || 'Sin asignar'
    }));
    res.json(normalizados);
  } catch (e) {
    console.error('Error buscando reparación:', e);
    res.status(500).json({ error: 'Error buscando reparación' });
  }
});

// Endpoint público: Buscar reparaciones por patente (solo campos relevantes para clientes)
router.get('/por-patente/:patente', async (req, res) => {
  try {
    const { patente } = req.params;
    const [rows] = await pool.query(
      'SELECT fecha, diagnostico, trabajos, estado, costo, taller, mecanico FROM reparaciones WHERE patente = ? ORDER BY fecha DESC',
      [patente]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'Error consultando reparaciones por patente' });
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

// Actualizar una reparación existente y sincronizar historial y cliente
router.put('/:id', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    const [rows] = await connection.query('SELECT cliente, vehiculo, problema, estado, patente, fecha, taller, mecanico FROM reparaciones WHERE id = ?', [id]);
    const reparacionActual = rows[0] || {};

    let {
      cliente, vehiculo, problema, estado, costo, fecha,
      telefono, email, marca, modelo, anio, patente, kilometraje,
      fallaReportada, diagnostico, trabajos, repuestos,
      observaciones, garantiaPeriodo, garantiaCondiciones,
      taller, mecanico
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
    taller = safe(taller, reparacionActual.taller || 'TallerPro');
    mecanico = safe(mecanico, reparacionActual.mecanico || '');

    // Actualiza la reparación
    await connection.query(
      `UPDATE reparaciones SET
        cliente = ?, vehiculo = ?, problema = ?, estado = ?, costo = ?, fecha = ?,
        telefono = ?, email = ?, marca = ?, modelo = ?, anio = ?, patente = ?, kilometraje = ?,
        fallaReportada = ?, diagnostico = ?, trabajos = ?, repuestos = ?,
        observaciones = ?, garantiaPeriodo = ?, garantiaCondiciones = ?,
        taller = ?, mecanico = ?
      WHERE id = ?`,
      [
        cliente, vehiculo, problema, estado, costo, fecha,
        telefono, email, marca, modelo, anio, patente, kilometraje,
        fallaReportada, diagnostico, trabajos, repuestos,
        observaciones, garantiaPeriodo, garantiaCondiciones,
        taller, mecanico, id
      ]
    );

    // (El resto de la lógica de sincronización permanece igual...)

    res.json({ ok: true });
  } catch (e) {
    console.error('Error actualizando reparación:', e);
    res.status(500).json({ error: 'Error actualizando reparación' });
  } finally {
    connection.release();
  }
});

// Crear una reparación nueva (y sincronizar cliente)
router.post('/', async (req, res) => {
  try {
    let {
      cliente, vehiculo, problema, estado, costo, fecha,
      telefono, email, marca, modelo, anio, patente, kilometraje,
      fallaReportada, diagnostico, trabajos, repuestos,
      observaciones, garantiaPeriodo, garantiaCondiciones,
      taller, mecanico
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
    taller = safe(taller, 'TallerPro');
    mecanico = safe(mecanico);

    const [result] = await pool.query(
      `INSERT INTO reparaciones (
        cliente, vehiculo, problema, estado, costo, fecha,
        telefono, email, marca, modelo, anio, patente, kilometraje,
        fallaReportada, diagnostico, trabajos, repuestos,
        observaciones, garantiaPeriodo, garantiaCondiciones,
        taller, mecanico
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        cliente, vehiculo, problema, estado, costo, fecha,
        telefono, email, marca, modelo, anio, patente, kilometraje,
        fallaReportada, diagnostico, trabajos, repuestos,
        observaciones, garantiaPeriodo, garantiaCondiciones,
        taller, mecanico
      ]
    );

    // (El resto de la lógica de sincronización permanece igual...)

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
