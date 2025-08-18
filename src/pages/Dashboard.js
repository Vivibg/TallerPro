import React, { useEffect, useState } from 'react';
import { Box, Typography, Grid, Paper, Stack } from '@mui/material';
import BuildIcon from '@mui/icons-material/Build';
import EventNoteIcon from '@mui/icons-material/EventNote';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import GroupIcon from '@mui/icons-material/Group';

const API_URL = process.env.REACT_APP_API_URL;

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

function Dashboard() {
  const [stats, setStats] = useState([
    { label: 'Reservas Totales', value: 0, icon: <EventNoteIcon color="primary" />, color: '#2258e6' },
    { label: 'Clientes Registrados', value: 0, icon: <GroupIcon color="success" />, color: '#3bb54a' },
    { label: 'Insumos Críticos', value: 0, icon: <WarningAmberIcon color="warning" />, color: '#ffb300' },
    { label: 'Productos en Inventario', value: 0, icon: <BuildIcon color="secondary" />, color: '#7c3aed' },
  ]);
  const [actividad, setActividad] = useState([]);

  useEffect(() => {
    // RESERVAS
    fetch(`${API_URL}/api/reservas`)
      .then(res => res.json())
      .then(data => {
        setStats(s => s.map(stat =>
          stat.label === 'Reservas Totales' ? { ...stat, value: data.length } : stat
        ));
        // Actividad: últimas reservas
        const ultimasRes = data
          .sort((a, b) => new Date(b.fecha + 'T' + (b.hora || '00:00')) - new Date(a.fecha + 'T' + (a.hora || '00:00')))
          .slice(0, 2)
          .map(r => ({
            texto: `Nueva reserva - ${r.cliente}`,
            tiempo: formatearFechaHora(r.fecha, r.hora),
            icon: <EventNoteIcon sx={{ color: '#2258e6' }} />
          }));
        setActividad(a => [...ultimasRes, ...a]);
      });

    // CLIENTES
    fetch(`${API_URL}/api/clientes`)
      .then(res => res.json())
      .then(data => {
        setStats(s => s.map(stat =>
          stat.label === 'Clientes Registrados' ? { ...stat, value: data.length } : stat
        ));
        // Actividad: último cliente
        if (data.length > 0) {
          const ultimo = data[data.length - 1];
          setActividad(a => [{
            texto: `Nuevo cliente - ${ultimo.nombre}`,
            tiempo: 'Reciente',
            icon: <GroupIcon sx={{ color: '#3bb54a' }} />
          }, ...a]);
        }
      });

    // INVENTARIO
    fetch(`${API_URL}/api/inventario`)
      .then(res => res.json())
      .then(data => {
        setStats(s => s.map(stat =>
          stat.label === 'Productos en Inventario'
            ? { ...stat, value: data.length }
            : stat.label === 'Insumos Críticos'
              ? { ...stat, value: data.filter(p => p.stock <= p.stock_min).length }
              : stat
        ));
        // Actividad: últimos insumos críticos
        const ultimosStock = data
          .filter(p => p.stock <= p.stock_min)
          .slice(0, 1)
          .map(p => ({
            texto: `Stock crítico - ${p.nombre}`,
            tiempo: 'Hoy',
            icon: <WarningAmberIcon sx={{ color: '#ffb300' }} />
          }));
        setActividad(a => [...ultimosStock, ...a]);
      });

    // fetch(`${API_URL}/api/ingresos`)
    //   .then(res => res.json())
    //   .then(data => {
    //     setStats(s => s.map(stat =>
    //       stat.label === 'Ingresos del Mes' ? { ...stat, value: `$${data.mesActual}` } : stat
    //     ));
    //   });

  }, []);

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} mb={3}>Dashboard</Typography>
      <Grid container spacing={2} mb={3}>
        {stats.map((stat) => (
          <Grid item xs={12} sm={6} md={3} key={stat.label}>
            <Paper elevation={2} sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
              {stat.icon}
              <Box>
                <Typography variant="subtitle2" color="text.secondary">{stat.label}</Typography>
                <Typography variant="h5" fontWeight={600} color={stat.color}>{stat.value}</Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
      <Paper elevation={1} sx={{ p: 2 }}>
        <Typography variant="h6" fontWeight={600} mb={2}>Actividad Reciente</Typography>
        <Stack spacing={2}>
          {actividad.length === 0 && (
            <Typography color="text.secondary">No hay actividad reciente.</Typography>
          )}
          {actividad.map((item, i) => (
            <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {item.icon}
              <Box>
                <Typography>{item.texto}</Typography>
                <Typography variant="caption" color="text.secondary">{item.tiempo}</Typography>
              </Box>
            </Box>
          ))}
        </Stack>
      </Paper>
    </Box>
  );
}

export default Dashboard;
