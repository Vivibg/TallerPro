import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Grid, Typography, Table, TableHead, TableRow, TableCell, TableBody, IconButton
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

function FichaReparacionModal({ open, onClose, reparacion }) {
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
        problema: reparacion.problema || '',
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
        patente: ficha.patente, // catalogar por patente
        cliente: ficha.nombre,
        fecha: reparacion.fecha || new Date().toISOString().slice(0, 10),
        servicio: ficha.trabajos ? ficha.trabajos.substring(0, 100) : 'Reparación',
        taller: 'TallerPro'
      })
    });

    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      {/* ...todo igual que tu diseño actual... */}
      {/* (puedes dejar el resto del render igual) */}
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
        <Button onClick={handleGuardarFicha} variant="contained" color="primary">Guardar</Button>
      </DialogActions>
    </Dialog>
  );
}

export default FichaReparacionModal;
