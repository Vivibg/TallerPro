import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import { apiFetch } from '../utils/api';

const Inventario = () => {
  const resumen = [
    { label: 'Total de Productos', value: 156, color: '#2258e6' },
    { label: 'Valor del Inventario', value: '$89,450', color: '#3bb54a' },
    { label: 'Productos Críticos', value: 8, color: '#ff4d4f' },
  ];

  const [insumos, setInsumos] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ producto: '', categoria: '', stock: '', minimo: '', precio: '', estado: 'ok' });

  const fetchInsumos = () => {
    apiFetch('/api/inventario')
      .then(data => Array.isArray(data) ? setInsumos(data) : setInsumos([]))
      .catch(() => setInsumos([]));
  };

  useEffect(() => {
    fetchInsumos();
  }, []);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    await apiFetch('/api/inventario', {
      method: 'POST',
      body: JSON.stringify(form)
    });
    setForm({ producto: '', categoria: '', stock: '', minimo: '', precio: '', estado: 'ok' });
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
        <Dialog open={open} onClose={handleClose}>
          <DialogTitle>Nuevo Producto</DialogTitle>
          <form onSubmit={handleSubmit}>
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField label="Producto" name="producto" value={form.producto} onChange={handleChange} required />
              <TextField label="Categoría" name="categoria" value={form.categoria} onChange={handleChange} />
              <TextField label="Stock" name="stock" value={form.stock} onChange={handleChange} type="number" />
              <TextField label="Mínimo" name="minimo" value={form.minimo} onChange={handleChange} type="number" />
              <TextField label="Precio" name="precio" value={form.precio} onChange={handleChange} type="number" />
              <TextField label="Estado" name="estado" value={form.estado} onChange={handleChange} select SelectProps={{ native: true }}>
                <option value="ok">OK</option>
                <option value="bajo">Bajo</option>
              </TextField>
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
                <TableCell>Stock</TableCell>
                <TableCell>Mínimo</TableCell>
                <TableCell>Precio</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(Array.isArray(insumos) ? insumos : []).map((insumo, i) => (
                <TableRow key={i}>
                  <TableCell>{insumo.producto}</TableCell>
                  <TableCell>{insumo.categoria}</TableCell>
                  <TableCell>{insumo.stock}</TableCell>
                  <TableCell>{insumo.minimo}</TableCell>
                  <TableCell>${insumo.precio}</TableCell>
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
