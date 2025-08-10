import { Router } from 'express';
import { pool } from './db.js';

const router = Router();

// Listar todas las reparaciones
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM reparaciones');
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error consultando reparaciones' });
  }
});

// Crear reparación (manual o desde reservas)
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
        cliente, vehiculo, problema, estado || 'pending', costo, fecha,
        telefono, email, marca, modelo, anio, patente, kilometraje,
        fallaReportada, diagnostico, trabajos,
        JSON.stringify(repuestos || []),
        observaciones, garantiaPeriodo, garantiaCondiciones
      ]
    );
    res.status(201).json({ id: result.insertId, ...req.body });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error creando reparación' });
  }
});

// Actualizar ficha de reparación (todos los campos)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      estado, telefono, email, marca, modelo, anio, patente, kilometraje,
      fallaReportada, diagnostico, trabajos, repuestos,
      observaciones, garantiaPeriodo, garantiaCondiciones
    } = req.body;

    await pool.query(
      `UPDATE reparaciones SET
        estado = ?,
        telefono = ?,
        email = ?,
        marca = ?,
        modelo = ?,
        anio = ?,
        patente = ?,
        kilometraje = ?,
        fallaReportada = ?,
        diagnostico = ?,
        trabajos = ?,
        repuestos = ?,
        observaciones = ?,
        garantiaPeriodo = ?,
        garantiaCondiciones = ?
      WHERE id = ?`,
      [
        estado, telefono, email, marca, modelo, anio, patente, kilometraje,
        fallaReportada, diagnostico, trabajos,
        JSON.stringify(repuestos || []),
        observaciones, garantiaPeriodo, garantiaCondiciones, id
      ]
    );

    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error actualizando ficha de reparación' });
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
