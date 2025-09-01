import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody
} from '@mui/material';

function VistaCliente() {
  const [patente, setPatente] = useState('');
  const [resultados, setResultados] = useState([]);
  const [error, setError] = useState('');

  // Función para traducir estado a español
  const estadoEnEsp = estado => {
    switch ((estado || '').toLowerCase()) {
      case 'process':
      case 'progress':
        return 'En proceso';
      case 'pendiente':
      case 'pending':
        return 'Pendiente';
      case 'completado':
      case 'done':
        return 'Completado';
      case 'cancelado':
      case 'cancelled':
        return 'Cancelado';
      default:
        return estado || '-';
    }
  };

  const handleBuscar = async () => {
    setError('');
    setResultados([]);
    if (!patente) {
      setError('Debe ingresar una patente');
      return;
    }
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/reparaciones/por-patente/${encodeURIComponent(patente)}`);
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) {
        setError('No se encontraron reparaciones para esa patente');
        return;
      }
      setResultados(data);
    } catch {
      setError('Error consultando el vehículo');
    }
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} mb={3}>Consulta de Estado de Vehículo</Typography>
      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          label="Patente"
          value={patente}
          onChange={e => setPatente(e.target.value)}
          sx={{ mr: 2 }}
        />
        <Button variant="contained" onClick={handleBuscar}>Buscar</Button>
      </Paper>
      {error && <Typography color="error" mb={2}>{error}</Typography>}
      {resultados.length > 0 && (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Fecha</TableCell>
              <TableCell>Diagnóstico</TableCell>
              <TableCell>Trabajo Realizado</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Costo Final</TableCell>
              <TableCell>Taller</TableCell>
              <TableCell>Mecánico</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {resultados.map((r, i) => (
              <TableRow key={i}>
                <TableCell>{r.fecha ? new Date(r.fecha).toLocaleDateString() : ''}</TableCell>
                <TableCell>{r.diagnostico || '-'}</TableCell>
                <TableCell>{r.trabajos || '-'}</TableCell>
                <TableCell>{estadoEnEsp(r.estado)}</TableCell>
                <TableCell>${Number(r.costo ?? 0).toLocaleString()}</TableCell>
                <TableCell>{r.taller || '-'}</TableCell>
                <TableCell>{r.mecanico || '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Box>
  );
}

export default VistaCliente;
