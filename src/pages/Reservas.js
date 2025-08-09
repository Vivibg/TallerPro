import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Grid, Button, List, ListItem, ListItemText, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Chip, Alert } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

function Reservas() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ cliente: '', servicio: '', vehiculo: '', hora: '', motivo: '' });
  const [citasHoy, setCitasHoy] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const API_URL = process.env.REACT_APP_API_URL;
  const fechaActual = selectedDate.toISOString().split('T')[0];

  // Normaliza la fecha a formato YYYY-MM-DD
  const normalizeFecha = (fecha) => {
    if (!fecha) return '';
    // Si ya está en formato YYYY-MM-DD, regresa igual
    if (/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return fecha;
    // Si viene como YYYY-M-D, agrega ceros
    const d = new Date(fecha);
    return d.toISOString().split('T')[0];
  };

  // Cargar reservas del backend
  const fetchCitas = () => {
    fetch(`${API_URL}/api/reservas`)
      .then(res => res.json())
      .then(data => {
        console.log("Reservas recibidas:", data);
        console.log("fechaActual:", fechaActual);
        // Filtrar por la fecha seleccionada, normalizando ambas fechas
        setCitasHoy(data.filter(c => normalizeFecha(c.fecha) === fechaActual));
      })
      .catch(() => {
        setCitasHoy([]);
        setError('Error al cargar reservas');
      });
  };

  useEffect(() => {
    fetchCitas();
    // eslint-disable-next-line
  }, [selectedDate, fechaActual]);

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
    if (!form.cliente || !form.servicio || !form.vehiculo || !form.hora || !form.motivo) {
      setError('Todos los campos son obligatorios');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/reservas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, fecha: fechaActual })
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Error al guardar la reserva');
        return;
      }
      setForm({ cliente: '', servicio: '', vehiculo: '', hora: '', motivo: '' });
      setSuccess('¡Reserva creada exitosamente!');
      setOpen(false);
      fetchCitas();
    } catch (err) {
      setError('Error de red o del servidor');
    }
  };

  const handleDelete = async id => {
    await fetch(`${API_URL}/api/reservas/${id}`, { method: 'DELETE' });
    fetchCitas();
  };

  const handleAsistencia = async (id, asiste) => {
    await fetch(`${API_URL}/api/reservas/${id}/asistencia`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ asiste })
    });
    fetchCitas();
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} mb={3}>Sistema de Reservas</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <Paper elevation={2} sx={{ p: 3, mb: 2 }}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Selecciona una fecha"
                value={selectedDate}
                onChange={date => setSelectedDate(date)}
                views={['year', 'month', 'day']}
                openTo="day"
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </LocalizationProvider>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} mb={2}>Citas de Hoy</Typography>
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
            <List>
              {citasHoy.length === 0 && (
                <Typography color="text.secondary" sx={{ mt: 2 }}>No hay reservas para esta fecha.</Typography>
              )}
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
