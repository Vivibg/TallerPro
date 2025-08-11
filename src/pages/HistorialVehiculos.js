import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Button, Grid, TextField, List, ListItem } from '@mui/material';
import FichaReparacionModal from '../components/FichaReparacionModal';

const API_URL = process.env.REACT_APP_API_URL;

function HistorialVehiculos() {
  const [historial, setHistorial] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [fichaOpen, setFichaOpen] = useState(false);
  const [fichaActual, setFichaActual] = useState(null);

  const fetchHistorial = async () => {
    const res = await fetch(`${API_URL}/api/reparaciones/historial`);
    const data = await res.json();
    setHistorial(data);
  };

  useEffect(() => {
    fetchHistorial();
    // eslint-disable-next-line
  }, []);

  const handleVerFicha = (item) => {
    setFichaActual(item);
    setFichaOpen(true);
  };

  const handleCloseFicha = () => {
    setFichaOpen(false);
    setFichaActual(null);
    fetchHistorial(); // refresca después de editar
  };

  const historialFiltrado = historial.filter(item =>
    item.vehiculo.toLowerCase().includes(busqueda.toLowerCase()) ||
    (item.patente || '').toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} mb={3}>Historial de Vehículos</Typography>
      <TextField
        label="Buscar vehículo o placas..."
        value={busqueda}
        onChange={e => setBusqueda(e.target.value)}
        sx={{ mb: 2, mr: 2 }}
      />
      <Button variant="contained" onClick={fetchHistorial}>Buscar</Button>
      <Grid container spacing={2} sx={{ mt: 2 }}>
        {historialFiltrado.length === 0 && (
          <Typography sx={{ m: 2 }}>No hay registros.</Typography>
        )}
        {historialFiltrado.map(item => (
          <Grid item xs={12} md={6} key={item.id}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" fontWeight={700}>{item.vehiculo}</Typography>
              <Typography>Patente: {item.patente}</Typography>
              <Typography>Cliente: {item.cliente}</Typography>
              <Typography>Servicio: {item.servicio}</Typography>
              <Typography>Taller: {item.taller}</Typography>
              <Typography>Fecha: {item.fecha && item.fecha.toString().slice(0,10)}</Typography>
              <Typography>Diagnóstico: {item.diagnostico || 'Sin diagnóstico'}</Typography>
              <Typography>Trabajos: {item.trabajos || 'Sin trabajos'}</Typography>
              <Button
                sx={{ mt: 2, mr: 1 }}
                variant="contained"
                onClick={() => handleVerFicha(item)}
              >
                Ver ficha completa
              </Button>
            </Paper>
          </Grid>
        ))}
      </Grid>
      {fichaActual && (
        <FichaReparacionModal
          open={fichaOpen}
          onClose={handleCloseFicha}
          reparacion={fichaActual}
          modoHistorial={true}
        />
      )}
    </Box>
  );
}

export default HistorialVehiculos;
