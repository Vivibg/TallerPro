import React, { useState } from 'react';

import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Grid, Typography, Table, TableHead, TableRow, TableCell, TableBody, IconButton, Select, MenuItem
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { apiFetch } from '../utils/api';

const CLP = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });

function FichaReparacionModal({ open, onClose, reparacion, onSaved }) {
  // Normalizar repuestos que vengan como string JSON desde backend
  const repuestosInit = (() => {
    const r = reparacion?.repuestos;
    if (Array.isArray(r)) return r;
    if (typeof r === 'string') {
      try { const parsed = JSON.parse(r); return Array.isArray(parsed) ? parsed : []; } catch { return []; }
    }
    return [];
  })();

  // Estado local para cada campo de la ficha
  const [ficha, setFicha] = useState({
    nombre: reparacion.cliente || '',
    telefono: reparacion.telefono || '',
    email: reparacion.email || '',
    marca: reparacion.marca || '',
    modelo: reparacion.modelo || '',
    anio: reparacion.anio || '',
    patente: reparacion.patente || '',
    kilometraje: reparacion.kilometraje || '',
    fallaReportada: reparacion.fallaReportada || '',
    diagnostico: reparacion.diagnostico || '',
    trabajos: reparacion.trabajos || '',
    repuestos: repuestosInit,
    observaciones: reparacion.observaciones || '',
    garantiaPeriodo: reparacion.garantiaPeriodo || '',
    garantiaCondiciones: reparacion.garantiaCondiciones || '',
    costoManoObra: reparacion.costoManoObra || reparacion.costo_mano_obra || '',
    taller: reparacion.taller || '',
    mecanicoAsignado: reparacion.mecanicoAsignado || reparacion.mecanico_asignado || reparacion.mecanico || ''
  });
  const [estado, setEstado] = useState(reparacion.estado || 'pending');
  const [tipoServicio, setTipoServicio] = useState(reparacion.servicio || reparacion.tipo_servicio || '');

  // Manejo de cambios en los campos
  const handleChange = e => setFicha({ ...ficha, [e.target.name]: e.target.value });

  // Manejo de repuestos
  const handleAddRepuesto = () => {
    setFicha({ ...ficha, repuestos: [...(ficha.repuestos || []), { cantidad: '', descripcion: '', marca: '', precio: '', total: '' }] });
  };
  const handleRemoveRepuesto = idx => {
    const nuevos = ficha.repuestos.filter((_, i) => i !== idx);
    setFicha({ ...ficha, repuestos: nuevos });
  };
  const handleRepuestoChange = (idx, field, value) => {
    const nuevos = ficha.repuestos.map((r, i) => i === idx ? { ...r, [field]: value } : r);
    setFicha({ ...ficha, repuestos: nuevos });
  };

  // Cálculos de costos
  const costoInsumosCalc = (Array.isArray(ficha.repuestos) ? ficha.repuestos : []).reduce((acc, r) => {
    const cantidad = Number(r?.cantidad || 0);
    const precio = Number(r?.precio || 0);
    const total = cantidad * precio;
    return acc + (isNaN(total) ? 0 : total);
  }, 0);
  const costoManoObraNum = Number(ficha.costoManoObra || 0);
  const costoTotalCalc = costoInsumosCalc + (isNaN(costoManoObraNum) ? 0 : costoManoObraNum);

  const handleGuardar = async () => {
    try {
      if (!reparacion?.id) return onClose?.();
      // Componer payload alineado a columnas de 'reparaciones'
      const composedVehiculo = [ficha.marca, ficha.modelo, ficha.anio].filter(Boolean).join(' ').trim();
      // Preparar payload extendido (para backend actualizado - Opción A)
      const payload = {
        // claves actuales
        problema: ficha.trabajos || ficha.diagnostico || ficha.fallaReportada || reparacion.problema || '',
        estado,
        costo: Number(costoTotalCalc) || 0,
        // desglose de costos (si existen columnas en backend se guardan)
        costo_mano_obra: isNaN(costoManoObraNum) ? 0 : Number(costoManoObraNum),
        costo_insumos: isNaN(costoInsumosCalc) ? 0 : Number(costoInsumosCalc),
        // guardar detalle de repuestos (para costos unitarios)
        repuestos: Array.isArray(ficha.repuestos) ? ficha.repuestos.map(r => ({
          cantidad: Number(r?.cantidad || 0),
          descripcion: r?.descripcion || '',
          marca: r?.marca || '',
          precio: Number(r?.precio || 0),
          total: Number(r?.cantidad || 0) * Number(r?.precio || 0)
        })) : [],
        // extendidas (existentes en tabla reparaciones)
        cliente: ficha.nombre || reparacion.cliente || '',
        telefono: ficha.telefono || reparacion.telefono || '',
        email: ficha.email || reparacion.email || '',
        vehiculo: (ficha.vehiculo || [ficha.marca, ficha.modelo, ficha.anio].filter(Boolean).join(' ').trim() || reparacion.vehiculo || ''),
        marca: ficha.marca || reparacion.marca || '',
        modelo: ficha.modelo || reparacion.modelo || '',
        anio: ficha.anio || reparacion.anio || '',
        patente: ficha.patente || reparacion.patente || '',
        kilometraje: ficha.kilometraje || reparacion.kilometraje || '',
        observaciones: ficha.observaciones || reparacion.observaciones || '',
        garantiaPeriodo: ficha.garantiaPeriodo || reparacion.garantiaPeriodo || '',
        garantiaCondiciones: ficha.garantiaCondiciones || reparacion.garantiaCondiciones || '',
        // campos operativos adicionales que planeas soportar
        taller: ficha.taller || reparacion.taller || '',
        mecanico: ficha.mecanicoAsignado || reparacion.mecanico || '',
      };
      if (tipoServicio) payload.servicio = tipoServicio;
      if (reparacion?.fecha || ficha?.fecha) payload.fecha = reparacion.fecha || ficha.fecha;
      // Si existiera 'estado' en la ficha en el futuro, también podríamos enviarlo
      await apiFetch(`/api/reparaciones/${reparacion.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      onSaved?.(payload);
      onClose?.();
    } catch (e) {
      alert(e?.message || 'Error al guardar la ficha');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Ficha de Servicio de Reparación Mecánica</DialogTitle>
      <DialogContent dividers>
        <Typography variant="subtitle1" gutterBottom>1. Datos del cliente</Typography>
        <Grid container spacing={2}>
          <Grid item xs={4}><TextField label="Nombre" name="nombre" value={ficha.nombre} onChange={handleChange} fullWidth /></Grid>
          <Grid item xs={4}><TextField label="Teléfono" name="telefono" value={ficha.telefono} onChange={handleChange} fullWidth /></Grid>
          <Grid item xs={4}><TextField label="Correo electrónico" name="email" value={ficha.email} onChange={handleChange} fullWidth /></Grid>
        </Grid>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={6}><TextField label="Taller" name="taller" value={ficha.taller} onChange={handleChange} fullWidth /></Grid>
          <Grid item xs={6}><TextField label="Mecánico asignado" name="mecanicoAsignado" value={ficha.mecanicoAsignado} onChange={handleChange} fullWidth /></Grid>
        </Grid>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={4}>
            <Typography variant="subtitle2" sx={{ mb: 0.5 }}>Estado</Typography>
            <Select fullWidth size="small" value={estado} onChange={e => setEstado(e.target.value)}>
              <MenuItem value="pending">Pendiente</MenuItem>
              <MenuItem value="progress">En progreso</MenuItem>
              <MenuItem value="done">Completado</MenuItem>
              <MenuItem value="cancelled">Cancelado</MenuItem>
            </Select>
          </Grid>
          <Grid item xs={8}>
            <Typography variant="subtitle2" sx={{ mb: 0.5 }}>Tipo de servicio</Typography>
            <Select fullWidth size="small" displayEmpty value={tipoServicio} onChange={e => setTipoServicio(e.target.value)}>
              <MenuItem value=""><em>Seleccionar</em></MenuItem>
              <MenuItem value="Servicios básicos">Servicios básicos</MenuItem>
              <MenuItem value="Mantenimiento preventivo">Mantenimiento preventivo</MenuItem>
              <MenuItem value="Reparaciones">Reparaciones</MenuItem>
              <MenuItem value="Servicios especializados">Servicios especializados</MenuItem>
            </Select>
          </Grid>
        </Grid>
        <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>2. Datos del vehículo</Typography>
        <Grid container spacing={2}>
          <Grid item xs={3}><TextField label="Marca" name="marca" value={ficha.marca} onChange={handleChange} fullWidth /></Grid>
          <Grid item xs={3}><TextField label="Modelo" name="modelo" value={ficha.modelo} onChange={handleChange} fullWidth /></Grid>
          <Grid item xs={2}><TextField label="Año" name="anio" value={ficha.anio} onChange={handleChange} fullWidth /></Grid>
          <Grid item xs={2}><TextField label="Patente/Placa" name="patente" value={ficha.patente} onChange={handleChange} fullWidth /></Grid>
          <Grid item xs={2}><TextField label="Kilometraje" name="kilometraje" value={ficha.kilometraje} onChange={handleChange} fullWidth /></Grid>
        </Grid>
        <TextField
          label="3. Descripción de la falla reportada por el cliente"
          name="fallaReportada"
          value={ficha.fallaReportada}
          onChange={handleChange}
          fullWidth
          multiline
          sx={{ mt: 2 }}
        />
        <TextField
          label="4. Diagnóstico inicial (mecánico)"
          name="diagnostico"
          value={ficha.diagnostico}
          onChange={handleChange}
          fullWidth
          multiline
          sx={{ mt: 2 }}
        />
        <TextField
          label="5. Trabajos realizados"
          name="trabajos"
          value={ficha.trabajos}
          onChange={handleChange}
          fullWidth
          multiline
          sx={{ mt: 2 }}
        />
        <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>6. Repuestos y materiales utilizados</Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Cantidad</TableCell>
              <TableCell>Descripción</TableCell>
              <TableCell>Marca</TableCell>
              <TableCell>Precio unitario</TableCell>
              <TableCell>Total</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(ficha.repuestos || []).map((rep, idx) => (
              <TableRow key={idx}>
                <TableCell><TextField value={rep.cantidad} onChange={e => handleRepuestoChange(idx, 'cantidad', e.target.value)} size="small" /></TableCell>
                <TableCell><TextField value={rep.descripcion} onChange={e => handleRepuestoChange(idx, 'descripcion', e.target.value)} size="small" /></TableCell>
                <TableCell><TextField value={rep.marca} onChange={e => handleRepuestoChange(idx, 'marca', e.target.value)} size="small" /></TableCell>
                <TableCell><TextField value={rep.precio} onChange={e => handleRepuestoChange(idx, 'precio', e.target.value)} size="small" /></TableCell>
                <TableCell>
                  <TextField
                    value={CLP.format((Number(rep.cantidad || 0) * Number(rep.precio || 0)) || 0)}
                    size="small"
                    InputProps={{ readOnly: true }}
                  />
                </TableCell>
                <TableCell>
                  <IconButton onClick={() => handleRemoveRepuesto(idx)} size="small"><DeleteIcon fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell colSpan={7} align="right">
                <Button startIcon={<AddIcon />} onClick={handleAddRepuesto} size="small">Agregar repuesto</Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={4}>
            <TextField label="Costo mano de obra" name="costoManoObra" type="number" value={ficha.costoManoObra} onChange={e => setFicha({ ...ficha, costoManoObra: e.target.value })} fullWidth />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField label="Costo insumos (auto)" value={CLP.format(costoInsumosCalc || 0)} InputProps={{ readOnly: true }} fullWidth />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField label="Costo total (auto)" value={CLP.format(costoTotalCalc || 0)} InputProps={{ readOnly: true }} fullWidth />
          </Grid>
        </Grid>
        <TextField
          label="7. Observaciones adicionales"
          name="observaciones"
          value={ficha.observaciones}
          onChange={handleChange}
          fullWidth
          multiline
          sx={{ mt: 2 }}
        />
        <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>8. Garantía del servicio</Typography>
        <Grid container spacing={2}>
          <Grid item xs={3}><TextField label="Periodo" name="garantiaPeriodo" value={ficha.garantiaPeriodo} onChange={handleChange} fullWidth /></Grid>
          <Grid item xs={9}><TextField label="Condiciones" name="garantiaCondiciones" value={ficha.garantiaCondiciones} onChange={handleChange} fullWidth /></Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={handleGuardar}>Guardar</Button>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
}

export default FichaReparacionModal;
