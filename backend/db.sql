CREATE DATABASE IF NOT EXISTS tallerpro;
USE tallerpro;

CREATE TABLE IF NOT EXISTS reservas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cliente VARCHAR(100) NOT NULL,
  servicio VARCHAR(100) NOT NULL,
  vehiculo VARCHAR(100) NOT NULL,
  fecha DATE NOT NULL,
  hora VARCHAR(10) NOT NULL
);

CREATE TABLE IF NOT EXISTS clientes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  telefono VARCHAR(30),
  email VARCHAR(100),
  vehiculo VARCHAR(100),
  ultimaVisita DATE,
  desde INT
);

CREATE TABLE IF NOT EXISTS reparaciones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cliente VARCHAR(100) NOT NULL,
  vehiculo VARCHAR(100) NOT NULL,
  problema VARCHAR(200),
  estado ENUM('pending','progress','done') DEFAULT 'pending',
  costo DECIMAL(10,2),
  fecha DATE
);

CREATE TABLE IF NOT EXISTS inventario (
  id INT AUTO_INCREMENT PRIMARY KEY,
  producto VARCHAR(100) NOT NULL,
  categoria VARCHAR(50),
  stock INT DEFAULT 0,
  minimo INT DEFAULT 0,
  precio DECIMAL(10,2),
  estado ENUM('ok','bajo') DEFAULT 'ok'
);

CREATE TABLE IF NOT EXISTS historial_vehiculos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vehiculo VARCHAR(100) NOT NULL,
  placas VARCHAR(20),
  cliente VARCHAR(100),
  fecha DATE,
  servicio VARCHAR(100),
  taller VARCHAR(100)
);
