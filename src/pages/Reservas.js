import React, { useState } from 'react';
import { Box, Typography, Paper, Grid, Button, List, ListItem, ListItemText, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';

import { useEffect } from 'react';


function Reservas() {
  // Simulación de mes y día seleccionados
  const [mes, setMes] = useState('Enero 2024');
  const [dia, setDia] = useState(15);

  // Calendario simple (solo para demo visual)
  const diasMes = [
    [null, null, 1, 2, 3, 4, 5],
    [6, 7, 8, 9, 10, 11, 12],
    [13, 14, 15, 16, 17, 18, 19],
    [20, 21, 22, 23, 24, 25, 26],
    [27, 28, 29, 30, 31, null, null],
  ];

  // Modal para nueva reserva
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ cliente: '', servicio: '', vehiculo: '', hora: '' });
  const [citasHoy, setCitasHoy] = useState([]);
  const fechaActual = `2024-01-${dia.toString().padStart(2, '0')}`;

  React.useEffect(() => {
    fetch('http://localhost:4000/api/reservas')
      .then(res => res.json())
      .then(data => setCitasHoy(data.filter(c => c.fecha === fechaActual)))
      .catch(() => setCitasHoy([]));
  }, [dia]);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    await fetch('http://localhost:4000/api/reservas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, fecha: fechaActual })
    });
    setForm({ cliente: '', servicio: '', vehiculo: '', hora: '' });
    setOpen(false);
    // Refrescar citas
    fetch('http://localhost:4000/api/reservas')
      .then(res => res.json())
      .then(data => setCitasHoy(data.filter(c => c.fecha === fechaActual)))
      .catch(() => setCitasHoy([]));
  };

  const handleDelete = async id => {
    await fetch(`http://localhost:4000/api/reservas/${id}`, { method: 'DELETE' });
    fetch('http://localhost:4000/api/reservas')
      .then(res => res.json())
      .then(data => setCitasHoy(data.filter(c => c.fecha === fechaActual)))
      .catch(() => setCitasHoy([]));
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} mb={3}>Sistema de Reservas</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <Paper elevation={2} sx={{ p: 3, mb: 2 }}>
            <Typography variant="h6" fontWeight={600}>{mes}</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, mt: 2 }}>
              {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((d) => (
                <Typography key={d} align="center" color="text.secondary" fontWeight={600}>{d}</Typography>
              ))}
              {diasMes.flat().map((d, i) => (
                <Button
                  key={i}
                  variant={d === dia ? 'contained' : 'text'}
                  color={d === dia ? 'primary' : 'inherit'}
                  sx={{ height: 40, minWidth: 0, p: 0, fontWeight: d === dia ? 700 : 400 }}
                  disabled={!d}
                  onClick={() => setDia(d)}
                >
                  {d || ''}
                </Button>
              ))}
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} mb={2}>Citas de Hoy</Typography>
            <List>
              {citasHoy.map((cita, i) => (
                <ListItem key={cita.id || i} divider
                  secondaryAction={
                    <Button color="error" size="small" onClick={() => handleDelete(cita.id)}>
                      Eliminar
                    </Button>
                  }
                >
                  <ListItemText
                    primary={
                      <>
                        <Typography variant="subtitle1" fontWeight={600}>{cita.hora} - {cita.cliente}</Typography>
                        <Typography variant="body2" color="text.secondary">{cita.servicio} <br />{cita.vehiculo}</Typography>
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
            <Button variant="contained" color="primary" fullWidth sx={{ mt: 2 }} onClick={handleOpen}>
              + Nueva Reserva
            </Button>
            <Dialog open={open} onClose={handleClose}>
              <DialogTitle>Nueva Reserva</DialogTitle>
              <form onSubmit={handleSubmit}>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField label="Cliente" name="cliente" value={form.cliente} onChange={handleChange} required />
                  <TextField label="Servicio" name="servicio" value={form.servicio} onChange={handleChange} required />
                  <TextField label="Vehículo" name="vehiculo" value={form.vehiculo} onChange={handleChange} required />
                  <TextField label="Hora" name="hora" value={form.hora} onChange={handleChange} required placeholder="09:00" />
                </DialogContent>
                <DialogActions>
                  <Button onClick={handleClose}>Cancelar</Button>
                  <Button type="submit" variant="contained">Guardar</Button>
                </DialogActions>
              </form>
            </Dialog>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Reservas;
