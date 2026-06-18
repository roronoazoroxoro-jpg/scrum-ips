import { Router } from 'express';
import { prisma } from '../db.js';
import { obtenerUsuarioActual, requerirSuperAdminOSuperior } from '../middleware/auth.js';

const router = Router();

// Estructura y valores por defecto para los permisos de los roles gestionables
export const MOCK_ESTRUCTURA_PERMISOS = {
  super_admin: [
    {
      titulo: 'Módulo: Tablero de Tareas',
      permisos: [
        { id: 'tablero_eliminar', nombre: 'Eliminar tareas', descripcion: 'Permite archivar y eliminar tareas del tablero.', activoDefinido: true },
        { id: 'tablero_notificaciones', nombre: 'Notificaciones', descripcion: 'Permite visualizar alertas y recibir notificaciones.', activoDefinido: true },
        { id: 'tablero_editar', nombre: 'Editar tareas', descripcion: 'Habilita la edición de títulos, descripciones y asignaciones de tareas.', activoDefinido: true },
      ],
    },
    {
      titulo: 'Módulo: Administración General',
      permisos: [
        { id: 'admin_panel', nombre: 'Acceso a Panel Admin', descripcion: 'Habilita el ingreso a las secciones administrativas de la app.', activoDefinido: true },
        { id: 'admin_usuarios', nombre: 'Administrar Usuarios', descripcion: 'Crear, editar o dar de baja cuentas y roles del personal.', activoDefinido: true },
        { id: 'admin_sectores_sedes', nombre: 'Administrar Sectores y Sedes', descripcion: 'Configurar sedes físicas y áreas departamentales.', activoDefinido: true },
        { id: 'admin_stats', nombre: 'Estadísticas', descripcion: 'Ver el panel completo y habilitar el botón de estadísticas en administración.', activoDefinido: true },
        { id: 'admin_historial', nombre: 'Historial', descripcion: 'Ver el panel de historial de cambios y movimientos de tareas.', activoDefinido: true },
      ],
    },
    {
      titulo: 'Módulo: Backlog',
      permisos: [
        { id: 'backlog_ver_todos', nombre: 'Ver todos los backlogs', descripcion: 'Permite visualizar todos los backlogs o solo los asignados.', activoDefinido: true },
        { id: 'backlog_borrar_propios', nombre: 'Borrar backlogs (propios)', descripcion: 'Permite eliminar backlogs en los que participa.', activoDefinido: true },
        { id: 'backlog_borrar_otros', nombre: 'Borrar backlogs (de otros)', descripcion: 'Permite eliminar backlogs de otros usuarios.', activoDefinido: true },
      ],
    },
  ],
  admin: [
    {
      titulo: 'Módulo: Tablero de Tareas',
      permisos: [
        { id: 'tablero_eliminar', nombre: 'Eliminar tareas', descripcion: 'Permite archivar y eliminar tareas del tablero.', activoDefinido: true },
        { id: 'tablero_notificaciones', nombre: 'Notificaciones', descripcion: 'Permite visualizar alertas y recibir notificaciones.', activoDefinido: true },
        { id: 'tablero_editar', nombre: 'Editar tareas', descripcion: 'Habilita la edición de títulos, descripciones y asignaciones de tareas.', activoDefinido: true },
      ],
    },
    {
      titulo: 'Módulo: Administración General',
      permisos: [
        { id: 'admin_panel', nombre: 'Acceso a Panel Admin', descripcion: 'Habilita el ingreso a las secciones administrativas de la app.', activoDefinido: true },
        { id: 'admin_usuarios', nombre: 'Administrar Usuarios', descripcion: 'Crear, editar o dar de baja cuentas y roles del personal.', activoDefinido: false },
        { id: 'admin_sectores_sedes', nombre: 'Administrar Sectores y Sedes', descripcion: 'Configurar sedes físicas y áreas departamentales.', activoDefinido: true },
        { id: 'admin_stats', nombre: 'Estadísticas', descripcion: 'Ver el panel completo y habilitar el botón de estadísticas en administración.', activoDefinido: true },
        { id: 'admin_historial', nombre: 'Historial', descripcion: 'Ver el panel de historial de cambios y movimientos de tareas.', activoDefinido: true },
      ],
    },
    {
      titulo: 'Módulo: Backlog',
      permisos: [
        { id: 'backlog_ver_todos', nombre: 'Ver todos los backlogs', descripcion: 'Permite visualizar todos los backlogs o solo los asignados.', activoDefinido: true },
        { id: 'backlog_borrar_propios', nombre: 'Borrar backlogs (propios)', descripcion: 'Permite eliminar backlogs en los que participa.', activoDefinido: true },
        { id: 'backlog_borrar_otros', nombre: 'Borrar backlogs (de otros)', descripcion: 'Permite eliminar backlogs de otros usuarios.', activoDefinido: false },
      ],
    },
  ],
  usuario: [
    {
      titulo: 'Módulo: Tablero de Tareas',
      permisos: [
        { id: 'tablero_eliminar', nombre: 'Eliminar tareas', descripcion: 'Permite archivar y eliminar tareas del tablero.', activoDefinido: false },
        { id: 'tablero_notificaciones', nombre: 'Notificaciones', descripcion: 'Permite visualizar alertas y recibir notificaciones.', activoDefinido: false },
        { id: 'tablero_editar', nombre: 'Editar tareas', descripcion: 'Habilita la edición de títulos, descripciones y asignaciones de tareas.', activoDefinido: false },
      ],
    },
    {
      titulo: 'Módulo: Administración General',
      permisos: [
        { id: 'admin_panel', nombre: 'Acceso a Panel Admin', descripcion: 'Habilita el ingreso a las secciones administrativas de la app.', activoDefinido: false },
        { id: 'admin_usuarios', nombre: 'Administrar Usuarios', descripcion: 'Crear, editar o dar de baja cuentas y roles del personal.', activoDefinido: false },
        { id: 'admin_sectores_sedes', nombre: 'Administrar Sectores y Sedes', descripcion: 'Configurar sedes físicas y áreas departamentales.', activoDefinido: false },
        { id: 'admin_stats', nombre: 'Estadísticas', descripcion: 'Ver el panel completo y habilitar el botón de estadísticas en administración.', activoDefinido: false },
        { id: 'admin_historial', nombre: 'Historial', descripcion: 'Ver el panel de historial de cambios y movimientos de tareas.', activoDefinido: false },
      ],
    },
    {
      titulo: 'Módulo: Backlog',
      permisos: [
        { id: 'backlog_ver_todos', nombre: 'Ver todos los backlogs', descripcion: 'Permite visualizar todos los backlogs o solo los asignados.', activoDefinido: false },
        { id: 'backlog_borrar_propios', nombre: 'Borrar backlogs (propios)', descripcion: 'Permite eliminar backlogs en los que participa.', activoDefinido: true },
        { id: 'backlog_borrar_otros', nombre: 'Borrar backlogs (de otros)', descripcion: 'Permite eliminar backlogs de otros usuarios.', activoDefinido: false },
      ],
    },
  ],
};

