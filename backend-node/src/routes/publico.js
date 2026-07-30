import { Router } from 'express';
import { prisma } from '../db.js';
import {
  obtenerIpCliente,
  normalizarDni,
  validarLimiteSolicitudPublica,
} from '../utilidades/limiteSolicitudPublica.js';

const router = Router();

// GET /api/publico/sectores
router.get('/sectores', async (req, res) => {
  const sectores = await prisma.sector.findMany({
    where: {
      activo: true,
      NOT: { nombre: 'Todos los sectores' },
    },
    orderBy: { nombre: 'asc' },
  });
  return res.json(sectores);
});

// GET /api/publico/sedes
router.get('/sedes', async (req, res) => {
  const sedes = await prisma.sede.findMany({
    where: { activo: true },
    orderBy: { nombre: 'asc' },
  });
  return res.json(sedes);
});

// POST /api/publico/solicitud
router.post('/solicitud', async (req, res) => {
  const {
    titulo,
    detalle,
    criticidad = 'baja',
    sede_id,
    sector_id,
    nombre_contacto,
    telefono_contacto,
    dni_contacto,
  } = req.body;

  if (!titulo || !titulo.trim()) {
    return res.status(400).json({ detail: 'El campo título es obligatorio' });
  }
  if (!sede_id) {
    return res.status(400).json({ detail: 'El campo sede es obligatorio' });
  }
  if (!sector_id) {
    return res.status(400).json({ detail: 'El campo sector es obligatorio' });
  }
  if (!nombre_contacto || !nombre_contacto.trim()) {
    return res.status(400).json({ detail: 'El campo nombre es obligatorio' });
  }
  if (!telefono_contacto || !telefono_contacto.trim()) {
    return res.status(400).json({ detail: 'El campo teléfono es obligatorio' });
  }
  if (!dni_contacto || !String(dni_contacto).trim()) {
    return res.status(400).json({ detail: 'El campo DNI es obligatorio' });
  }
  const dniLimpio = normalizarDni(dni_contacto);
  if (dniLimpio.length < 7 || dniLimpio.length > 8) {
    return res.status(400).json({ detail: 'Ingresá un DNI válido (7 u 8 dígitos)' });
  }
  if (!detalle || !detalle.trim()) {
    return res.status(400).json({ detail: 'El campo detalle es obligatorio' });
  }

  const ip = obtenerIpCliente(req);
  const sedeIdNum = parseInt(sede_id, 10);

  const limite = await validarLimiteSolicitudPublica(prisma, {
    ip,
    dni: dniLimpio,
    telefono: telefono_contacto,
    titulo,
    sedeId: sedeIdNum,
  });
  if (!limite.ok) {
    return res.status(limite.status).json({ detail: limite.detail });
  }

  const admin = await prisma.usuario.findFirst({ where: { rol: 'admin', activo: true } });
  if (!admin) return res.status(503).json({ detail: 'Sistema no disponible' });

  const sector = await prisma.sector.findFirst({
    where: {
      id: parseInt(sector_id, 10),
      activo: true,
      NOT: { nombre: 'Todos los sectores' },
    },
  });
  if (!sector) return res.status(400).json({ detail: 'Sector inválido o no disponible' });

  const partes = [];
  if (nombre_contacto) partes.push(`Contacto: ${nombre_contacto.trim()} (DNI: ${dniLimpio})`);
  if (detalle) partes.push(detalle);
  const nota = partes.join('\n\n') || null;

  const tarea = await prisma.tarea.create({
    data: {
      titulo: titulo.trim(),
      titulo_normalizado: limite.tituloNorm,
      nota_llamada: nota,
      criticidad,
      sector_id: sector.id,
      sede_id: sedeIdNum,
      numero_contacto: telefono_contacto.trim(),
      dni_contacto: dniLimpio,
      solicitud_ip: ip,
      creada_por: admin.id,
    },
  });

  await prisma.alertaAdmin.create({
    data: {
      tipo: 'tarea_creada',
      mensaje: `Solicitud pública: '${tarea.titulo}'`,
      tarea_id: tarea.id,
    },
  });

  return res.status(201).json({ ok: true, id: tarea.id });
});

