import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Paper, Grid, Button, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import FichaReparacionModal from './FichaReparacionModal';

function HistorialVehiculos() {
  const [historiales, setHistoriales] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [open, setOpen] = useState(false);
  const [detalle, setDetalle] = useState(null);
  const [form, setForm] = useState({
    vehiculo: '',
    patente: '',
    cliente: '',
    fecha: '',
    servicio: '',
    taller: ''
  });

  // Nuevo estado para la ficha completa
  const [fichaOpen, setFichaOpen] = useState(false);
  const [reparacionSeleccionada, setReparacionSeleccionada] = useState(null);

  // Cargar historial con ficha al montar el componente
  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/api/historial/con-ficha`)
      .then(res => res.json())
      .then(data => Array.isArray(data) ? setHistoriales(data) : setHistoriales([]))
      .catch(() => setHistoriales([]));
  }, []);

  // Abrir/cerrar modal de nuevo servicio
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  // Abrir/cerrar modal de detalle de ficha (resumen)
  const handleDetalleOpen = (h) => setDetalle(h);
  const handleDetalleClose = () => setDetalle(null);

  // Abrir/cerrar modal de ficha completa
  const handleVerFicha = async (h) => {
    // Buscar la reparación asociada a esta patente y fecha
    const res = await fetch(`${process.env.REACT_APP_API_URL}/api/reparaciones?patente=${h.patente}&fecha=${h.fecha}`);
    const data = await res.json();
    if (data && data.length > 0) {
      setReparacionSeleccionada(data[0]);
      setFichaOpen(true);
    } else {
      alert('No se encontró la ficha de reparación asociada a este historial.');
    }
  };
  const handleFichaClose = () => setFichaOpen(false);

  // Manejar cambios en el formulario
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Agregar nuevo historial
  const handleSubmit = (e) => {
    e.preventDefault();
    fetch(`${process.env.REACT_APP_API_URL}/api/historial`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
      .then(res => res.json())
      .then(data => {
        setHistoriales([...historiales, data]);
        handleClose();
        setForm({
          vehiculo: '',
          patente: '',
          cliente: '',
          fecha: '',
          servicio: '',
          taller: ''
        });
      })
      .catch(() => handleClose());
  };

  // Eliminar historial
  const handleDelete = (id) => {
    fetch(`${process.env.REACT_APP_API_URL}/api/historial/${id}`, {
      method: 'DELETE'
    })
      .then(() => setHistoriales(historiales.filter(h => h.id !== id)));
  };

  // Filtrar resultados por búsqueda
  const resultados = historiales.filter(h =>
    h.vehiculo?.toLowerCase().includes(busqueda.toLowerCase()) ||
    h.patente?.toLowerCase().includes(busqueda.toLowerCase())
  );

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
        <Button variant="contained" color="primary" sx={{ ml: 2 }} onClick={handleOpen}>
          + Nuevo Servicio
        </Button>
        <Dialog open={open} onClose={handleClose}>
          <DialogTitle>Nuevo Servicio</DialogTitle>
          <form onSubmit={handleSubmit}>
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField label="Vehículo" name="vehiculo" value={form.vehiculo} onChange={handleChange} required />
              <TextField label="Patente" name="patente" value={form.patente} onChange={handleChange} />
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
              <Typography variant="body2" color="text.secondary">Patente: {h.patente}</Typography>
              <Typography variant="body2">Cliente: {h.cliente}</Typography>
              <Typography variant="body2">Servicio: {h.servicio}</Typography>
              <Typography variant="body2">Taller: {h.taller}</Typography>
              <Typography variant="body2" mb={1}>Fecha: {h.fecha}</Typography>
              {/* Resumen de ficha */}
              {h.diagnostico && (
                <>
                  <Typography variant="subtitle2" sx={{ mt: 1 }}>Diagnóstico:</Typography>
                  <Typography variant="body2">{h.diagnostico}</Typography>
                </>
              )}
              {h.trabajos && (
                <>
                  <Typography variant="subtitle2">Trabajos:</Typography>
                  <Typography variant="body2">{h.trabajos}</Typography>
                </>
              )}
              {h.observaciones && (
                <>
                  <Typography variant="subtitle2">Observaciones:</Typography>
                  <Typography variant="body2">{h.observaciones}</Typography>
                </>
              )}
              <Button
                variant="contained"
                size="small"
                sx={{ mr: 1, mt: 1 }}
                onClick={() => handleVerFicha(h)}
              >
                Ver Ficha Completa
              </Button>
              <Button variant="outlined" size="small" color="error" onClick={() => handleDelete(h.id)}>Eliminar</Button>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Modal para ver ficha completa (usando FichaReparacionModal) */}
      <FichaReparacionModal
        open={fichaOpen}
        onClose={handleFichaClose}
        reparacion={reparacionSeleccionada || {}}
      />

      {/* Modal para ver resumen de ficha (opcional, puedes quitarlo si no lo usas) */}
      <Dialog open={!!detalle} onClose={handleDetalleClose} maxWidth="md" fullWidth>
        <DialogTitle>Ficha Completa de Reparación</DialogTitle>
        <DialogContent dividers>
          {detalle && (
            <>
              <Typography variant="subtitle1" gutterBottom>Diagnóstico:</Typography>
              <Typography variant="body2" gutterBottom>{detalle.diagnostico || 'No registrado'}</Typography>
              <Typography variant="subtitle1" gutterBottom>Trabajos realizados:</Typography>
              <Typography variant="body2" gutterBottom>{detalle.trabajos || 'No registrado'}</Typography>
              <Typography variant="subtitle1" gutterBottom>Repuestos:</Typography>
              <Typography variant="body2" gutterBottom>
                {detalle.repuestos
                  ? Array.isArray(detalle.repuestos)
                    ? detalle.repuestos.map((r, idx) =>
                        <div key={idx}>{r.descripcion} ({r.cantidad})</div>
                      )
                    : detalle.repuestos
                  : 'No registrado'}
              </Typography>
              <Typography variant="subtitle1" gutterBottom>Observaciones:</Typography>
              <Typography variant="body2" gutterBottom>{detalle.observaciones || 'No registrado'}</Typography>
              <Typography variant="subtitle1" gutterBottom>Garantía:</Typography>
              <Typography variant="body2" gutterBottom>
                {detalle.garantiaPeriodo || '-'} | {detalle.garantiaCondiciones || '-'}
              </Typography>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDetalleClose}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default HistorialVehiculos;
