import React, { useEffect, useRef, useState } from 'react';
import { Box, Paper, Typography, TextField, Button, Alert, Divider } from '@mui/material';

const API_URL = import.meta?.env?.VITE_API_URL || ''; // ej: https://tu-backend.onrender.com
const GOOGLE_CLIENT_ID = import.meta?.env?.VITE_GOOGLE_CLIENT_ID || process.env.REACT_APP_GOOGLE_CLIENT_ID;

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const googleDivRef = useRef(null);

  useEffect(() => {
    if (!window.google || !GOOGLE_CLIENT_ID) return;
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: async (resp) => {
        setLoading(true);
        try {
          const r = await fetch(`${API_URL}/api/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken: resp.credential })
          });
          const data = await r.json();
          if (!r.ok) throw new Error(data.error || 'Error autenticando');

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
    window.google.accounts.id.renderButton(googleDivRef.current, { theme: 'outline', size: 'large', text: 'continue_with' });
  }, []);

  // Opcional: mantener formulario clásico para futuro login/password
  const handleSubmit = (e) => {
    e.preventDefault();
    setError('Esta versión usa Google para autenticación.'); // implementar /api/auth/login si lo requieres
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f6fa' }}>
      <Paper elevation={3} sx={{ p: 4, minWidth: 320, width: 380, maxWidth: '92vw' }}>
        <Typography variant="h5" fontWeight={700} mb={2} align="center">
          Iniciar Sesión
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <div ref={googleDivRef} style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }} />

        <Divider sx={{ my: 2 }}>o</Divider>

        <form onSubmit={handleSubmit}>
          <TextField
            label="Email"
            type="email"
            fullWidth
            required
            margin="normal"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <TextField
            label="Contraseña"
            type="password"
            fullWidth
            required
            margin="normal"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2 }} disabled={loading}>
            Entrar
          </Button>
        </form>
      </Paper>
    </Box>
  );
}

export default Login;
