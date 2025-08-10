import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Grid, Typography, Table, TableHead, TableRow, TableCell, TableBody, IconButton
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

function FichaReparacionModal({ open, onClose, reparacion, onSaved }) {
  // Normaliza repuestos a array
  const normalizeRepuestos = (r) => {
    if (!r) return [];
    if (Array.isArray(r)) return r;
    try { return JSON.parse(r); } catch { return []; }
  };

  // Estado local para cada campo de la ficha
  const [ficha, setFicha] = useState({
    nombre: reparacion.cliente || '',
    telefono: reparacion.telefono || '',
    email: reparacion.email || '',
    marca: reparacion.marca || '',
    modelo: reparacion.modelo || '',
    anio: reparacion.anio || '',
    patente: reparacion.patente || '',
    kilometraje: reparacion.kilometraje || '',
    fallaReportada: reparacion.fallaReportada || '',
    diagnostico: reparacion.diagnostico || '',
    trabajos: reparacion.trabajos || '',
    repuestos: normalizeRepuestos(reparacion.repuestos),
    observaciones: reparacion.observaciones || '',
    garantiaPeriodo: reparacion.garantiaPeriodo || '',
    garantiaCondiciones: reparacion.garantiaCondiciones || ''
  });

  // Si cambia la reparación seleccionada, actualiza el estado
  useEffect(() => {
    setFicha({
      nombre: reparacion.cliente || '',
      telefono: reparacion.telefono || '',
      email: reparacion.email || '',
      marca: reparacion.marca || '',
      modelo: reparacion.modelo || '',
      anio: reparacion.anio || '',
      patente: reparacion.patente || '',
      kilometraje: reparacion.kilometraje || '',
      fallaReportada: reparacion.fallaReportada || '',
      diagnostico: reparacion.diagnostico || '',
      trabajos: reparacion.trabajos || '',
      repuestos: normalizeRepuestos(reparacion.repuestos),
      observaciones: reparacion.observaciones || '',
      garantiaPeriodo: reparacion.garantiaPeriodo || '',
      garantiaCondiciones: reparacion.garantiaCondiciones || ''
    });
  }, [reparacion]);

  // Manejo de cambios en los campos
  const handleChange = e => setFicha({ ...ficha, [e.target.name]: e.target.value });

  // Manejo de repuestos
  const handleAddRepuesto = () => {
    setFicha({ ...ficha, repuestos: [...(ficha.repuestos || []), { cantidad: '', descripcion: '', marca: '', codigo: '', precio: '', total: '' }] });
  };
  const handleRemoveRepuesto = idx => {
    const nuevos = ficha.repuestos.filter((_, i) => i !== idx);
    setFicha({ ...ficha, repuestos: nuevos });
  };
  const handleRepuestoChange = (idx, field, value) => {
    const nuevos = ficha.repuestos.map((r, i) => i === idx ? { ...r, [field]: value } : r);
    setFicha({ ...ficha, repuestos: nuevos });
  };

  // GUARDAR la ficha en el backend y registrar en historial por patente
  const handleGuardarFicha = async () => {
    // 1. Guardar la ficha en reparaciones (envía TODOS los campos requeridos)
    await fetch(`${process.env.REACT_APP_API_URL}/api/reparaciones/${reparacion.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cliente: ficha.nombre,
        telefono: ficha.telefono,
        email: ficha.email,
        marca: ficha.marca,
        modelo: ficha.modelo,
        anio: ficha.anio,
        patente: ficha.patente,
        kilometraje: ficha.kilometraje,
        fallaReportada: ficha.fallaReportada,
        diagnostico: ficha.diagnostico,
        trabajos: ficha.trabajos,
        repuestos: ficha.repuestos,
        observaciones: ficha.observaciones,
        garantiaPeriodo: ficha.garantiaPeriodo,
        garantiaCondiciones: ficha.garantiaCondiciones,
        vehiculo: ficha.marca + ' ' + ficha.modelo, // <--- CORREGIDO
        problema: ficha.fallaReportada,             // <--- CORREGIDO
        estado: reparacion.estado || 'pendiente',
        costo: reparacion.costo || 0,
        fecha: reparacion.fecha || new Date().toISOString().slice(0, 10)
      })
    });

    // 2. Registrar en historial, catalogando por patente
    await fetch(`${process.env.REACT_APP_API_URL}/api/historial`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vehiculo: ficha.marca + ' ' + ficha.modelo,
        patente: ficha.patente,
        cliente: ficha.nombre,
        fecha: reparacion.fecha || new Date().toISOString().slice(0, 10),
        servicio: ficha.trabajos ? ficha.trabajos.substring(0, 100) : 'Reparación',
        taller: 'TallerPro'
      })
    });

    // Refresca la tabla principal si se provee la función
    if (onSaved) onSaved();

    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Ficha de Servicio de Reparación Mecánica</DialogTitle>
      <DialogContent>
        {/* ... aquí va tu formulario ... */}
        {/* Puedes dejar el render igual, solo asegúrate de que los campos estén conectados a ficha */}
        {/* Ejemplo: */}
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={4}>
            <TextField label="Nombre" name="nombre" value={ficha.nombre} onChange={handleChange} fullWidth />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField label="Teléfono" name="telefono" value={ficha.telefono} onChange={handleChange} fullWidth />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField label="Correo electrónico" name="email" value={ficha.email} onChange={handleChange} fullWidth />
          </Grid>
          {/* ...agrega los demás campos igual que ya tienes... */}
        </Grid>
        {/* Repuestos table, observaciones, garantía, etc. */}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
        <Button onClick={handleGuardarFicha} variant="contained" color="primary">Guardar</Button>
      </DialogActions>
    </Dialog>
  );
}

export default FichaReparacionModal;
