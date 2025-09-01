import jwt from 'jsonwebtoken';

// Ensures a valid JWT is present; attaches payload to req.user
export function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'No token' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // payload: { id, email, role, name }
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

// Requires one of the roles provided
export function roleRequired(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'No autorizado' });
    }
    next();
  };
}
