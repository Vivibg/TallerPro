import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Grid, Button, List, ListItem, ListItemText, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Chip, Alert } from '@mui/material';

// Función para formatear fecha y hora
function formatearFechaHora(fecha, hora) {
  let soloFecha = fecha;
  if (fecha && fecha.includes('T')) {
    soloFecha = fecha.split('T')[0];
  }
  if (!soloFecha) return '';
  const [yyyy, mm, dd] = soloFecha.split('-');
  return `${dd}-${mm}-${yyyy}${hora ? ' ' + hora : ''}`;
}

function Reservas() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ cliente: '', servicio: '', vehiculo: '', patente: '', fecha: '', hora: '', motivo: '' });
  const [reservas, setReservas] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const API_URL = process.env.REACT_APP_API_URL;

  // Validación de fecha y hora
  const isValidDate = (date) => /^\d{4}-\d{2}-\d{2}$/.test(date);
  const isValidTime = (time) => /^([01]\d|2[0-3]):[0-5]\d$/.test(time);

  // Cargar todas las reservas al cargar el componente
  const fetchReservas = () => {
    fetch(`${API_URL}/api/reservas`)
      .then(res => res.json())
      .then(data => setReservas(data))
      .catch(() => {
        setReservas([]);
        setError('Error al cargar reservas');
      });
  };

  useEffect(() => {
    fetchReservas();
    // eslint-disable-next-line
  }, []);

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setError('');
    setSuccess('');
  };

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!form.cliente || !form.servicio || !form.vehiculo || !form.patente || !form.fecha || !form.hora || !form.motivo) {
      setError('Todos los campos son obligatorios');
      return;
    }
    if (!isValidDate(form.fecha)) {
      setError('La fecha debe tener el formato YYYY-MM-DD');
      return;
    }
    if (!isValidTime(form.hora)) {
      setError('La hora debe tener el formato HH:MM (24h)');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/reservas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Error al guardar la reserva');
        return;
      }
      setForm({ cliente: '', servicio: '', vehiculo: '', patente: '', fecha: '', hora: '', motivo: '' });
      setSuccess('¡Reserva creada exitosamente!');
      setOpen(false);
      fetchReservas();
    } catch (err) {
      setError('Error de red o del servidor');
    }
  };

  const handleDelete = async id => {
    await fetch(`${API_URL}/api/reservas/${id}`, { method: 'DELETE' });
    fetchReservas();
  };

  const handleAsistencia = async (id, asiste) => {
    await fetch(`${API_URL}/api/reservas/${id}/asistencia`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ asiste })
    });
    fetchReservas();
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} mb={3}>Sistema de Reservas</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <Paper elevation={2} sx={{ p: 3, mb: 2 }}>
            <Typography variant="h6" fontWeight={600} mb={2}>Todas las Reservas</Typography>
            <List>
              {reservas.length === 0 && (
                <Typography color="text.secondary" sx={{ mt: 2 }}>No hay reservas registradas.</Typography>
              )}
              {reservas.map((cita, i) => (
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
                        <Typography variant="subtitle1" fontWeight={600}>
                          {formatearFechaHora(cita.fecha, cita.hora)} - {cita.cliente}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">{cita.servicio} - {cita.vehiculo}</Typography>
                        <Typography variant="body2" color="text.secondary">Patente: {cita.patente}</Typography>
                        <Typography variant="body2" color="text.secondary">Motivo: {cita.motivo}</Typography>
                        {cita.asiste === true && <Chip label="Asistió" color="success" size="small" sx={{ mt: 1 }} />}
                        {cita.asiste === false && <Chip label="No asistió" color="error" size="small" sx={{ mt: 1 }} />}
                        {(cita.asiste === null || cita.asiste === undefined) &&
                          <>
                            <Button
                              variant="outlined"
                              color="success"
                              size="small"
                              sx={{ mt: 1, mr: 1 }}
                              onClick={() => handleAsistencia(cita.id, true)}
                            >
                              Confirmar Asistencia
                            </Button>
                            <Button
                              variant="outlined"
                              color="warning"
                              size="small"
                              sx={{ mt: 1 }}
                              onClick={() => handleAsistencia(cita.id, false)}
                            >
                              No asistió
                            </Button>
                          </>
                        }
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Button variant="contained" color="primary" fullWidth sx={{ mb: 2 }} onClick={handleOpen}>
              + Nueva Reserva
            </Button>
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
            <Dialog open={open} onClose={handleClose}>
              <DialogTitle>Nueva Reserva</DialogTitle>
              <form onSubmit={handleSubmit}>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField label="Cliente" name="cliente" value={form.cliente} onChange={handleChange} required />
                  <TextField label="Servicio" name="servicio" value={form.servicio} onChange={handleChange} required />
                  <TextField label="Vehículo" name="vehiculo" value={form.vehiculo} onChange={handleChange} required />
                  <TextField label="Patente" name="patente" value={form.patente} onChange={handleChange} required />
                  <TextField label="Fecha" name="fecha" value={form.fecha} onChange={handleChange} required placeholder="YYYY-MM-DD" />
                  <TextField label="Hora" name="hora" value={form.hora} onChange={handleChange} required placeholder="09:00" />
                  <TextField label="Motivo" name="motivo" value={form.motivo} onChange={handleChange} required />
                  {error && <Typography color="error" variant="body2">{error}</Typography>}
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
