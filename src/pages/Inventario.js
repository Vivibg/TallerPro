import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import { apiFetch } from '../utils/api';

const Inventario = () => {
  // KPIs calculados dinámicamente desde los datos

  const [insumos, setInsumos] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    producto: '',
    categoria: '',
    unidad: '',
    stock: '',
    minimo: '',
    maximo: '',
    precio: '',
    costo_unitario: '',
    total: '',
    estado: 'ok'
  });

  const fetchInsumos = () => {
    apiFetch('/api/inventario')
      .then(data => Array.isArray(data) ? setInsumos(data) : setInsumos([]))
      .catch(() => setInsumos([]));
  };

  useEffect(() => {
    fetchInsumos();
  }, []);

  // Cálculo de KPIs: total de productos, valor del inventario y críticos
  const totalProductos = (Array.isArray(insumos) ? insumos : []).length;
  const valorInventario = (Array.isArray(insumos) ? insumos : []).reduce((acc, i) => {
    const stock = Number(i?.stock || 0);
    const costo = Number(i?.costo_unitario || 0);
    const total = Number(i?.total ?? (stock * costo));
    return acc + (isNaN(total) ? 0 : total);
  }, 0);
  const productosCriticos = (Array.isArray(insumos) ? insumos : []).filter(i => Number(i?.stock || 0) < Number(i?.minimo || 0)).length;

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const handleChange = e => {
    const next = { ...form, [e.target.name]: e.target.value };
    // recalcular total y estado
    const stockNum = Number(next.stock || 0);
    const costoNum = Number(next.costo_unitario || 0);
    next.total = String(stockNum * costoNum);
    const minimoNum = Number(next.minimo || 0);
    next.estado = stockNum < minimoNum ? 'bajo' : 'ok';
    setForm(next);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    // normalizar numéricos
    const payload = {
      ...form,
      stock: Number(form.stock || 0),
      minimo: Number(form.minimo || 0),
      maximo: Number(form.maximo || 0),
      precio: Number(form.precio || 0),
      costo_unitario: Number(form.costo_unitario || 0),
      total: Number(form.total || 0)
    };
    await apiFetch('/api/inventario', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    setForm({ producto: '', categoria: '', unidad: '', stock: '', minimo: '', maximo: '', precio: '', costo_unitario: '', total: '', estado: 'ok' });
    setOpen(false);
    fetchInsumos();
  };

  const handleDelete = async id => {
    await apiFetch(`/api/inventario/${id}`, { method: 'DELETE' });
    fetchInsumos();
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} mb={3}>Inventario de Insumos</Typography>
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={4}>
          <Paper elevation={2} sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">Total de Productos</Typography>
            <Typography variant="h5" fontWeight={600} color="#2258e6">{totalProductos}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper elevation={2} sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">Valor del Inventario</Typography>
            <Typography variant="h5" fontWeight={600} color="#3bb54a">${valorInventario.toLocaleString()}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper elevation={2} sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">Productos Críticos</Typography>
            <Typography variant="h5" fontWeight={600} color="#ff4d4f">{productosCriticos}</Typography>
          </Paper>
        </Grid>
      </Grid>
      <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
        <Button variant="contained" color="primary" sx={{ ml: 2 }} onClick={handleOpen}>
          + Nuevo Producto
        </Button>
        <Dialog open={open} onClose={handleClose}>
          <DialogTitle>Nuevo Producto</DialogTitle>
          <form onSubmit={handleSubmit}>
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField label="Producto" name="producto" value={form.producto} onChange={handleChange} required />
              <TextField label="Categoría" name="categoria" value={form.categoria} onChange={handleChange} />
              <TextField label="Unidad de medida" name="unidad" value={form.unidad} onChange={handleChange} select SelectProps={{ native: true }}>
                <option value=""></option>
                <option value="unidad">Unidad</option>
                <option value="litro">Litro</option>
                <option value="kilo">Kilo</option>
                <option value="caja">Caja</option>
                <option value="paquete">Paquete</option>
                <option value="par">Par</option>
                <option value="juego">Juego</option>
              </TextField>
              <Grid container spacing={2}>
                <Grid item xs={6}><TextField label="Stock" name="stock" value={form.stock} onChange={handleChange} type="number" /></Grid>
                <Grid item xs={6}><TextField label="Mínimo" name="minimo" value={form.minimo} onChange={handleChange} type="number" /></Grid>
                <Grid item xs={6}><TextField label="Máximo" name="maximo" value={form.maximo} onChange={handleChange} type="number" /></Grid>
                <Grid item xs={6}><TextField label="Costo unitario" name="costo_unitario" value={form.costo_unitario} onChange={handleChange} type="number" /></Grid>
                <Grid item xs={6}><TextField label="Precio (venta)" name="precio" value={form.precio} onChange={handleChange} type="number" /></Grid>
                <Grid item xs={6}><TextField label="Total (auto)" name="total" value={form.total} InputProps={{ readOnly: true }} /></Grid>
              </Grid>
              <TextField label="Estado" name="estado" value={form.estado} disabled helperText="Se calcula según stock vs mínimo" />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleClose}>Cancelar</Button>
              <Button type="submit" variant="contained">Guardar</Button>
            </DialogActions>
          </form>
        </Dialog>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Producto</TableCell>
                <TableCell>Categoría</TableCell>
                <TableCell>Unidad</TableCell>
                <TableCell>Stock</TableCell>
                <TableCell>Mínimo</TableCell>
                <TableCell>Máximo</TableCell>
                <TableCell>Precio</TableCell>
                <TableCell>Costo Unitario</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(Array.isArray(insumos) ? insumos : []).map((insumo, i) => (
                <TableRow key={i}>
                  <TableCell>{insumo.producto}</TableCell>
                  <TableCell>{insumo.categoria}</TableCell>
                  <TableCell>{insumo.unidad}</TableCell>
                  <TableCell>{insumo.stock}</TableCell>
                  <TableCell>{insumo.minimo}</TableCell>
                  <TableCell>{insumo.maximo}</TableCell>
                  <TableCell>${insumo.precio}</TableCell>
                  <TableCell>${insumo.costo_unitario}</TableCell>
                  <TableCell>${insumo.total}</TableCell>
                  <TableCell>
                    {insumo.estado === 'bajo' && <Chip label="Stock bajo" color="error" size="small" />}
                    {insumo.estado === 'ok' && <Chip label="Disponible" color="success" size="small" />}
                  </TableCell>
                  <TableCell>
                    <Button variant="contained" size="small" sx={{ mr: 1 }}>Editar</Button>
                    <Button variant="outlined" size="small" color="error" onClick={() => handleDelete(insumo.id)}>Eliminar</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}

export default Inventario;
