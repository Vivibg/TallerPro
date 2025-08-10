import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  TextField,
  Chip,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import FichaReparacionModal from '../components/FichaReparacionModal';

const ESTADOS = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'pending', label: 'Pendiente' },
  { value: 'progress', label: 'En progreso' },
  { value: 'done', label: 'Completado' },
];

function Reparaciones() {
  const [DATA, setDATA] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    cliente: '',
    vehiculo: '',
    patente: '',
    marca: '',
    modelo: '',
    anio: '',
    kilometraje: '',
    problema: '',
    estado: 'pending',
    costo: '',
    fecha: ''
  });
  const [estado, setEstado] = useState('all');
  const [busqueda, setBusqueda] = useState('');

  // Estado para la ficha/modal
  const [openFicha, setOpenFicha] = useState(false);
  const [selectedReparacion, setSelectedReparacion] = useState(null);

  const fetchReparaciones = () => {
    fetch(`${process.env.REACT_APP_API_URL}/api/reparaciones`)
      .then(res => res.json())
      .then(data => Array.isArray(data) ? setDATA(data) : setDATA([]))
      .catch(() => setDATA([]));
  };

  useEffect(() => {
    fetchReparaciones();
  }, []);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    await fetch(`${process.env.REACT_APP_API_URL}/api/reparaciones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    setForm({
      cliente: '',
      vehiculo: '',
      patente: '',
      marca: '',
      modelo: '',
      anio: '',
      kilometraje: '',
      problema: '',
      estado: 'pending',
      costo: '',
      fecha: ''
    });
    setOpen(false);
    fetchReparaciones();
  };

  const handleDelete = async id => {
    await fetch(`${process.env.REACT_APP_API_URL}/api/reparaciones/${id}`, { method: 'DELETE' });
    fetchReparaciones();
  };

  // Cambia el estado de la reparación y actualiza en backend
  const handleEstadoChange = async (id, nuevoEstado) => {
    await fetch(`${process.env.REACT_APP_API_URL}/api/reparaciones/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: nuevoEstado })
    });
    fetchReparaciones();
  };

  const filtrar = (row) => {
    if (estado !== 'all' && row.estado !== estado) return false;
    if (busqueda && !(`${row.cliente} ${row.vehiculo}`.toLowerCase().includes(busqueda.toLowerCase()))) return false;
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
          <Button variant="contained" color="primary" sx={{ ml: 'auto' }} onClick={handleOpen}>
            + Nueva Reparación
          </Button>
        </Stack>
        <Dialog open={open} onClose={handleClose}>
          <DialogTitle>Nueva Reparación</DialogTitle>
          <form onSubmit={handleSubmit}>
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField label="Cliente" name="cliente" value={form.cliente} onChange={handleChange} required />
              <TextField label="Vehículo" name="vehiculo" value={form.vehiculo} onChange={handleChange} required />
              <TextField label="Patente" name="patente" value={form.patente} onChange={handleChange} required />
              <TextField label="Marca" name="marca" value={form.marca} onChange={handleChange} />
              <TextField label="Modelo" name="modelo" value={form.modelo} onChange={handleChange} />
              <TextField label="Año" name="anio" value={form.anio} onChange={handleChange} />
              <TextField label="Kilometraje" name="kilometraje" value={form.kilometraje} onChange={handleChange} />
              <TextField label="Problema" name="problema" value={form.problema} onChange={handleChange} />
              <TextField
                label="Estado"
                name="estado"
                value={form.estado}
                onChange={handleChange}
                select
                SelectProps={{ native: true }}
              >
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
              <TableCell>ID</TableCell>
              <TableCell>Cliente</TableCell>
              <TableCell>Vehículo</TableCell>
              <TableCell>Patente</TableCell>
              <TableCell>Marca</TableCell>
              <TableCell>Modelo</TableCell>
              <TableCell>Año</TableCell>
              <TableCell>Kilometraje</TableCell>
              <TableCell>Problema</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Costo</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {DATA.filter(filtrar).map((row) => (
              <TableRow key={row.id}>
                <TableCell>#{row.id}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{row.cliente}</TableCell>
                <TableCell>{row.vehiculo}</TableCell>
                <TableCell>{row.patente}</TableCell>
                <TableCell>{row.marca}</TableCell>
                <TableCell>{row.modelo}</TableCell>
                <TableCell>{row.anio}</TableCell>
                <TableCell>{row.kilometraje}</TableCell>
                <TableCell>{row.problema}</TableCell>
                <TableCell>
                  <Select
                    value={row.estado}
                    onChange={e => handleEstadoChange(row.id, e.target.value)}
                    size="small"
                    sx={{ minWidth: 120 }}
                  >
                    <MenuItem value="pending">Pendiente</MenuItem>
                    <MenuItem value="progress">En Proceso</MenuItem>
                    <MenuItem value="done">Completado</MenuItem>
                  </Select>
                  {" "}
                  {row.estado === 'pending' && <Chip label="Pendiente" color="default" size="small" />}
                  {row.estado === 'progress' && <Chip label="En progreso" color="warning" size="small" />}
                  {row.estado === 'done' && <Chip label="Completado" color="success" size="small" />}
                </TableCell>
                <TableCell>
                  ${Number(row.costo).toLocaleString()}
                </TableCell>
                <TableCell>
                  <Button
                    variant="contained"
                    size="small"
                    sx={{ mr: 1 }}
                    onClick={() => { setSelectedReparacion(row); setOpenFicha(true); }}
                  >
                    Ver
                  </Button>
                  <Button variant="outlined" size="small" color="error" onClick={() => handleDelete(row.id)}>Eliminar</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {/* Modal de ficha de reparación */}
      {selectedReparacion && (
        <FichaReparacionModal
          open={openFicha}
          onClose={() => setOpenFicha(false)}
          reparacion={selectedReparacion}
        />
      )}
    </Box>
  );
}

export default Reparaciones;
