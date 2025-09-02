  import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Divider,
  Tabs,
  Tab,
  Stack
} from '@mui/material';
import { apiFetch } from '../utils/api';
import { useNavigate } from 'react-router-dom';

// CRA env variables
const API_URL = process.env.REACT_APP_API_URL || '';
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';

console.log('API_URL =', API_URL);

function Login({ onLogin }) {
  const [tab, setTab] = useState(0); // 0=Entrar, 1=Crear cuenta
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const googleDivRef = useRef(null);
  const navigate = useNavigate();

  // Helper: parse JSON safe
  const parseJsonSafe = async (res) => {
    const txt = await res.text();
    try { return JSON.parse(txt); } catch { return {}; }
  };

  useEffect(() => {
    // Google Identity Services button
    if (!window.google || !GOOGLE_CLIENT_ID || !googleDivRef.current) return;
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: async (resp) => {
        setLoading(true);
        setError('');
        try {
          const data = await apiFetch('/api/auth/google', {
            method: 'POST',
            body: JSON.stringify({ idToken: resp.credential })
          });

          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user)); // {id,name,email,role,picture}
          onLogin?.(data.user);
        } catch (e) {
          setError(e.message);
        } finally {
          setLoading(false);
        }
      },
      ux_mode: 'popup',
      auto_select: false
    });

    window.google.accounts.id.renderButton(googleDivRef.current, {
      theme: 'outline',
      size: 'large',
      text: 'continue_with'
    });
  }, [GOOGLE_CLIENT_ID, API_URL]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (!API_URL) throw new Error('API_URL no configurado');
      const data = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user)); // {id,name,email,role}
      onLogin?.(data.user);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (!API_URL) throw new Error('API_URL no configurado');
      if (!email || !password) throw new Error('Email y contraseña son requeridos');
      if (password.length < 8) throw new Error('La contraseña debe tener al menos 8 caracteres');

      const data = await apiFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, name })
      });

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user)); // {id,name,email,role}
      onLogin?.(data.user);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f6fa' }}>
      <Paper elevation={3} sx={{ p: 4, minWidth: 320, width: 400, maxWidth: '92vw' }}>
        <Typography variant="h5" fontWeight={700} mb={2} align="center">
          Iniciar Sesión
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {/* Google button */}
        <div ref={googleDivRef} style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }} />

        <Divider sx={{ my: 2 }}>o</Divider>

        {/* Acceso público a Vista Cliente */}
        <Button variant="outlined" color="primary" fullWidth sx={{ mb: 2 }} onClick={() => navigate('/vista-cliente')}>
          Ver como cliente (sin iniciar sesión)
        </Button>

        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth" sx={{ mb: 2 }}>
          <Tab label="Entrar" />
          <Tab label="Crear cuenta" />
        </Tabs>

        {tab === 0 && (
          <form onSubmit={handleLogin}>
            <Stack spacing={2}>
              <TextField
                label="Email"
                type="email"
                fullWidth
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
              <TextField
                label="Contraseña"
                type="password"
                fullWidth
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <Button type="submit" variant="contained" fullWidth disabled={loading}>
                Entrar
              </Button>
            </Stack>
          </form>
        )}

        {tab === 1 && (
          <form onSubmit={handleRegister}>
            <Stack spacing={2}>
              <TextField
                label="Nombre"
                type="text"
                fullWidth
                value={name}
                onChange={e => setName(e.target.value)}
              />
              <TextField
                label="Email"
                type="email"
                fullWidth
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
              <TextField
                label="Contraseña (mín. 8)"
                type="password"
                fullWidth
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <Button type="submit" variant="contained" fullWidth disabled={loading}>
                Crear cuenta
              </Button>
            </Stack>
          </form>
        )}
      </Paper>
    </Box>
  );
}

export default Login;
