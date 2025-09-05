import React, { useState } from 'react';
import { Box, Typography, Paper, Grid, TextField, Button, Dialog, DialogTitle, DialogContent, DialogActions, Table, TableHead, TableRow, TableCell, TableBody, Chip, Stack, Tooltip } from '@mui/material';

import { useEffect } from 'react';
import { apiFetch } from '../utils/api';


function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [histOpen, setHistOpen] = useState(false);
  const [histCliente, setHistCliente] = useState(null);
  const [histData, setHistData] = useState({ reps: [], hist: [] });
  const [loadingHist, setLoadingHist] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiFetch('/api/clientes');
        setClientes(Array.isArray(data) ? data : []);
      } catch {
        setClientes([]);
      }
    })();
  }, []);

  // Tenant actual
  const myUser = (() => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } })();
  const myTallerId = myUser?.taller_id ?? null;
  const isReadOnly = (row) => {
    if (!myTallerId) return false;
    return row?.taller_id && row.taller_id !== myTallerId;
  };

  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const resultados = (Array.isArray(clientes) ? clientes : []).filter(c => c.nombre?.toLowerCase().includes(busqueda.toLowerCase()));

  const [form, setForm] = useState({
    nombre: '',
    telefono: '',
    email: '',
    vehiculo: '',
    ultimaVisita: '',
    desde: ''
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const nuevo = await apiFetch('/api/clientes', {
        method: 'POST',
        body: JSON.stringify(form)
      });
      setClientes([...(Array.isArray(clientes) ? clientes : []), nuevo]);
      setForm({ nombre: '', telefono: '', email: '', vehiculo: '', ultimaVisita: '', desde: '' });
      handleClose();
    } catch {
      alert('Error al guardar cliente');
      handleClose();
    }
  };

  async function handleDelete(id) {
    try {
      await apiFetch(`/api/clientes/${id}`, { method: 'DELETE' });
      setClientes((Array.isArray(clientes) ? clientes : []).filter(c => c.id !== id));
    } catch {
      alert('Error al eliminar cliente');
    }
  }

  const abrirHistorial = async (cli) => {
    try {
      setHistCliente(cli);
      setLoadingHist(true);
      setHistOpen(true);
      const [reps, hist] = await Promise.all([
        apiFetch('/api/reparaciones').catch(() => []),
        apiFetch('/api/historial').catch(() => [])
      ]);
      const nombre = (cli?.nombre || '').toString().toLowerCase();
      const patente = (cli?.patente || '').toString().toLowerCase();
      const vehiculo = (cli?.vehiculo || '').toString().toLowerCase();
      const repsFilt = (Array.isArray(reps) ? reps : []).filter(r => {
        const byNombre = (r?.cliente || '').toString().toLowerCase() === nombre && !!nombre;
        const byPatente = (r?.patente || '').toString().toLowerCase() === patente && !!patente;
        const byVeh = (r?.vehiculo || '').toString().toLowerCase() === vehiculo && !!vehiculo;
        return byNombre || byPatente || byVeh;
      });
      const histFilt = (Array.isArray(hist) ? hist : []).filter(h => {
        const byNombre = (h?.cliente || '').toString().toLowerCase() === nombre && !!nombre;
        const byPatente = (h?.patente || '').toString().toLowerCase() === patente && !!patente;
        const byVeh = (h?.vehiculo || '').toString().toLowerCase() === vehiculo && !!vehiculo;
        return byNombre || byPatente || byVeh;
      });
      setHistData({ reps: repsFilt, hist: histFilt });
    } catch (e) {
      setHistData({ reps: [], hist: [] });
    } finally {
      setLoadingHist(false);
    }
  };

  const CLP = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });
  const labelEstado = (val) => {
    const v = (val || '').toString().toLowerCase().trim();
    if (v === 'pending' || v === 'pendiente' || v === 'open') return 'Pendiente';
    if (v === 'progress' || v === 'en proceso' || v === 'en progreso' || v === 'process') return 'En progreso';
    if (v === 'done' || v === 'completado' || v === 'completed') return 'Completado';
    if (v === 'cancelled' || v === 'cancelado') return 'Cancelado';
    return val || '-';
  };

  return (
    <>
      <Box>
        <Typography variant="h4" fontWeight={700} mb={3}>Gestión de Clientes</Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Buscar cliente..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            sx={{ minWidth: 240 }}
          />
          <Button variant="contained" color="primary">Buscar</Button>
          <Button variant="contained" color="primary" sx={{ ml: 2 }} onClick={handleOpen}>
            + Nuevo Cliente
          </Button>
        </Box>
        <Grid container spacing={2}>
          {resultados.map((c, i) => (
            <Grid item xs={12} md={6} key={c.id || i}>
              <Paper elevation={2} sx={{ p: 2 }}>
                <Typography variant="h6" fontWeight={600}>{c.nombre} {isReadOnly(c) && (<Chip size="small" label="Otro taller" sx={{ ml: 1 }} />)}</Typography>
                <Typography variant="body2" color="text.secondary">Cliente desde {c.desde}</Typography>
                <Typography variant="body2">Teléfono: {c.telefono}</Typography>
                <Typography variant="body2">Email: {c.email}</Typography>
                <Typography variant="body2">Vehículo: {c.vehiculo}</Typography>
                <Typography variant="body2" mb={1}>Última visita: {c.ultimaVisita ? new Date(c.ultimaVisita).toLocaleDateString() : ''}</Typography>
                <Button variant="contained" size="small" sx={{ mr: 1 }} onClick={() => abrirHistorial(c)}>Ver Historial</Button>
                <Tooltip title={isReadOnly(c) ? 'Solo lectura (otro taller)' : ''}>
                  <span>
                    <Button variant="outlined" size="small" color="error" onClick={() => handleDelete(c.id)} disabled={isReadOnly(c)}>Eliminar</Button>
                  </span>
                </Tooltip>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>
      {/* Modal de Historial del Cliente */}
      <Dialog open={histOpen} onClose={() => setHistOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Historial de {histCliente?.nombre || ''}</DialogTitle>
        <DialogContent dividers>
          {histCliente && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2">Datos del cliente</Typography>
              <Grid container spacing={2} sx={{ mt: 0.5 }}>
                <Grid item xs={6}><Typography variant="body2"><b>Teléfono:</b> {histCliente.telefono || '-'}</Typography></Grid>
                <Grid item xs={6}><Typography variant="body2"><b>Email:</b> {histCliente.email || '-'}</Typography></Grid>
                <Grid item xs={6}><Typography variant="body2"><b>Vehículo:</b> {histCliente.vehiculo || '-'}</Typography></Grid>
                <Grid item xs={6}><Typography variant="body2"><b>Patente:</b> {histCliente.patente || '-'}</Typography></Grid>
                <Grid item xs={6}><Typography variant="body2"><b>Última visita:</b> {histCliente.ultimaVisita ? new Date(histCliente.ultimaVisita).toLocaleDateString() : '-'}</Typography></Grid>
              </Grid>
            </Box>
          )}

          <Typography variant="subtitle2" sx={{ mb: 1 }}>Reparaciones</Typography>
          {loadingHist ? (
            <Typography variant="body2">Cargando...</Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Servicio / Problema</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell align="right">Costo</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(histData.reps || []).map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.fecha ? new Date(r.fecha).toLocaleDateString() : '-'}</TableCell>
                    <TableCell>
                      <Stack spacing={0.3}>
                        <span><b>Servicio:</b> {r.servicio || '-'}</span>
                        <span><b>Problema:</b> {r.problema || '-'}</span>
                      </Stack>
                    </TableCell>
                    <TableCell><Chip size="small" label={labelEstado(r.estado)} /></TableCell>
                    <TableCell align="right">{CLP.format(Number(r.costo || 0))}</TableCell>
                  </TableRow>
                ))}
                {(histData.reps || []).length === 0 && (
                  <TableRow><TableCell colSpan={4} align="center">Sin reparaciones</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}

          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Historial de servicios</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Fecha</TableCell>
                <TableCell>Servicio</TableCell>
                <TableCell>Taller</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(histData.hist || []).map((h) => (
                <TableRow key={h.id}>
                  <TableCell>{h.fecha ? new Date(h.fecha).toLocaleDateString() : '-'}</TableCell>
                  <TableCell>{h.servicio || '-'}</TableCell>
                  <TableCell>{h.taller || '-'}</TableCell>
                </TableRow>
              ))}
              {(histData.hist || []).length === 0 && (
                <TableRow><TableCell colSpan={3} align="center">Sin historial</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Nuevo Cliente</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField label="Nombre" name="nombre" value={form.nombre} onChange={handleChange} required />
            <TextField label="Teléfono" name="telefono" value={form.telefono} onChange={handleChange} />
            <TextField label="Email" name="email" value={form.email} onChange={handleChange} />
            <TextField label="Vehículo" name="vehiculo" value={form.vehiculo} onChange={handleChange} />
            <TextField label="Última visita" name="ultimaVisita" value={form.ultimaVisita} onChange={handleChange} placeholder="2024-07-27" />
            <TextField label="Cliente desde (año)" name="desde" value={form.desde} onChange={handleChange} />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancelar</Button>
            <Button type="submit" variant="contained">Guardar</Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
}

export default Clientes;
