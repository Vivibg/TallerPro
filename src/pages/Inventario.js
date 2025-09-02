import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import { apiFetch } from '../utils/api';

const Inventario = () => {
  // KPIs calculados dinámicamente desde los datos

  const [insumos, setInsumos] = useState([]);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  // filtros
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('all');
  const [filtroEstado, setFiltroEstado] = useState('all');
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

  // Edit form state and handlers
  const [editForm, setEditForm] = useState({
    producto: '', categoria: '', unidad: '', stock: '', minimo: '', maximo: '', precio: '', costo_unitario: '', total: '', estado: 'ok'
  });
  const handleEditChange = e => {
    const next = { ...editForm, [e.target.name]: e.target.value };
    const stockNum = Number(next.stock || 0);
    const costoNum = Number(next.costo_unitario || 0);
    next.total = String(stockNum * costoNum);
    const minimoNum = Number(next.minimo || 0);
    next.estado = stockNum < minimoNum ? 'bajo' : 'ok';
    setEditForm(next);
  };
  const handleEditSubmit = async e => {
    e.preventDefault();
    if (!selectedId) return;
    const payload = {
      ...editForm,
      stock: Number(editForm.stock || 0),
      minimo: Number(editForm.minimo || 0),
      maximo: Number(editForm.maximo || 0),
      precio: Number(editForm.precio || 0),
      costo_unitario: Number(editForm.costo_unitario || 0),
      total: Number(editForm.total || 0)
    };
    await apiFetch(`/api/inventario/${selectedId}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
    handleEditClose();
    fetchInsumos();
  };

  useEffect(() => {
    fetchInsumos();
  }, []);

  // Catálogo de categorías
  const categorias = Array.from(new Set((Array.isArray(insumos) ? insumos : []).map(i => i?.categoria).filter(Boolean)));

  // Aplicar filtros
  const listaFiltrada = (Array.isArray(insumos) ? insumos : []).filter(i => {
    const texto = (filtroTexto || '').toLowerCase();
    if (texto) {
      const hay = `${i?.producto || ''} ${i?.categoria || ''}`.toLowerCase().includes(texto);
      if (!hay) return false;
    }
    if (filtroCategoria !== 'all' && i?.categoria !== filtroCategoria) return false;
    // estado calculado segun stock vs minimo
    const estadoCalc = Number(i?.stock || 0) < Number(i?.minimo || 0) ? 'bajo' : 'ok';
    if (filtroEstado !== 'all' && estadoCalc !== filtroEstado) return false;
    return true;
  });

  // Cálculo de KPIs (sobre la lista filtrada)
  const totalProductos = listaFiltrada.length;
  const valorInventario = listaFiltrada.reduce((acc, i) => {
    const stock = Number(i?.stock || 0);
    const costo = Number(i?.costo_unitario || 0);
    const total = Number(i?.total ?? (stock * costo));
    return acc + (isNaN(total) ? 0 : total);
  }, 0);
  const productosCriticos = listaFiltrada.filter(i => Number(i?.stock || 0) < Number(i?.minimo || 0)).length;
  const productosOk = listaFiltrada.filter(i => Number(i?.stock || 0) >= Number(i?.minimo || 0)).length;

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const handleEditOpen = (item) => {
    setSelectedId(item.id);
    setEditForm({
      producto: item.producto || '',
      categoria: item.categoria || '',
      unidad: item.unidad || '',
      stock: String(item.stock ?? ''),
      minimo: String(item.minimo ?? ''),
      maximo: String(item.maximo ?? ''),
      precio: String(item.precio ?? ''),
      costo_unitario: String(item.costo_unitario ?? ''),
      total: String(item.total ?? ''),
      estado: item.estado || 'ok'
    });
    setEditOpen(true);
  };
  const handleEditClose = () => { setEditOpen(false); setSelectedId(null); };
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
        <Grid item xs={12} sm={4}>
          <Paper elevation={2} sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'space-between' }}>
            <Typography variant="subtitle2" color="text.secondary">Estado de productos</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Chip color="success" label={`OK: ${productosOk}`} size="small" />
              <Chip color="error" label={`Bajo: ${productosCriticos}`} size="small" />
            </Box>
          </Paper>
        </Grid>
      </Grid>
      <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center" mb={1}>
          <Grid item xs={12} sm={4}>
            <TextField size="small" label="Buscar" placeholder="Producto o categoría" fullWidth value={filtroTexto} onChange={e => setFiltroTexto(e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField size="small" label="Categoría" value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)} select SelectProps={{ native: true }} fullWidth>
              <option value="all">Todas</option>
              {categorias.map(c => (<option value={c} key={c}>{c}</option>))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField size="small" label="Estado" value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} select SelectProps={{ native: true }} fullWidth>
              <option value="all">Todos</option>
              <option value="ok">OK</option>
              <option value="bajo">Bajo</option>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={1}>
            <Button variant="text" onClick={() => { setFiltroTexto(''); setFiltroCategoria('all'); setFiltroEstado('all'); }}>Limpiar</Button>
          </Grid>
        </Grid>
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
        {/* Editar producto */}
        <Dialog open={editOpen} onClose={handleEditClose}>
          <DialogTitle>Editar Producto #{selectedId}</DialogTitle>
          <form onSubmit={handleEditSubmit}>
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField label="Producto" name="producto" value={editForm.producto} onChange={handleEditChange} required />
              <TextField label="Categoría" name="categoria" value={editForm.categoria} onChange={handleEditChange} />
              <TextField label="Unidad de medida" name="unidad" value={editForm.unidad} onChange={handleEditChange} select SelectProps={{ native: true }}>
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
                <Grid item xs={6}><TextField label="Stock" name="stock" value={editForm.stock} onChange={handleEditChange} type="number" /></Grid>
                <Grid item xs={6}><TextField label="Mínimo" name="minimo" value={editForm.minimo} onChange={handleEditChange} type="number" /></Grid>
                <Grid item xs={6}><TextField label="Máximo" name="maximo" value={editForm.maximo} onChange={handleEditChange} type="number" /></Grid>
                <Grid item xs={6}><TextField label="Costo unitario" name="costo_unitario" value={editForm.costo_unitario} onChange={handleEditChange} type="number" /></Grid>
                <Grid item xs={6}><TextField label="Precio (venta)" name="precio" value={editForm.precio} onChange={handleEditChange} type="number" /></Grid>
                <Grid item xs={6}><TextField label="Total (auto)" name="total" value={editForm.total} InputProps={{ readOnly: true }} /></Grid>
              </Grid>
              <TextField label="Estado" name="estado" value={editForm.estado} disabled helperText="Se calcula según stock vs mínimo" />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleEditClose}>Cancelar</Button>
              <Button type="submit" variant="contained">Guardar cambios</Button>
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
              {listaFiltrada.map((insumo, i) => (
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
                    {Number(insumo?.stock || 0) < Number(insumo?.minimo || 0)
                      ? <Chip label="Stock bajo" color="error" size="small" />
                      : <Chip label="Disponible" color="success" size="small" />}
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
