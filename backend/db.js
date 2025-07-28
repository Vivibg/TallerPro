import mysql from 'mysql2/promise';

export const pool = mysql.createPool({
  host: 'localhost',
  user: 'root', // Cambia si tu usuario es diferente
  password: 'R34ch11983!!', // Cambia por tu contraseña de MySQL
  database: 'tallerpro',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});
