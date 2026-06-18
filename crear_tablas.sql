-- Crear tablas en orden de dependencia

CREATE TABLE sectores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  descripcion TEXT,
  activo BOOLEAN NOT NULL DEFAULT 1,
  fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE sedes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  ciudad VARCHAR(100) NOT NULL,
  direccion VARCHAR(255),
  notas TEXT,
  activo BOOLEAN NOT NULL DEFAULT 1,
  fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  rol ENUM('admin','usuario') NOT NULL DEFAULT 'usuario',
  sector_id INT NULL,
  activo BOOLEAN NOT NULL DEFAULT 1,
  fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_usuarios_sector FOREIGN KEY (sector_id) REFERENCES sectores(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE tareas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  nota_llamada TEXT,
  criticidad ENUM('alta','media','baja') NOT NULL DEFAULT 'baja',
  estado ENUM('por_hacer','en_proceso','finalizada','pendiente') NOT NULL DEFAULT 'por_hacer',
  sector_id INT NOT NULL,
  sede_id INT NOT NULL,
  numero_contacto VARCHAR(50) NULL,
  creada_por INT NOT NULL,
  asignado_a INT NULL,
  fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_inicio DATETIME NULL,
  fecha_finalizacion DATETIME NULL,
  solucion TEXT NULL,
  pendiente_descripcion TEXT NULL,
  CONSTRAINT fk_tareas_sector FOREIGN KEY (sector_id) REFERENCES sectores(id) ON DELETE RESTRICT,
  CONSTRAINT fk_tareas_sede FOREIGN KEY (sede_id) REFERENCES sedes(id) ON DELETE RESTRICT,
  CONSTRAINT fk_tareas_creada_por FOREIGN KEY (creada_por) REFERENCES usuarios(id) ON DELETE RESTRICT,
  CONSTRAINT fk_tareas_asignado_a FOREIGN KEY (asignado_a) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE historial_tareas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tarea_id INT NOT NULL,
  usuario_id INT NOT NULL,
  estado_anterior VARCHAR(50),
  estado_nuevo VARCHAR(50) NOT NULL,
  fecha_movimiento DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_historial_tarea FOREIGN KEY (tarea_id) REFERENCES tareas(id) ON DELETE CASCADE,
  CONSTRAINT fk_historial_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE pcs_registro (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre_interno VARCHAR(150) NOT NULL,
  descripcion TEXT,
  ciudad VARCHAR(100),
  sede_id INT NULL,
  propietario VARCHAR(150) NULL,
  fecha_ingreso DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_salida DATETIME NULL,
  estado ENUM('llegada','en_proceso','para_entregar','entregada') NOT NULL DEFAULT 'llegada',
  notas TEXT NULL,
  CONSTRAINT fk_pcs_sede FOREIGN KEY (sede_id) REFERENCES sedes(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE alertas_admin (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tipo ENUM('tarea_creada','tarea_movida','pc_ingresada') NOT NULL,
  mensaje VARCHAR(500) NOT NULL,
  tarea_id INT NULL,
  pc_id INT NULL,
  usuario_id INT NULL,
  leida BOOLEAN NOT NULL DEFAULT 0,
  fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_alertas_tarea FOREIGN KEY (tarea_id) REFERENCES tareas(id) ON DELETE SET NULL,
  CONSTRAINT fk_alertas_pc FOREIGN KEY (pc_id) REFERENCES pcs_registro(id) ON DELETE SET NULL,
  CONSTRAINT fk_alertas_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Permisos por rol (requerido para login y panel de administración)

CREATE TABLE permiso_roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  rol VARCHAR(20) NOT NULL,
  clave VARCHAR(50) NOT NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  UNIQUE KEY permiso_roles_rol_clave_key (rol, clave)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tablas de Auditoría Modular y Organizada

CREATE TABLE auditoria_sesiones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NULL,
  email VARCHAR(255) NULL,
  accion VARCHAR(100) NOT NULL,
  detalles TEXT NULL,
  ip VARCHAR(45) NULL,
  estado_codigo INT NOT NULL,
  fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_aud_sesion_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE auditoria_usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NULL,
  email VARCHAR(255) NULL,
  accion VARCHAR(100) NOT NULL,
  detalles TEXT NULL,
  ip VARCHAR(45) NULL,
  estado_codigo INT NOT NULL,
  fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_aud_usuario_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE auditoria_sectores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NULL,
  email VARCHAR(255) NULL,
  accion VARCHAR(100) NOT NULL,
  detalles TEXT NULL,
  ip VARCHAR(45) NULL,
  estado_codigo INT NOT NULL,
  fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_aud_sector_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE auditoria_sedes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NULL,
  email VARCHAR(255) NULL,
  accion VARCHAR(100) NOT NULL,
  detalles TEXT NULL,
  ip VARCHAR(45) NULL,
  estado_codigo INT NOT NULL,
  fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_aud_sede_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE auditoria_tareas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NULL,
  email VARCHAR(255) NULL,
  accion VARCHAR(100) NOT NULL,
  detalles TEXT NULL,
  ip VARCHAR(45) NULL,
  estado_codigo INT NOT NULL,
  fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_aud_tarea_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE auditoria_pcs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NULL,
  email VARCHAR(255) NULL,
  accion VARCHAR(100) NOT NULL,
  detalles TEXT NULL,
  ip VARCHAR(45) NULL,
  estado_codigo INT NOT NULL,
  fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_aud_pc_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE auditoria_proyectos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NULL,
  email VARCHAR(255) NULL,
  accion VARCHAR(100) NOT NULL,
  detalles TEXT NULL,
  ip VARCHAR(45) NULL,
  estado_codigo INT NOT NULL,
  fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_aud_proyecto_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

