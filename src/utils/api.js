// src/utils/api.js
const API_URL = process.env.REACT_APP_API_URL || '';

export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  let data = null;
  try {
    data = await res.json();
  } catch {
    // sin cuerpo JSON
  }

  if (res.status === 401) {
    // Logout automático en 401
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } catch {}
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
      window.location.assign('/login');
    }
    const msg = data?.error || data?.message || 'No autorizado';
    throw new Error(msg);
  }

  if (!res.ok) {
    const msg = data?.error || data?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return data;
}
