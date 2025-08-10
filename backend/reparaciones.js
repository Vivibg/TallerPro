import { Router } from 'express';
import { pool } from './db.js';

const router = Router();

// Función segura para la fecha
const safeDate = (v) => (!v || v === '') ? new Date().toISOString().slice(0, 10) : v;

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
    // Normaliza los campos antes de enviar
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

// Actualizar una reparación existente y registrar en historial si pasa a "progress"
router.put('/:id', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    // Obtén los datos actuales para no perder los originales
    const [rows] = await connection.query('SELECT cliente, vehiculo, problema, estado, patente, fecha FROM reparaciones WHERE id = ?', [id]);
    const reparacionActual = rows[0] || {};

    let {
      cliente, vehiculo, problema, estado, costo, fecha,
      telefono, email, marca, modelo, anio, patente, kilometraje,
      fallaReportada, diagnostico, trabajos, repuestos,
      observaciones, garantiaPeriodo, garantiaCondiciones
    } = req.body;

    // Valores por defecto
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

    // Detecta si el estado cambia a "progress"
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

    // Si el estado cambió a "progress" y antes no lo era, registra en historial
    if (estadoAnterior !== 'progress' && estadoNuevo === 'progress') {
      await connection.query(
        `INSERT INTO historial_vehiculos (vehiculo, cliente, fecha, servicio, taller, patente)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          vehiculo || reparacionActual.vehiculo || '',
          cliente || reparacionActual.cliente || '',
          fecha || reparacionActual.fecha || new Date().toISOString().slice(0, 10),
          problema || reparacionActual.problema || 'Servicio',
          'TallerPro',
          patente || reparacionActual.patente || ''
        ]
      );
    }

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

export default router;
