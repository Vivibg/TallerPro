import React from 'react';
import { AppBar, Toolbar, Typography, Box, Button } from '@mui/material';

function Topbar({ user, onLogout }) {
  return (
    <AppBar position="static" sx={{ background: '#2258e6', boxShadow: 0 }}>
      <Toolbar sx={{ minHeight: 64, display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: 1 }}>
          TallerPro
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography sx={{ fontWeight: 500, fontSize: 16 }}>
            👋 Hola, {user?.name || 'Usuario'}
            {user?.taller_nombre || user?.taller_id ? (
              <>
                {' '}• Taller: {user?.taller_nombre || `#${user?.taller_id}`}
              </>
            ) : null}
          </Typography>
          <Button
            color="inherit"
            variant="outlined"
            sx={{ color: '#fff', borderColor: '#fff' }}
            onClick={onLogout}
          >
            Cerrar Sesión
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Topbar;