function construirMapaPermisosDefault(rol) {
  const mapa = {};
  const modulosDefault = MOCK_ESTRUCTURA_PERMISOS[rol] || [];
  for (const modulo of modulosDefault) {
    for (const perm of modulo.permisos) {
      mapa[perm.id] = perm.activoDefinido;
    }
  }
  return mapa;
}

// Obtiene un mapeo simple del tipo { clave: activo } para un rol específico
export async function obtenerPermisosRol(rol) {
  if (rol === 'super_usuario') {
    // El Super Usuario tiene todos los accesos habilitados garantizados
    return {
      tablero_eliminar: true,
      tablero_notificaciones: true,
      tablero_editar: true,
      admin_panel: true,
      admin_usuarios: true,
      admin_sectores_sedes: true,
      admin_stats: true,
      admin_historial: true,
      backlog_ver_todos: true,
      backlog_borrar_propios: true,
      backlog_borrar_otros: true,
    };
  }

  const mapaDefault = construirMapaPermisosDefault(rol);
  const modulosDefault = MOCK_ESTRUCTURA_PERMISOS[rol] || [];
  if (modulosDefault.length === 0) {
    return mapaDefault;
  }

  try {
    const dbPermisos = await prisma.permisoRol.findMany({
      where: { rol },
    });

    const clavesValidas = new Set();
    for (const modulo of modulosDefault) {
      for (const perm of modulo.permisos) {
        clavesValidas.add(perm.id);
      }
    }

    const mapa = { ...mapaDefault };
    for (const p of dbPermisos) {
      if (clavesValidas.has(p.clave)) {
        mapa[p.clave] = p.activo;
      }
    }

    for (const modulo of modulosDefault) {
      for (const perm of modulo.permisos) {
        if (dbPermisos.some((p) => p.clave === perm.id)) continue;
        try {
          await prisma.permisoRol.upsert({
            where: { rol_clave: { rol, clave: perm.id } },
            update: {},
            create: {
              rol,
              clave: perm.id,
              activo: perm.activoDefinido,
            },
          });
        } catch (upsertError) {
          console.error(`No se pudo inicializar permiso ${perm.id} para ${rol}:`, upsertError.message);
        }
        mapa[perm.id] = perm.activoDefinido;
      }
    }

    return mapa;
  } catch (error) {
    console.error(`permiso_roles no disponible para rol ${rol}, usando valores por defecto:`, error.message);
    return mapaDefault;
  }
}

