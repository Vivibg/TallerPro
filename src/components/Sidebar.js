import React from 'react';
import { Drawer, List, ListItem, ListItemIcon, ListItemText, Toolbar, Box } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import BuildIcon from '@mui/icons-material/Build';
import InventoryIcon from '@mui/icons-material/Inventory';
import EventNoteIcon from '@mui/icons-material/EventNote';
import PeopleIcon from '@mui/icons-material/People';
import HistoryIcon from '@mui/icons-material/History';
import VisibilityIcon from '@mui/icons-material/Visibility';

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: 'Reparaciones', icon: <BuildIcon />, path: '/reparaciones' },
  { text: 'Inventario', icon: <InventoryIcon />, path: '/inventario' },
  { text: 'Reservas', icon: <EventNoteIcon />, path: '/reservas' },
  { text: 'Clientes', icon: <PeopleIcon />, path: '/clientes' },
  { text: 'Historial Vehículos', icon: <HistoryIcon />, path: '/historial' },
  { text: 'Vista Cliente', icon: <VisibilityIcon />, path: '/vista-cliente' },
];

const drawerWidth = 220;

import { useLocation, useNavigate } from 'react-router-dom';

function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: drawerWidth,
          boxSizing: 'border-box',
          background: '#2258e6',
          color: '#fff',
        },
      }}
    >
      <Toolbar />
      <Box sx={{ overflow: 'auto', mt: 2 }}>
        <List>
          {menuItems.map((item) => (
            <ListItem
              button
              key={item.text}
              onClick={() => navigate(item.path)}
              selected={location.pathname === item.path}
              sx={{
                color: '#fff',
                mb: 1,
                borderRadius: 2,
                background: location.pathname === item.path ? '#1747b0' : 'transparent',
                '&:hover': { background: '#1747b0' },
              }}
            >
              <ListItemIcon sx={{ color: '#fff' }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          ))}
        </List>
      </Box>
    </Drawer>
  );
}

export default Sidebar;
