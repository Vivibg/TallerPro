import express from 'express';
import { pool } from './db.js';

const router = express.Router();

// Obtener todas las reservas
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM reservas ORDER BY fecha, hora');
    res.json(rows);
  } catch (e) {
    console.error('Error consultando reservas:', e);
    res.status(500).json({ error: 'Error consultando reservas', details: e.message });
  }
});

// Crear nueva reserva
router.post('/', async (req, res) => {
  try {
    const { cliente, servicio, vehiculo, fecha, hora, motivo } = req.body;
    if (!cliente || !servicio || !vehiculo || !fecha || !hora || !motivo) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }
    const [result] = await pool.query(
      'INSERT INTO reservas (cliente, servicio, vehiculo, fecha, hora, motivo) VALUES (?, ?, ?, ?, ?, ?)',
      [cliente, servicio, vehiculo, fecha, hora, motivo]
    );
    res.status(201).json({ id: result.insertId, cliente, servicio, vehiculo, fecha, hora, motivo, asiste: null });
  } catch (e) {
    console.error('Error creando reserva:', e);
    res.status(500).json({ error: 'Error creando reserva', details: e.message });
  }
});

// Confirmar asistencia y sincronizar con reparaciones y clientes (NO historial_vehiculos)
router.put('/:id/asistencia', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    const { asiste } = req.body;
    if (typeof asiste !== 'boolean') {
      return res.status(400).json({ error: 'El campo asistio debe ser booleano' });
    }

    // 1. Actualizar asistencia en la reserva
    await connection.query('UPDATE reservas SET asiste = ? WHERE id = ?', [asiste, id]);

    if (asiste) {
      // 2. Obtener datos de la reserva
      const [reservas] = await connection.query('SELECT * FROM reservas WHERE id = ?', [id]);
      const reserva = reservas[0];

      if (!reserva) {
        return res.status(404).json({ error: 'Reserva no encontrada' });
      }

      // 3. Insertar en reparaciones (rellena solo lo que tienes, el resto con valores por defecto)
      await connection.query(
        `INSERT INTO reparaciones (
          cliente, vehiculo, problema, estado, costo, fecha,
          telefono, email, marca, modelo, anio, patente, kilometraje,
          fallaReportada, diagnostico, trabajos, repuestos,
          observaciones, garantiaPeriodo, garantiaCondiciones
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          reserva.cliente || '',
          reserva.vehiculo || '',
          reserva.motivo || '',
          'pending', // estado por defecto
          0,
          reserva.fecha || new Date().toISOString().slice(0, 10),
          '', '', '', '', '', reserva.patente || '', '',
          '', '', '', JSON.stringify([]), '', '', ''
        ]
      );

      // 4. Verificar si el cliente existe en clientes, si no, agregarlo
      const [clientes] = await connection.query('SELECT * FROM clientes WHERE nombre = ?', [reserva.cliente]);
      if (clientes.length === 0) {
        await connection.query('INSERT INTO clientes (nombre) VALUES (?)', [reserva.cliente]);
      }

      // 5. NO insertar en historial_vehiculos aquí
      // (El historial se actualiza solo cuando la reparación pasa a estado "En Proceso" en el backend de reparaciones)
    }

    res.json({ ok: true });
  } catch (e) {
    console.error('Error actualizando asistencia y sincronizando datos:', e);
    res.status(500).json({ error: 'Error actualizando asistencia y sincronizando datos', details: e.message });
  } finally {
    connection.release();
  }
});

// Eliminar reserva
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM reservas WHERE id = ?', [id]);
    res.json({ ok: true });
  } catch (e) {
    console.error('Error eliminando reserva:', e);
    res.status(500).json({ error: 'Error eliminando reserva', details: e.message });
  }
});

export default router;
