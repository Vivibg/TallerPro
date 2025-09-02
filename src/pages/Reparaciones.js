import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Select, MenuItem, TextField, Chip, Stack, Dialog, DialogTitle, DialogContent, DialogActions, Alert } from '@mui/material';
import { apiFetch } from '../utils/api';
import FichaReparacionModal from '../components/FichaReparacionModal';

const CLP = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });

const ESTADOS = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'pending', label: 'Pendiente' },
  { value: 'progress', label: 'En progreso' },
  { value: 'done', label: 'Completado' },
];

function Reparaciones() {
  const [DATA, setDATA] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ cliente: '', vehiculo: '', problema: '', estado: 'pending', costo: '', fecha: '' });
  const [estado, setEstado] = useState('all');
  const [busqueda, setBusqueda] = useState('');
  const [error, setError] = useState('');
  const [fichaOpen, setFichaOpen] = useState(false);
  const [fichaItem, setFichaItem] = useState(null);

  const fetchReparaciones = () => {
    setError('');
    apiFetch('/api/reparaciones')
      .then(data => {
        Array.isArray(data) ? setDATA(data) : setDATA([]);
      })  
      .catch((err) => {
        setDATA([]);
        const msg = (err?.message || '').toLowerCase();
        if (msg.includes('forbidden') || msg.includes('no autorizado') || msg.includes('403')) {
          setError('No tienes permiso para ver reparaciones (requiere rol admin).');
        } else {
          setError('Error al cargar reparaciones.');
        }
      });
  };

  useEffect(() => {
    fetchReparaciones();
  }, []);

  const handleEstadoChange = async (id, nuevo) => {
    try {
      await apiFetch(`/api/reparaciones/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ estado: nuevo })
      });
      fetchReparaciones();
    } catch (e) {
      console.error('No se pudo actualizar estado:', e?.message || e);
    }
  };

  const abrirFicha = async (row) => {
    try {
      // Cargar datos frescos por ID por si faltan campos
      const detalle = await apiFetch(`/api/reparaciones/${row.id}`);
      setFichaItem(detalle || row);
    } catch {
      setFichaItem(row);
    } finally {
      setFichaOpen(true);
    }
  };

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    await apiFetch('/api/reparaciones', {
      method: 'POST',
      body: JSON.stringify(form)
    });
    setForm({ cliente: '', vehiculo: '', problema: '', estado: 'pending', costo: '', fecha: '' });
    setOpen(false);
    fetchReparaciones();
  };

  const handleDelete = async id => {
    await apiFetch(`/api/reparaciones/${id}`, { method: 'DELETE' });
    fetchReparaciones();
  };

  const filtrar = (row) => {
    // Tratar 'open' (legacy) como 'pending' para compatibilidad
    const estadoRow = row.estado === 'open' ? 'pending' : row.estado;
    if (estado !== 'all' && estadoRow !== estado) return false;
    if (busqueda && !( `${row.cliente} ${row.vehiculo}`.toLowerCase().includes(busqueda.toLowerCase()) )) return false;
    return true;
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} mb={3}>Gestión de Reparaciones</Typography>
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <Select
            value={estado}
            onChange={e => setEstado(e.target.value)}
            size="small"
            sx={{ minWidth: 140 }}
          >
            {ESTADOS.map(opt => (
              <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
            ))}
          </Select>
          <TextField
            size="small"
            placeholder="Buscar cliente..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            sx={{ minWidth: 200 }}
          />
          <TextField
            select
            size="small"
            value={estado}
            onChange={e => setEstado(e.target.value)}
            SelectProps={{ native: true }}
          >
            <option value="all">Todos</option>
            {ESTADOS.map((e) => (
              <option value={e.value} key={e.value}>{e.label}</option>
            ))}
          </TextField>
          <Button variant="contained" color="primary" sx={{ ml: 'auto' }} onClick={handleOpen}>
            + Nueva Reparación
          </Button>
          <Button variant="outlined" onClick={fetchReparaciones}>Refrescar</Button>
        </Stack>
        {error && <Alert severity="warning" sx={{ mt: 2 }}>{error}</Alert>}
        <Dialog open={open} onClose={handleClose}>
          <DialogTitle>Nueva Reparación</DialogTitle>
          <form onSubmit={handleSubmit}>
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField label="Cliente" name="cliente" value={form.cliente} onChange={handleChange} required />
              <TextField label="Vehículo" name="vehiculo" value={form.vehiculo} onChange={handleChange} required />
              <TextField label="Problema" name="problema" value={form.problema} onChange={handleChange} />
              <TextField label="Estado" name="estado" value={form.estado} onChange={handleChange} select SelectProps={{ native: true }}>
                <option value="pending">Pendiente</option>
                <option value="progress">En Proceso</option>
                <option value="done">Completado</option>
              </TextField>
              <TextField label="Costo" name="costo" value={form.costo} onChange={handleChange} type="number" />
              <TextField label="Fecha" name="fecha" value={form.fecha} onChange={handleChange} placeholder="2024-07-27" />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleClose}>Cancelar</Button>
              <Button type="submit" variant="contained">Guardar</Button>
            </DialogActions>
          </form>
        </Dialog>
      </Paper>
      <TableContainer component={Paper} elevation={1}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Patente</TableCell>
              <TableCell>Cliente</TableCell>
              <TableCell>Vehículo</TableCell>
              <TableCell>Problema</TableCell>
              <TableCell>Acciones</TableCell>
              <TableCell>Costo total</TableCell>
              <TableCell>Estado</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(Array.isArray(DATA) ? DATA : []).filter(filtrar).map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.patente || ''}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{row.cliente}</TableCell>
                <TableCell>{row.vehiculo}</TableCell>
                <TableCell>{row.problema}</TableCell>
                <TableCell>
                  <Button variant="contained" size="small" onClick={() => abrirFicha(row)}>VER</Button>
                  &nbsp;
                  <Button variant="outlined" color="error" size="small" onClick={() => handleDelete(row.id)}>ELIMINAR</Button>
                </TableCell>
                <TableCell>{(() => {
                  const mano = Number(row?.costo_mano_obra ?? row?.costoManoObra ?? 0);
                  const insumosDirect = Number(row?.costo_insumos ?? row?.costoInsumos ?? NaN);
                  const insumosCalc = Array.isArray(row?.repuestos)
                    ? row.repuestos.reduce((acc, r) => {
                        const cant = Number(r?.cantidad || 0);
                        const precio = Number(r?.precio || 0);
                        const tot = cant * precio;
                        return acc + (isNaN(tot) ? 0 : tot);
                      }, 0)
                    : 0;
                  const insumos = isNaN(insumosDirect) ? insumosCalc : insumosDirect;
                  const total = Number(row?.costo_total ?? row?.costoTotal ?? (mano + insumos) ?? 0);
                  return CLP.format(Number(total || 0));
                })()}</TableCell>
                <TableCell>
                  <Select
                    size="small"
                    value={row.estado === 'open' ? 'pending' : (row.estado || 'pending')}
                    onChange={(e) => handleEstadoChange(row.id, e.target.value || 'pending')}
                  >
                    <MenuItem value="pending">Pendiente</MenuItem>
                    <MenuItem value="progress">En progreso</MenuItem>
                    <MenuItem value="done">Completado</MenuItem>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Ficha de reparación */}
      {fichaItem && (
        <FichaReparacionModal
          open={fichaOpen}
          onClose={() => setFichaOpen(false)}
          reparacion={fichaItem}
          onSaved={() => { setFichaOpen(false); fetchReparaciones(); }}
        />
      )}
    </Box>
  );
}

export default Reparaciones;
 
