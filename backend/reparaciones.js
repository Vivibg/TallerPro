import { Router } from 'express';
import { pool } from './db.js';

const router = Router();

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
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'Error buscando reparación' });
  }
});

// Actualizar una reparación existente
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      cliente, vehiculo, problema, estado, costo, fecha,
      telefono, email, marca, modelo, anio, patente, kilometraje,
      fallaReportada, diagnostico, trabajos, repuestos,
      observaciones, garantiaPeriodo, garantiaCondiciones
    } = req.body;
    await pool.query(
      `UPDATE reparaciones SET
        cliente = ?, vehiculo = ?, problema = ?, estado = ?, costo = ?, fecha = ?,
        telefono = ?, email = ?, marca = ?, modelo = ?, anio = ?, patente = ?, kilometraje = ?,
        fallaReportada = ?, diagnostico = ?, trabajos = ?, repuestos = ?,
        observaciones = ?, garantiaPeriodo = ?, garantiaCondiciones = ?
      WHERE id = ?`,
      [
        cliente, vehiculo, problema, estado, costo, fecha,
        telefono, email, marca, modelo, anio, patente, kilometraje,
        fallaReportada, diagnostico, trabajos, JSON.stringify(repuestos),
        observaciones, garantiaPeriodo, garantiaCondiciones, id
      ]
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Error actualizando reparación' });
  }
});

// Crear una reparación nueva
router.post('/', async (req, res) => {
  try {
    const {
      cliente, vehiculo, problema, estado, costo, fecha,
      telefono, email, marca, modelo, anio, patente, kilometraje,
      fallaReportada, diagnostico, trabajos, repuestos,
      observaciones, garantiaPeriodo, garantiaCondiciones
    } = req.body;
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
        fallaReportada, diagnostico, trabajos, JSON.stringify(repuestos),
        observaciones, garantiaPeriodo, garantiaCondiciones
      ]
    );
    res.status(201).json({ id: result.insertId });
  } catch (e) {
    res.status(500).json({ error: 'Error creando reparación' });
  }
});

export default router;
