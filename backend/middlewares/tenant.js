function withTenant(req, res, next) {
  if (!req.user || !req.user.taller_id) {
    return res.status(401).json({ error: 'No tenant in token' });
  }
  req.tenantId = req.user.taller_id;
  next();
}

function enforceTenantOnInsert(body, tenantId) {
  const b = { ...body, taller_id: tenantId };
  // Nunca aceptar claves alternativas desde el cliente
  delete b.tallerId; delete b.tenantId; delete b.taller;
  return b;
}

async function assertWritable(pool, table, id, tenantId) {
  const [rows] = await pool.query(`SELECT id FROM ${table} WHERE id = ? AND taller_id = ?`, [id, tenantId]);
  if (!rows.length) {
    const e = new Error('Forbidden');
    e.status = 403;
    throw e;
  }
}

export { withTenant, enforceTenantOnInsert, assertWritable };
