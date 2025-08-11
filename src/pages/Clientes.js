import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';

function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/api/clientes`)
      .then(res => res.json())
      .then(data => Array.isArray(data) ? setClientes(data) : setClientes([]))
      .catch(() => setClientes([]));
  }, []);

  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const resultados = clientes.filter(c =>
    c.nombre?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const [form, setForm] = useState({
    nombre: '',
    telefono: '',
    email: '',
    vehiculo: '',
    ultimaVisita: '',
    desde: ''
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetch(`${process.env.REACT_APP_API_URL}/api/clientes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
      .then(res => res.json())
      .then(nuevo => {
        setClientes([...clientes, nuevo]);
        setForm({
          nombre: '',
          telefono: '',
          email: '',
          vehiculo: '',
          ultimaVisita: '',
          desde: ''
        });
        handleClose();
      })
      .catch(() => {
        alert('Error al guardar cliente');
        handleClose();
      });
  };

  const handleDelete = (id) => {
    fetch(`${process.env.REACT_APP_API_URL}/api/clientes/${id}`, { method: 'DELETE' })
      .then(() => setClientes(clientes.filter(c => c.id !== id)))
      .catch(() => alert('Error al eliminar cliente'));
  };

  return (
    <>
      <Box>
        <Typography variant="h4" fontWeight={700} mb={3}>Gestión de Clientes</Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Buscar cliente..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            sx={{ minWidth: 240 }}
          />
          <Button variant="contained" color="primary">Buscar</Button>
          <Button variant="contained" color="primary" sx={{ ml: 2 }} onClick={handleOpen}>
            + Nuevo Cliente
          </Button>
        </Box>
        <Grid container spacing={2}>
          {resultados.map((c, i) => (
            <Grid item xs={12} md={6} key={c.id || i}>
              <Paper elevation={2} sx={{ p: 2 }}>
                <Typography variant="h6" fontWeight={600}>{c.nombre}</Typography>
                <Typography variant="body2" color="text.secondary">Cliente desde {c.desde}</Typography>
                <Typography variant="body2">Teléfono: {c.telefono}</Typography>
                <Typography variant="body2">Email: {c.email}</Typography>
                <Typography variant="body2">Vehículo: {c.vehiculo}</Typography>
                <Typography variant="body2">Patente: {c.patente}</Typography>
                <Typography variant="body2" mb={1}>Última visita: {c.ultimaVisita ? new Date(c.ultimaVisita).toLocaleDateString() : ''}</Typography>
                <Button variant="contained" size="small" sx={{ mr: 1 }}>Ver Historial</Button>
                <Button variant="outlined" size="small" color="error" onClick={() => handleDelete(c.id)}>Eliminar</Button>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Nuevo Cliente</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField label="Nombre" name="nombre" value={form.nombre} onChange={handleChange} required />
            <TextField label="Teléfono" name="telefono" value={form.telefono} onChange={handleChange} />
            <TextField label="Email" name="email" value={form.email} onChange={handleChange} />
            <TextField label="Vehículo" name="vehiculo" value={form.vehiculo} onChange={handleChange} />
            <TextField label="Última visita" name="ultimaVisita" value={form.ultimaVisita} onChange={handleChange} placeholder="2024-07-27" />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancelar</Button>
            <Button type="submit" variant="contained">Guardar</Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
}

export default Clientes;
