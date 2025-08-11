import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Typography } from '@mui/material';

const API_URL = process.env.REACT_APP_API_URL;

function FichaReparacionModal({ open, onClose, reparacion, modoHistorial }) {
  const [form, setForm] = useState(reparacion);

  // Actualiza el form si cambia la reparación seleccionada
  React.useEffect(() => {
    setForm(reparacion);
  }, [reparacion]);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleGuardar = async () => {
    // Actualiza la reparación (esto también actualiza el historial en backend)
    await fetch(`${API_URL}/api/reparaciones/${form.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    onClose();
  };

  if (!form) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Ficha de Reparación</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField label="Vehículo" name="vehiculo" value={form.vehiculo || ''} onChange={handleChange} fullWidth />
        <TextField label="Patente" name="patente" value={form.patente || ''} onChange={handleChange} fullWidth />
        <TextField label="Cliente" name="cliente" value={form.cliente || ''} onChange={handleChange} fullWidth />
        <TextField label="Servicio" name="problema" value={form.problema || ''} onChange={handleChange} fullWidth />
        <TextField label="Diagnóstico" name="diagnostico" value={form.diagnostico || ''} onChange={handleChange} fullWidth />
        <TextField label="Trabajos" name="trabajos" value={form.trabajos || ''} onChange={handleChange} fullWidth />
        <TextField label="Costo" name="costo" type="number" value={form.costo || ''} onChange={handleChange} fullWidth InputProps={{ inputProps: { min: 0 } }}/>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={handleGuardar}>Guardar</Button>
      </DialogActions>
    </Dialog>
  );
}

export default FichaReparacionModal;

