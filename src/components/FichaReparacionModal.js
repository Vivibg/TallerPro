import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Typography, Select, MenuItem, InputLabel, FormControl } from '@mui/material';

const API_URL = process.env.REACT_APP_API_URL;

const SERVICIOS = [
  "Servicios básicos",
  "Mantenimiento preventivo",
  "Reparaciones",
  "Servicios más especializados",
  "Extras en talleres más modernos"
];

function FichaReparacionModal({ open, onClose, reparacion, modoHistorial }) {
  const [form, setForm] = useState(reparacion);

  
  React.useEffect(() => {
    setForm(reparacion);
  }, [reparacion]);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSelectServicio = e => {
    setForm({ ...form, problema: e.target.value });
  };

  const handleGuardar = async () => {
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
        <TextField label="Correo electrónico" name="email" value={form.email || ''} onChange={handleChange} fullWidth />
        <TextField label="Teléfono" name="telefono" value={form.telefono || ''} onChange={handleChange} fullWidth />

        {/* Servicio como lista desplegable */}
        <FormControl fullWidth>
          <InputLabel id="servicio-label">Servicio</InputLabel>
          <Select
            labelId="servicio-label"
            label="Servicio"
            name="problema"
            value={form.problema || ''}
            onChange={handleSelectServicio}
          >
            {SERVICIOS.map((servicio) => (
              <MenuItem key={servicio} value={servicio}>{servicio}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField label="Diagnóstico" name="diagnostico" value={form.diagnostico || ''} onChange={handleChange} fullWidth />
        <TextField label="Trabajos" name="trabajos" value={form.trabajos || ''} onChange={handleChange} fullWidth />
        <TextField label="Costo" name="costo" type="number" value={form.costo || ''} onChange={handleChange} fullWidth InputProps={{ inputProps: { min: 0 } }}/>
        <TextField label="Taller" name="taller" value={form.taller || ''} onChange={handleChange} fullWidth />
        <TextField label="Mecánico" name="mecanico" value={form.mecanico || ''} onChange={handleChange} fullWidth />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={handleGuardar}>Guardar</Button>
      </DialogActions>
    </Dialog>
  );
}

export default FichaReparacionModal;