// Helper para construir la estructura JSON completa y jerárquica para el frontend
async function construirEstructuraPermisosCompleta() {
  const resultado = {};

  for (const rol of ['super_admin', 'admin', 'usuario']) {
    const mapaActual = await obtenerPermisosRol(rol);
    resultado[rol] = MOCK_ESTRUCTURA_PERMISOS[rol].map(modulo => ({
      titulo: modulo.titulo,
      permisos: modulo.permisos.map(perm => ({
        id: perm.id,
        nombre: perm.nombre,
        descripcion: perm.descripcion,
        activo: mapaActual[perm.id] ?? perm.activoDefinido,
      })),
    }));
  }

  return resultado;
}

// GET /api/permisos
router.get('/', obtenerUsuarioActual, requerirSuperAdminOSuperior, async (req, res) => {
  try {
    const estructura = await construirEstructuraPermisosCompleta();
    return res.json(estructura);
  } catch (error) {
    console.error('Error al obtener permisos:', error);
    return res.status(500).json({ 
      detail: 'Error al recuperar la configuración de permisos.',
      error: error.message,
      stack: error.stack
    });
  }
});

// PUT /api/permisos/:rol
router.put('/:rol', obtenerUsuarioActual, requerirSuperAdminOSuperior, async (req, res) => {
  try {
    const { rol } = req.params;
    const { modulos } = req.body;

    if (!['super_admin', 'admin', 'usuario'].includes(rol)) {
      return res.status(400).json({ detail: 'Rol inválido para configurar permisos.' });
    }

    if (!modulos || !Array.isArray(modulos)) {
      return res.status(400).json({ detail: 'Formato de módulos incorrecto.' });
    }

    for (const modulo of modulos) {
      if (modulo.permisos && Array.isArray(modulo.permisos)) {
        for (const perm of modulo.permisos) {
          await prisma.permisoRol.upsert({
            where: {
              rol_clave: { rol, clave: perm.id }
            },
            update: {
              activo: Boolean(perm.activo)
            },
            create: {
              rol,
              clave: perm.id,
              activo: Boolean(perm.activo)
            }
          });
        }
      }
    }

    return res.json({ detail: 'Permisos actualizados correctamente.' });
  } catch (error) {
    console.error('Error al actualizar permisos:', error);
    return res.status(500).json({ detail: 'Error al actualizar permisos en base de datos.' });
  }
});

export default router;
