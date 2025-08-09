import React, { useEffect, useState } from 'react';
import { Box, Typography, Grid, Paper, Stack } from '@mui/material';
import BuildIcon from '@mui/icons-material/Build';
import EventNoteIcon from '@mui/icons-material/EventNote';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';

const API_URL = process.env.REACT_APP_API_URL;

function Dashboard() {
  const [stats, setStats] = useState([
    { label: 'Reparaciones Activas', value: 0, icon: <BuildIcon color="primary" />, color: '#2258e6' },
    { label: 'Reservas Hoy', value: 0, icon: <EventNoteIcon color="success" />, color: '#3bb54a' },
    { label: 'Insumos Críticos', value: 0, icon: <WarningAmberIcon color="warning" />, color: '#ffb300' },
    { label: 'Ingresos del Mes', value: '$0', icon: <AttachMoneyIcon color="secondary" />, color: '#7c3aed' },
  ]);
  const [actividad, setActividad] = useState([]);

  useEffect(() => {
    // Reparaciones activas
    fetch(`${API_URL}/api/reparaciones`)
      .then(res => res.json())
      .then(data => {
        setStats(s => s.map(stat =>
          stat.label === 'Reparaciones Activas' ? { ...stat, value: data.filter(r => r.estado !== 'completada').length } : stat
        ));
        // Actividad: últimas reparaciones
        const ultimasRep = data
          .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
          .slice(0, 2)
          .map(r => ({
            texto: `Reparación ${r.estado === 'completada' ? 'completada' : 'creada'} - ${r.vehiculo}`,
            tiempo: r.fecha,
            icon: <BuildIcon sx={{ color: '#2258e6' }} />
          }));
        setActividad(a => [...ultimasRep, ...a]);
      });

    // Reservas de hoy
    const hoy = new Date().toISOString().split('T')[0];
    fetch(`${API_URL}/api/reservas`)
      .then(res => res.json())
      .then(data => {
        setStats(s => s.map(stat =>
          stat.label === 'Reservas Hoy' ? { ...stat, value: data.filter(r => r.fecha === hoy).length } : stat
        ));
        // Actividad: últimas reservas
        const ultimasRes = data
          .sort((a, b) => new Date(b.fecha + 'T' + b.hora) - new Date(a.fecha + 'T' + a.hora))
          .slice(0, 2)
          .map(r => ({
            texto: `Nueva reserva - ${r.cliente}`,
            tiempo: `${r.fecha} ${r.hora}`,
            icon: <EventNoteIcon sx={{ color: '#3bb54a' }} />
          }));
        setActividad(a => [...ultimasRes, ...a]);
      });

    // Insumos críticos (stock bajo)
    fetch(`${API_URL}/api/inventario`)
      .then(res => res.json())
      .then(data => {
        setStats(s => s.map(stat =>
          stat.label === 'Insumos Críticos' ? { ...stat, value: data.filter(p => p.stock <= p.stock_min).length } : stat
        ));
        // Actividad: últimas alertas de stock
        const ultimosStock = data
          .filter(p => p.stock <= p.stock_min)
          .slice(0, 1)
          .map(p => ({
            texto: `Stock bajo - ${p.nombre}`,
            tiempo: 'Hoy',
            icon: <WarningAmberIcon sx={{ color: '#ffb300' }} />
          }));
        setActividad(a => [...ultimosStock, ...a]);
      });

    // Ingresos del mes (puedes adaptar el endpoint)
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
