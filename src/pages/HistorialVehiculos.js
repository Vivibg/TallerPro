import React, { useState } from 'react';
import { Box, Typography, TextField, Paper, Grid, Button, List, ListItem, ListItemText, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';

import { useEffect } from 'react';
import { apiFetch } from '../utils/api';


function HistorialVehiculos() {
  const [historiales, setHistoriales] = useState([]);
  const [busqueda, setBusqueda] = useState('');

  const cargarHistorial = () => {
    apiFetch('/api/historial')
      .then(data => Array.isArray(data) ? setHistoriales(data) : setHistoriales([]))
      .catch(() => setHistoriales([]));
  };

  useEffect(() => {
    cargarHistorial();
  }, []);

  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const [form, setForm] = useState({
    vehiculo: '',
    patente: '',
    cliente: '',
    fecha: '',
    servicio: '',
    taller: ''
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const nuevo = await apiFetch('/api/historial', {
        method: 'POST',
        body: JSON.stringify(form)
      });
      setHistoriales([...(Array.isArray(historiales) ? historiales : []), nuevo]);
      setForm({ vehiculo: '', patente: '', cliente: '', fecha: '', servicio: '', taller: '' });
      handleClose();
    } catch {
      alert('Error al guardar historial');
      handleClose();
    }
  };

  async function handleDelete(id) {
    try {
      await apiFetch(`/api/historial/${id}`, { method: 'DELETE' });
      setHistoriales((Array.isArray(historiales) ? historiales : []).filter(h => h.id !== id));
    } catch {
      alert('Error al eliminar historial');
    }
  }

  const resultados = (Array.isArray(historiales) ? historiales : []).filter(h => {
    const patente = (h.patente || h.placas || '').toLowerCase();
    const veh = (h.vehiculo || '').toLowerCase();
    const q = busqueda.toLowerCase();
    return veh.includes(q) || patente.includes(q);
  });

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} mb={3}>Historial de Vehículos</Typography>
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          size="small"
          placeholder="Buscar vehículo o patente..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          sx={{ minWidth: 240 }}
        />
        <Button variant="contained" color="primary">Buscar</Button>
        <Button variant="outlined" onClick={cargarHistorial}>Refrescar</Button>
        <Button variant="contained" color="primary" sx={{ ml: 2 }} onClick={handleOpen}>
          + Nuevo Servicio
        </Button>
        <Dialog open={open} onClose={handleClose}>
          <DialogTitle>Nuevo Servicio</DialogTitle>
          <form onSubmit={handleSubmit}>
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField label="Vehículo" name="vehiculo" value={form.vehiculo} onChange={handleChange} required />
              <TextField label="Patente" name="patente" value={form.patente || ''} onChange={handleChange} />
              <TextField label="Cliente" name="cliente" value={form.cliente} onChange={handleChange} />
              <TextField label="Fecha" name="fecha" value={form.fecha} onChange={handleChange} placeholder="2024-07-27" />
              <TextField label="Servicio" name="servicio" value={form.servicio} onChange={handleChange} />
              <TextField label="Taller" name="taller" value={form.taller} onChange={handleChange} />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleClose}>Cancelar</Button>
              <Button type="submit" variant="contained">Guardar</Button>
            </DialogActions>
          </form>
        </Dialog>
      </Box>
      <Grid container spacing={2}>
        {resultados.map((h, i) => (
          <Grid item xs={12} md={6} key={h.id || i}>
            <Paper elevation={2} sx={{ p: 2 }}>
              <Typography variant="h6" fontWeight={600}>{h.vehiculo}</Typography>
              <Typography variant="body2" color="text.secondary">Patente: {h.patente || h.placas}</Typography>
              <Typography variant="body2">Cliente: {h.cliente}</Typography>
              <Typography variant="body2">Servicio: {h.servicio}</Typography>
              <Typography variant="body2">Taller: {h.taller}</Typography>
              <Typography variant="body2" mb={1}>Fecha: {h.fecha}</Typography>
              <Button variant="contained" size="small" sx={{ mr: 1 }}>Ver Detalle</Button>
              <Button variant="outlined" size="small" color="error" onClick={() => handleDelete(h.id)}>Eliminar</Button>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

export default HistorialVehiculos;
