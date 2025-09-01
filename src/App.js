import React, { useEffect, useState } from 'react';
import { CssBaseline, Box } from '@mui/material';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Dashboard from './pages/Dashboard';
import Reparaciones from './pages/Reparaciones';
import Inventario from './pages/Inventario';
import Reservas from './pages/Reservas';
import Clientes from './pages/Clientes';
import HistorialVehiculos from './pages/HistorialVehiculos';
import VistaCliente from './pages/VistaCliente';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import { apiFetch } from './utils/api';

function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  // Restore session from localStorage and verify token
  useEffect(() => {
    const storedUser = (() => {
      try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
    })();
    const token = localStorage.getItem('token');
    if (!token) {
      setChecking(false);
      return;
    }
    (async () => {
      try {
        // If valid, apiFetch returns user/me info; 401 is handled globally (redirects)
        const me = await apiFetch('/api/auth/me');
        setUser(me?.user || storedUser || null);
      } catch {
        // On error, ensure state cleared
        setUser(null);
      } finally {
        setChecking(false);
      }
    })();
  }, []);

  const handleLogout = () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } catch {}
    setUser(null);
  };

  if (checking) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        Cargando...
      </Box>
    );
  }

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  return (
    <Router>
      <Box sx={{ display: 'flex', minHeight: '100vh', background: '#f5f6fa' }}>
        <CssBaseline />
        <Sidebar />
        <Box sx={{ flexGrow: 1 }}>
          <Topbar user={user} onLogout={handleLogout} />
          <Box sx={{ p: { xs: 1, sm: 3 } }}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/reparaciones" element={<Reparaciones />} />
              <Route path="/inventario" element={<Inventario />} />
              <Route path="/reservas" element={<Reservas />} />
              <Route path="/clientes" element={<Clientes />} />
              <Route path="/historial" element={<HistorialVehiculos />} />
              <Route path="/vista-cliente" element={<VistaCliente />} />
            </Routes>
          </Box>
        </Box>
      </Box>
    </Router>
  );
}

export default App;
