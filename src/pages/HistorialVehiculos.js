import React, { useState } from 'react';
import { Box, Typography, TextField, Paper, Grid, Button, List, ListItem, ListItemText, Dialog, DialogTitle, DialogContent, DialogActions, Tooltip, Chip } from '@mui/material';
import FichaReparacionModal from '../components/FichaReparacionModal';

import { useEffect } from 'react';
import { apiFetch } from '../utils/api';


function HistorialVehiculos() {
  const [historiales, setHistoriales] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [repEstados, setRepEstados] = useState(new Map());
  const [scope, setScope] = useState('mine'); // 'mine' | 'all'

  const cargarHistorial = () => {
    Promise.all([
      apiFetch('/api/historial').catch(() => []),
      apiFetch('/api/reparaciones').catch(() => [])
    ]).then(([data, reps]) => {
        // construir mapa id -> estado desde reparaciones
        try {
          const m = new Map();
          (Array.isArray(reps) ? reps : []).forEach(r => { if (r?.id != null) m.set(Number(r.id), r.estado); });
          setRepEstados(m);
        } catch { setRepEstados(new Map()); }
        if (!Array.isArray(data)) { setHistoriales([]); return; }
        // 1) Solo "en proceso" SI existe campo estado; si no existe, incluir (historial puede no tenerlo)
        const inProgress = data.filter(h => {
          if (h?.estado == null) return true; // incluir si no hay estado en la fila del historial
          const e = String(h.estado).toLowerCase();
          return e === 'progress' || e === 'process' || e === 'en proceso' || e === 'en progreso';
        });
        // 2) Ordenar por fecha desc
        const sorted = [...inProgress].sort((a, b) => {
          const da = a?.fecha ? new Date(a.fecha).getTime() : 0;
          const db = b?.fecha ? new Date(b.fecha).getTime() : 0;
          return db - da;
        });
        // 3) Deduplicar por reparacion_id (fallback id)
        const withRid = sorted.filter(h => h?.reparacion_id != null);
        let deduped = [];
        if (withRid.length > 0) {
          const latestByRid = new Map();
          for (const h of withRid) {
            const key = String(h.reparacion_id);
            if (!latestByRid.has(key)) latestByRid.set(key, h);
          }
          deduped = Array.from(latestByRid.values());
        } else {
          const latestById = new Map();
          for (const h of sorted) {
            const key = h?.id != null ? String(h.id) : `${h?.patente || ''}|progress`;
            if (!latestById.has(key)) latestById.set(key, h);
          }
          deduped = Array.from(latestById.values());
        }
        setHistoriales(deduped);
      })
      .catch(() => { setHistoriales([]); setRepEstados(new Map()); });
  };

  // Tenant actual y helper de solo lectura
  const myUser = (() => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } })();
  const myTallerId = myUser?.taller_id ?? null;
  const isReadOnly = (row) => {
    if (!myTallerId) return false;
    return row?.taller_id && row.taller_id !== myTallerId;
  };

  // Formateador CLP y cálculo de total con tolerancia a strings/camelCase
  const CLP = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });
  const totalHist = (h) => {
    if (!h) return null;
    const mano = Number(h?.costo_mano_obra ?? h?.costoManoObra ?? 0);
    const insumos = Number(h?.costo_insumos ?? h?.costoInsumos ?? 0);
    const prefer = h?.costo_total ?? h?.costoTotal ?? (mano + insumos);
    const n = Number(prefer);
    return isNaN(n) ? null : n;
  };

  // Normalizar estado a etiqueta legible
  const labelEstado = (val) => {
    const v = (val || '').toString().toLowerCase().trim();
    if (!v) return '-';
    if (v === 'pending' || v === 'pendiente' || v === 'open') return 'Pendiente';
    if (v === 'progress' || v === 'en proceso' || v === 'en progreso' || v === 'process') return 'En progreso';
    if (v === 'done' || v === 'completado' || v === 'completed') return 'Completado';
    if (v === 'cancelled' || v === 'cancelado') return 'Cancelado';
    return val;
  };

  // Extraer año del campo vehiculo si viene como "Marca Modelo 2002"
  const splitVehiculo = (veh) => {
    const s = (veh || '').toString().trim();
    const m = s.match(/^(.*?)(?:\s+(\d{4}))?$/);
    if (!m) return { nombre: s, anio: '' };
    const nombre = (m[1] || '').trim();
    const anio = (m[2] || '').trim();
    return { nombre: nombre || s, anio };
  };

  useEffect(() => {
    cargarHistorial();
  }, []);

  // Formato de fecha DD-MM-YYYY
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

  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  // Ficha unificada de reparación
  const [fichaOpen, setFichaOpen] = useState(false);
  const [fichaData, setFichaData] = useState(null);
  const openFicha = async (h) => {
    if (!h?.reparacion_id) return;
    try {
      const detalle = await apiFetch(`/api/reparaciones/${h.reparacion_id}`);
      setFichaData(detalle || { id: h.reparacion_id, cliente: h.cliente, vehiculo: h.vehiculo, patente: h.patente, problema: h.servicio });
    } catch {
      setFichaData({ id: h.reparacion_id, cliente: h.cliente, vehiculo: h.vehiculo, patente: h.patente, problema: h.servicio });
    } finally {
      setFichaOpen(true);
    }
  };

  const [form, setForm] = useState({
    vehiculo: '',
    patente: '',
    cliente: '',
    fecha: '',
    servicio: '',
    taller: ''
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const nuevo = await apiFetch('/api/historial', {
        method: 'POST',
        body: JSON.stringify(form)
      });
      setHistoriales([...(Array.isArray(historiales) ? historiales : []), nuevo]);
      setForm({ vehiculo: '', patente: '', cliente: '', fecha: '', servicio: '', taller: '' });
      handleClose();
    } catch {
      alert('Error al guardar historial');
      handleClose();
    }
  };

  async function handleDelete(id) {
    try {
      await apiFetch(`/api/historial/${id}`, { method: 'DELETE' });
      setHistoriales((Array.isArray(historiales) ? historiales : []).filter(h => h.id !== id));
    } catch {
      alert('Error al eliminar historial');
    }
  }

  const resultados = (Array.isArray(historiales) ? historiales : [])
    .filter(h => {
      if (scope === 'mine' && myTallerId != null) {
        const sameTenant = Number(h?.taller_id) === Number(myTallerId);
        if (!sameTenant) return false;
      }
      return true;
    })
    .filter(h => {
      const patente = (h.patente || '').toLowerCase();
      const veh = (h.vehiculo || '').toLowerCase();
      const q = busqueda.toLowerCase();
      return veh.includes(q) || patente.includes(q);
    });

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
        <Button variant="outlined" onClick={cargarHistorial}>Refrescar</Button>
        <TextField
          select
          size="small"
          label="Alcance"
          value={scope}
          onChange={e => setScope(e.target.value)}
          SelectProps={{ native: true }}
        >
          <option value="mine">Mi taller</option>
          <option value="all">Todos</option>
        </TextField>
        <Button variant="contained" color="primary" sx={{ ml: 2 }} onClick={handleOpen}>
          + Nuevo Servicio
        </Button>
        <Dialog open={open} onClose={handleClose}>
          <DialogTitle>Nuevo Servicio</DialogTitle>
          <form onSubmit={handleSubmit}>
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField label="Vehículo" name="vehiculo" value={form.vehiculo} onChange={handleChange} required />
              <TextField label="Patente" name="patente" value={form.patente || ''} onChange={handleChange} />
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
        {/* Ficha unificada */}
        {fichaData && (
          <FichaReparacionModal
            open={fichaOpen}
            onClose={() => setFichaOpen(false)}
            reparacion={fichaData}
            onSaved={() => cargarHistorial()}
          />
        )}
      </Box>
      <Grid container spacing={2}>
        {resultados.map((h, i) => (
          <Grid item xs={12} md={6} key={h?.reparacion_id ?? h?.id ?? `${h?.patente || ''}-${i}`}>
            <Paper elevation={2} sx={{ p: 2 }}>
              {(() => { const { nombre, anio } = splitVehiculo(h.vehiculo); return (
                <>
                  <Typography variant="h6" fontWeight={600}>{`${nombre}${h.patente ? ` - ${h.patente}` : ''}`} {isReadOnly(h) && (<Chip size="small" label="Otro taller" sx={{ ml: 1 }} />)}</Typography>
                  {anio && (<Typography variant="body2" color="text.secondary">Año: {anio}</Typography>)}
                </>
              ); })()}
              <Typography variant="body2">Cliente: {h.cliente}</Typography>
              <Typography variant="body2">Servicio: {h.servicio}</Typography>
              <Typography variant="body2">Taller: {h.taller}</Typography>
              <Typography variant="body2">Estado: {labelEstado(repEstados.get(Number(h.reparacion_id)) ?? h.estado)}</Typography>
              <Typography variant="body2" mb={1}>Fecha: {formatoFecha(h.fecha)}</Typography>
              {/* Costos si están presentes */}
              { (totalHist(h) != null) && (
                <Box sx={{ mb: 1 }}>
                  <Typography variant="body2"><strong>Total:</strong> {CLP.format(totalHist(h) || 0)}</Typography>
                </Box>
              )}
              {h.reparacion_id ? (
                <Button variant="contained" size="small" sx={{ mr: 1 }} onClick={() => openFicha(h)}>
                  Editar reparación
                </Button>
              ) : (
                <Button variant="contained" size="small" sx={{ mr: 1 }} disabled>
                  Sin reparación vinculada
                </Button>
              )}
              <Tooltip title={isReadOnly(h) ? 'Solo lectura (otro taller)' : ''}>
                <span>
                  <Button variant="outlined" size="small" color="error" onClick={() => handleDelete(h.id)} disabled={isReadOnly(h)}>Eliminar</Button>
                </span>
              </Tooltip>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

export default HistorialVehiculos;
