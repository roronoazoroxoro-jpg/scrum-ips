import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

import autenticacion from './routes/autenticacion.js';
import usuarios from './routes/usuarios.js';
import sectores from './routes/sectores.js';
import sedes from './routes/sedes.js';
import tareas from './routes/tareas.js';
import historial from './routes/historial.js';
import pcs from './routes/pcs.js';
import alertas from './routes/alertas.js';
import estadisticas from './routes/estadisticas.js';
import proyectos from './routes/proyectos.js';
import publico from './routes/publico.js';
import auditoria from './routes/auditoria.js';
import permisos from './routes/permisos.js';
import { middlewareAuditoria } from './middleware/auditoria.js';

const app = express();
const PORT = process.env.PORT || 8000;

app.set('trust proxy', 1);

const corsOrigenes = (process.env.CORS_ORIGENES || 'http://localhost:5173').split(',');

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || corsOrigenes.includes(origin)) return cb(null, true);
    cb(null, false);
  },
  credentials: true,
}));
app.use(express.json());
app.use(middlewareAuditoria);

// Middleware global de manejo de errores async
app.use((req, res, next) => {
  const originalNext = next;
  req.asyncNext = (fn) => {
    Promise.resolve(fn()).catch(originalNext);
  };
  next();
});

app.use('/api/auth', autenticacion);
app.use('/api/usuarios', usuarios);
app.use('/api/sectores', sectores);
app.use('/api/sedes', sedes);
app.use('/api/tareas', tareas);
app.use('/api/historial', historial);
app.use('/api/pcs', pcs);
app.use('/api/alertas', alertas);
app.use('/api/estadisticas', estadisticas);
app.use('/api/proyectos', proyectos);
app.use('/api/publico', publico);
app.use('/api/auditoria', auditoria);
app.use('/api/permisos', permisos);

// Servir frontend
const distPath = join(__dirname, '../public');
app.use(express.static(distPath));
app.get('*', (req, res) => {
  res.sendFile(join(distPath, 'index.html'));
});

// Manejador de errores global
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const detail = err.detail || err.message || 'Error interno del servidor';
  console.error(err);
  return res.status(status).json({ detail });
});

import { prisma } from './db.js';

// Garantizar sector "Todos los sectores" de forma interna
async function asegurarSectorTodos() {
  try {
    let todosSectores = await prisma.sector.findFirst({
      where: { nombre: 'Todos los sectores' }
    });
    if (!todosSectores) {
      todosSectores = await prisma.sector.create({
        data: {
          nombre: 'Todos los sectores',
          descripcion: 'Acceso a todos los sectores (Lógica interna del sistema)',
          activo: true
        }
      });
      console.log('Sector "Todos los sectores" creado correctamente en base de datos.');
    }

    if (todosSectores) {
      const sectorId = todosSectores.id;
      // Buscar administradores que no tengan asignado este sector principal o que no tengan ver_todos
      const admins = await prisma.usuario.findMany({
        where: {
          rol: 'admin',
          activo: true,
          OR: [
            { sector_id: { not: sectorId } },
            { sector_id: null },
            { ver_todos: false }
          ]
        }
      });

      for (const admin of admins) {
        await prisma.usuario.update({
          where: { id: admin.id },
          data: {
            ver_todos: true,
            seleccion_completada: true,
            sector_id: sectorId,
            sectores: {
              connectOrCreate: {
                where: { usuario_id_sector_id: { usuario_id: admin.id, sector_id: sectorId } },
                create: { sector_id: sectorId }
              }
            }
          }
        });
        console.log(`Usuario administrador ${admin.email} actualizado con sector "Todos los sectores" y ver_todos.`);
      }
    }
  } catch (error) {
    console.error('Error al asegurar sector "Todos los sectores":', error);
  }
}

async function asegurarTablaPermisoRoles() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS permiso_roles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        rol VARCHAR(20) NOT NULL,
        clave VARCHAR(50) NOT NULL,
        activo TINYINT(1) NOT NULL DEFAULT 1,
        UNIQUE KEY permiso_roles_rol_clave_key (rol, clave)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  } catch (error) {
    console.error('Error al asegurar tabla permiso_roles:', error.message);
  }
}

app.listen(PORT, async () => {
  await asegurarTablaPermisoRoles();
  await asegurarSectorTodos();
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});

