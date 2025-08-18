import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Grid, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button, Chip, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField
} from '@mui/material';

const Inventario = () => {
  const [insumos, setInsumos] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ producto: '', categoria: '', stock: '', minimo: '', precio: '' });
  const [editForm, setEditForm] = useState(null);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

  const fetchInsumos = () => {
    fetch(`${API_URL}/api/inventario`)
      .then(res => res.json())
      .then(data => Array.isArray(data) ? setInsumos(data) : setInsumos([]))
      .catch(() => setInsumos([]));
  };

  useEffect(() => {
    fetchInsumos();
    // eslint-disable-next-line
  }, []);

  // Cálculo de totales reales
  const totalProductos = insumos.length;
  const valorInventario = insumos.reduce((acc, curr) => acc + Number(curr.precio || 0), 0);
  const productosCriticos = insumos.filter(i => i.estado === 'Crítico').length;

  const resumen = [
    { label: 'Total de Productos', value: totalProductos, color: '#2258e6' },
    { label: 'Valor del Inventario', value: `$${valorInventario.toLocaleString()}`, color: '#3bb54a' },
    { label: 'Productos Críticos', value: productosCriticos, color: '#ff4d4f' },
  ];

  // Crear producto
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    await fetch(`${API_URL}/api/inventario`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    setForm({ producto: '', categoria: '', stock: '', minimo: '', precio: '' });
    setOpen(false);
    fetchInsumos();
  };

  // Editar producto
  const handleEditOpen = (insumo) => setEditForm(insumo);
  const handleEditClose = () => setEditForm(null);
  const handleEditChange = e => setEditForm({ ...editForm, [e.target.name]: e.target.value });

  const handleEditSubmit = async e => {
    e.preventDefault();
    await fetch(`${API_URL}/api/inventario/${editForm.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm)
    });
    setEditForm(null);
    fetchInsumos();
  };

  // Eliminar producto
  const handleDelete = async id => {
    await fetch(`${API_URL}/api/inventario/${id}`, { method: 'DELETE' });
    fetchInsumos();
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} mb={3}>Inventario de Insumos</Typography>
      <Grid container spacing={2} mb={3}>
        {resumen.map((item) => (
          <Grid item xs={12} sm={4} key={item.label}>
            <Paper elevation={2} sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">{item.label}</Typography>
              <Typography variant="h5" fontWeight={600} color={item.color}>{item.value}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
      <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
        <Button variant="contained" color="primary" sx={{ ml: 2 }} onClick={handleOpen}>
          + Nuevo Producto
        </Button>
        {/* Dialog para crear */}
        <Dialog open={open} onClose={handleClose}>
          <DialogTitle>Nuevo Producto</DialogTitle>
          <form onSubmit={handleSubmit}>
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField label="Producto" name="producto" value={form.producto} onChange={handleChange} required />
              <TextField label="Categoría" name="categoria" value={form.categoria} onChange={handleChange} />
              <TextField label="Stock" name="stock" value={form.stock} onChange={handleChange} type="number" />
              <TextField label="Mínimo" name="minimo" value={form.minimo} onChange={handleChange} type="number" />
              <TextField label="Precio" name="precio" value={form.precio} onChange={handleChange} type="number" />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleClose}>Cancelar</Button>
              <Button type="submit" variant="contained">Guardar</Button>
            </DialogActions>
          </form>
        </Dialog>
        {/* Dialog para editar */}
        <Dialog open={!!editForm} onClose={handleEditClose}>
          <DialogTitle>Editar Producto</DialogTitle>
          <form onSubmit={handleEditSubmit}>
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField label="Producto" name="producto" value={editForm?.producto || ''} onChange={handleEditChange} required />
              <TextField label="Categoría" name="categoria" value={editForm?.categoria || ''} onChange={handleEditChange} />
              <TextField label="Stock" name="stock" value={editForm?.stock || ''} onChange={handleEditChange} type="number" />
              <TextField label="Mínimo" name="minimo" value={editForm?.minimo || ''} onChange={handleEditChange} type="number" />
              <TextField label="Precio" name="precio" value={editForm?.precio || ''} onChange={handleEditChange} type="number" />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleEditClose}>Cancelar</Button>
              <Button type="submit" variant="contained">Guardar Cambios</Button>
            </DialogActions>
          </form>
        </Dialog>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Producto</TableCell>
                <TableCell>Categoría</TableCell>
                <TableCell>Stock</TableCell>
                <TableCell>Mínimo</TableCell>
                <TableCell>Precio</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {insumos.map((insumo, i) => (
                <TableRow key={i}>
                  <TableCell>{insumo.producto}</TableCell>
                  <TableCell>{insumo.categoria}</TableCell>
                  <TableCell>{insumo.stock}</TableCell>
                  <TableCell>{insumo.minimo}</TableCell>
                  <TableCell>${insumo.precio}</TableCell>
                  <TableCell>
                    {insumo.estado === 'Crítico' && <Chip label="Crítico" color="error" size="small" />}
                    {insumo.estado === 'Disponible' && <Chip label="Disponible" color="success" size="small" />}
                  </TableCell>
                  <TableCell>
                    <Button variant="contained" size="small" sx={{ mr: 1 }} onClick={() => handleEditOpen(insumo)}>Editar</Button>
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
