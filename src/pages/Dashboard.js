import React from 'react';
import { Box, Typography, Grid, Paper, Stack } from '@mui/material';
import BuildIcon from '@mui/icons-material/Build';
import EventNoteIcon from '@mui/icons-material/EventNote';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';

const stats = [
  { label: 'Reparaciones Activas', value: 12, icon: <BuildIcon color="primary" />, color: '#2258e6' },
  { label: 'Reservas Hoy', value: 8, icon: <EventNoteIcon color="success" />, color: '#3bb54a' },
  { label: 'Insumos Críticos', value: 5, icon: <WarningAmberIcon color="warning" />, color: '#ffb300' },
  { label: 'Ingresos del Mes', value: '$45,200', icon: <AttachMoneyIcon color="secondary" />, color: '#7c3aed' },
];

const actividad = [
  { texto: 'Reparación completada - Toyota Corolla', tiempo: 'Hace 2 horas', icon: <BuildIcon sx={{ color: '#2258e6' }} /> },
  { texto: 'Nueva reserva - Juan Pérez', tiempo: 'Hace 1 hora', icon: <EventNoteIcon sx={{ color: '#3bb54a' }} /> },
  { texto: 'Stock bajo - Aceite 5W-30', tiempo: 'Hace 30 minutos', icon: <WarningAmberIcon sx={{ color: '#ffb300' }} /> },
];

function Dashboard() {
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
