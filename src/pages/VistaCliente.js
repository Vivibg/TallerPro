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
import { useNavigate } from 'react-router-dom';

const CLP = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });
const formatoFecha = (val) => {
  if (!val) return '';
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val);
    const dd = String(d.getDate()).padStart(2,'0');
    const mm = String(d.getMonth()+1).padStart(2,'0');
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  } catch { return String(val); }
};
const normPatente = (p) => (p || '').toString().trim().toUpperCase();

function VistaCliente() {
  const [patente, setPatente] = useState('');
  const [resultados, setResultados] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

 
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
    const p = normPatente(patente);
    setPatente(p);
    if (!p) {
      setError('Debe ingresar una patente');
      return;
    }
    try {
      
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/reparaciones/por-patente/${encodeURIComponent(p)}`);
      let data = [];
      try { data = await res.json(); } catch { data = []; }
      if (!Array.isArray(data) || data.length === 0) {

        const res2 = await fetch(`${process.env.REACT_APP_API_URL}/api/historial`);
        const allHist = await res2.json();
        if (Array.isArray(allHist)) {
          data = allHist.filter(r => normPatente(r?.patente) === p);
        }
      }
      if (!Array.isArray(data) || data.length === 0) {
        setError('No se encontraron registros para esa patente');
        return;
      }
     
      const sorted = [...data].sort((a, b) => {
        const da = a?.fecha ? new Date(a.fecha).getTime() : 0;
        const db = b?.fecha ? new Date(b.fecha).getTime() : 0;
        return db - da;
      });
      setResultados(sorted);
    } catch {
      setError('Error consultando el vehículo');
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', background: '#f5f6fa', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', p: { xs: 2, sm: 4 } }}>
      <Box sx={{ width: '100%', maxWidth: 1000 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h4" fontWeight={700}>Consulta de Estado de Vehículo</Typography>
          <Button variant="text" onClick={() => navigate('/login')}>Volver al Login</Button>
        </Box>
        <Paper sx={{ p: 2, mb: 3 }}>
          <TextField
            label="Patente"
            value={patente}
            onChange={e => setPatente(e.target.value)}
            sx={{ mr: 2, minWidth: 180 }}
          />
          <Button variant="contained" onClick={handleBuscar}>Buscar</Button>
        </Paper>
        {error && <Typography color="error" mb={2}>{error}</Typography>}
        {resultados.length > 0 && (
          <Paper sx={{ p: 2 }}>
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
              <TableRow key={r?.id ?? `${r?.patente || ''}-${r?.fecha || ''}-${i}` }>
                <TableCell>{formatoFecha(r.fecha)}</TableCell>
                <TableCell>{r.diagnostico || '-'}</TableCell>
                <TableCell>{r.trabajos || '-'}</TableCell>
                <TableCell>{estadoEnEsp(r.estado)}</TableCell>
                <TableCell>{(() => {
                  if (!isNaN(Number(r?.costo))) {
                    return CLP.format(Number(r.costo));
                  }
                  const mano = Number(r?.costo_mano_obra ?? r?.costoManoObra ?? 0);
                  const insumosDirect = Number(r?.costo_insumos ?? r?.costoInsumos ?? NaN);
                  const insumosCalc = Array.isArray(r?.repuestos)
                    ? r.repuestos.reduce((acc, rep) => acc + ((Number(rep?.cantidad || 0) * Number(rep?.precio || 0)) || 0), 0)
                    : 0;
                  const insumos = isNaN(insumosDirect) ? insumosCalc : insumosDirect;
                  const total = Number(r?.costo_total ?? r?.costoTotal ?? (mano + insumos) ?? 0);
                  return CLP.format(Number(total || 0));
                })()}</TableCell>
                <TableCell>{r.taller || '-'}</TableCell>
                <TableCell>{r.mecanicoAsignado || r.mecanico_asignado || r.mecanico || '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
            </Table>
          </Paper>
        )}
      </Box>
    </Box>
  );
}

export default VistaCliente;
 