const ESTADO_LEGIBLE = {
  por_hacer: 'Por hacer',
  en_proceso: 'En proceso',
  pendiente: 'Pendiente',
  finalizada: 'Finalizada',
};

function dniConsultaValido(raw) {
  const dni = normalizarDni(raw ?? '');
  if (!dni || dni.length < 7 || dni.length > 8) return null;
  return dni;
}

// GET /api/publico/solicitud/:id/valoracion
router.get('/solicitud/:id/valoracion', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    return res.status(400).json({ detail: 'Número de solicitud inválido' });
  }

  const dniQuery = dniConsultaValido(req.query.dni);
  if (!dniQuery) {
    return res.status(400).json({ detail: 'Ingresá el DNI con el que cargaste la solicitud' });
  }

  const tarea = await prisma.tarea.findUnique({
    where: { id },
    select: {
      id: true,
      titulo: true,
      estado: true,
      activo: true,
      dni_contacto: true,
      fecha_creacion: true,
      fecha_inicio: true,
      fecha_finalizacion: true,
      valoracion_solicitante: true,
      comentario_solicitante: true,
      fecha_valoracion: true,
    },
  });

  if (!tarea || !tarea.activo) {
    return res.status(404).json({ detail: 'Solicitud no encontrada' });
  }

  if (!tarea.dni_contacto || tarea.dni_contacto !== dniQuery) {
    return res.status(403).json({ detail: 'El DNI no coincide con esta solicitud' });
  }

  const yaValorada = tarea.valoracion_solicitante != null;
  const puedeValorar = tarea.estado === 'finalizada' && !yaValorada;

  return res.json({
    id: tarea.id,
    titulo: tarea.titulo,
    estado: tarea.estado,
    estado_legible: ESTADO_LEGIBLE[tarea.estado] || tarea.estado,
    fecha_creacion: tarea.fecha_creacion ? String(tarea.fecha_creacion) : null,
    fecha_inicio: tarea.fecha_inicio ? String(tarea.fecha_inicio) : null,
    fecha_finalizacion: tarea.fecha_finalizacion ? String(tarea.fecha_finalizacion) : null,
    puede_valorar: puedeValorar,
    ya_valorada: yaValorada,
    puntuacion: tarea.valoracion_solicitante,
    comentario: tarea.comentario_solicitante,
    fecha_valoracion: tarea.fecha_valoracion ? String(tarea.fecha_valoracion) : null,
  });
});

// POST /api/publico/solicitud/:id/valoracion
router.post('/solicitud/:id/valoracion', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { puntuacion, comentario, dni_contacto } = req.body;

  if (Number.isNaN(id)) {
    return res.status(400).json({ detail: 'Número de solicitud inválido' });
  }

  const dniBody = dniConsultaValido(dni_contacto);
  if (!dniBody) {
    return res.status(400).json({ detail: 'Ingresá el DNI con el que cargaste la solicitud' });
  }

  const puntos = parseInt(puntuacion, 10);
  if (Number.isNaN(puntos) || puntos < 1 || puntos > 5) {
    return res.status(400).json({ detail: 'La puntuación debe ser entre 1 y 5 estrellas' });
  }

  const tarea = await prisma.tarea.findUnique({ where: { id } });
  if (!tarea || !tarea.activo) {
    return res.status(404).json({ detail: 'Solicitud no encontrada' });
  }
  if (!tarea.dni_contacto || tarea.dni_contacto !== dniBody) {
    return res.status(403).json({ detail: 'El DNI no coincide con esta solicitud' });
  }
  if (tarea.valoracion_solicitante != null) {
    return res.status(409).json({ detail: 'Esta solicitud ya fue valorada' });
  }
  if (tarea.estado !== 'finalizada') {
    return res.status(400).json({
      detail: 'Tu solicitud aún está en curso. Podés valorar cuando esté resuelta.',
    });
  }

  const comentarioLimpio = typeof comentario === 'string' ? comentario.trim().slice(0, 500) : '';

  await prisma.tarea.update({
    where: { id },
    data: {
      valoracion_solicitante: puntos,
      comentario_solicitante: comentarioLimpio || null,
      fecha_valoracion: new Date(),
    },
  });

  return res.json({ ok: true });
});

export default router;
