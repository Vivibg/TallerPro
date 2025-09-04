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
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import { apiFetch } from './utils/api';

function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

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
       
        const controller = new AbortController();
        const t = setTimeout(() => controller.abort(), 3000);
       
        const me = await apiFetch('/api/auth/me', { noRedirectOn401: true, signal: controller.signal });
        clearTimeout(t);
        setUser(me?.user || storedUser || null);
      } catch {
        
        try {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        } catch {}
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

  return (
    <Router>
      {checking ? (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
          Cargando...
        </Box>
      ) : (
        <Routes>
          {!user ? (
            <>
              <Route path="/login" element={<Login onLogin={setUser} />} />
              {/* Vista pública accesible sin login */}
              <Route path="/vista-cliente" element={<VistaCliente />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </>
          ) : (
            <>
              <Route
                path="/*"
                element={
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
                          <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                      </Box>
                    </Box>
                  </Box>
                }
              />
            </>
          )}
        </Routes>
      )}
    </Router>
  );
}

export default App;
 
