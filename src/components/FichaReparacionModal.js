import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Grid, Typography, Table, TableHead, TableRow, TableCell, TableBody, IconButton
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

function FichaReparacionModal({ open, onClose, reparacion }) {
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
    repuestos: reparacion.repuestos || [],
    observaciones: reparacion.observaciones || '',
    garantiaPeriodo: reparacion.garantiaPeriodo || '',
    garantiaCondiciones: reparacion.garantiaCondiciones || ''
  });

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

  // GUARDAR la ficha en el backend, asegurando que siempre se envía "estado"
  const handleGuardarFicha = async () => {
    await fetch(`${process.env.REACT_APP_API_URL}/api/reparaciones/${reparacion.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...ficha,
        cliente: ficha.nombre, // por compatibilidad
        estado: reparacion.estado || 'pendiente' // ¡Siempre envía un estado!
      })
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Ficha de Servicio de Reparación Mecánica</DialogTitle>
      <DialogContent dividers>
        <Typography variant="subtitle1" gutterBottom>1. Datos del cliente</Typography>
        <Grid container spacing={2}>
          <Grid item xs={4}><TextField label="Nombre" name="nombre" value={ficha.nombre} onChange={handleChange} fullWidth /></Grid>
          <Grid item xs={4}><TextField label="Teléfono" name="telefono" value={ficha.telefono} onChange={handleChange} fullWidth /></Grid>
          <Grid item xs={4}><TextField label="Correo electrónico" name="email" value={ficha.email} onChange={handleChange} fullWidth /></Grid>
        </Grid>
        <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>2. Datos del vehículo</Typography>
        <Grid container spacing={2}>
          <Grid item xs={3}><TextField label="Marca" name="marca" value={ficha.marca} onChange={handleChange} fullWidth /></Grid>
          <Grid item xs={3}><TextField label="Modelo" name="modelo" value={ficha.modelo} onChange={handleChange} fullWidth /></Grid>
          <Grid item xs={2}><TextField label="Año" name="anio" value={ficha.anio} onChange={handleChange} fullWidth /></Grid>
          <Grid item xs={2}><TextField label="Patente/Placa" name="patente" value={ficha.patente} onChange={handleChange} fullWidth /></Grid>
          <Grid item xs={2}><TextField label="Kilometraje" name="kilometraje" value={ficha.kilometraje} onChange={handleChange} fullWidth /></Grid>
        </Grid>
        <TextField
          label="3. Descripción de la falla reportada por el cliente"
          name="fallaReportada"
          value={ficha.fallaReportada}
          onChange={handleChange}
          fullWidth
          multiline
          sx={{ mt: 2 }}
        />
        <TextField
          label="4. Diagnóstico inicial (mecánico)"
          name="diagnostico"
          value={ficha.diagnostico}
          onChange={handleChange}
          fullWidth
          multiline
          sx={{ mt: 2 }}
        />
        <TextField
          label="5. Trabajos realizados"
          name="trabajos"
          value={ficha.trabajos}
          onChange={handleChange}
          fullWidth
          multiline
          sx={{ mt: 2 }}
        />
        <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>6. Repuestos y materiales utilizados</Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Cantidad</TableCell>
              <TableCell>Descripción</TableCell>
              <TableCell>Marca</TableCell>
              <TableCell>Código</TableCell>
              <TableCell>Precio unitario</TableCell>
              <TableCell>Total</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(ficha.repuestos || []).map((rep, idx) => (
              <TableRow key={idx}>
                <TableCell><TextField value={rep.cantidad} onChange={e => handleRepuestoChange(idx, 'cantidad', e.target.value)} size="small" /></TableCell>
                <TableCell><TextField value={rep.descripcion} onChange={e => handleRepuestoChange(idx, 'descripcion', e.target.value)} size="small" /></TableCell>
                <TableCell><TextField value={rep.marca} onChange={e => handleRepuestoChange(idx, 'marca', e.target.value)} size="small" /></TableCell>
                <TableCell><TextField value={rep.codigo} onChange={e => handleRepuestoChange(idx, 'codigo', e.target.value)} size="small" /></TableCell>
                <TableCell><TextField value={rep.precio} onChange={e => handleRepuestoChange(idx, 'precio', e.target.value)} size="small" /></TableCell>
                <TableCell><TextField value={rep.total} onChange={e => handleRepuestoChange(idx, 'total', e.target.value)} size="small" /></TableCell>
                <TableCell>
                  <IconButton onClick={() => handleRemoveRepuesto(idx)} size="small"><DeleteIcon fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell colSpan={7} align="right">
                <Button startIcon={<AddIcon />} onClick={handleAddRepuesto} size="small">Agregar repuesto</Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <TextField
          label="7. Observaciones adicionales"
          name="observaciones"
          value={ficha.observaciones}
          onChange={handleChange}
          fullWidth
          multiline
          sx={{ mt: 2 }}
        />
        <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>8. Garantía del servicio</Typography>
        <Grid container spacing={2}>
          <Grid item xs={3}><TextField label="Periodo" name="garantiaPeriodo" value={ficha.garantiaPeriodo} onChange={handleChange} fullWidth /></Grid>
          <Grid item xs={9}><TextField label="Condiciones" name="garantiaCondiciones" value={ficha.garantiaCondiciones} onChange={handleChange} fullWidth /></Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
        <Button onClick={handleGuardarFicha} variant="contained" color="primary">Guardar</Button>
      </DialogActions>
    </Dialog>
  );
}

export default FichaReparacionModal;
