import { useState, useEffect, useMemo, useCallback } from 'react';
import { ShieldAlert, Users, Layers, Building2, CheckSquare, Monitor, FolderKanban, ArrowLeft, X } from 'lucide-react';
import api from '../../servicios/api';
import MenuExportar from '../../componentes/MenuExportar/MenuExportar';
import './PanelAuditoria.css';

interface RegistroAuditoria {
  id: number;
  email: string;
  accion: string;
  ip: string;
  estado_codigo: number;
  fecha_creacion: string;
  detalles: string;
  usuario?: {
    nombre: string;
    apellido: string;
  };
}

const SECCIONES = [
  { id: 'sesiones', titulo: 'Sesiones', descripcion: 'Inicios de sesión e impersonate', icono: ShieldAlert },
  { id: 'usuarios', titulo: 'Usuarios', descripcion: 'Auditoría de gestión de usuarios', icono: Users },
  { id: 'sectores', titulo: 'Sectores', descripcion: 'Auditoría de sectores', icono: Layers },
  { id: 'sedes', titulo: 'Sedes', descripcion: 'Auditoría de sedes y edificios', icono: Building2 },
  { id: 'tareas', titulo: 'Tareas', descripcion: 'Auditoría de tickets y tareas', icono: CheckSquare },
  { id: 'pcs', titulo: 'PCs', descripcion: 'Auditoría de registro de equipos', icono: Monitor },
  { id: 'proyectos', titulo: 'Backlogs', descripcion: 'Auditoría de backlogs y proyectos', icono: FolderKanban },
];

export default function PanelAuditoria() {
  const [seccionSeleccionada, setSeccionSeleccionada] = useState<string | null>(null);
  const [registros, setRegistros] = useState<RegistroAuditoria[]>([]);
  const [cargando, setCargando] = useState(false);
  const [pagina, setPagina] = useState(1);
  const [paginasTotales, setPaginasTotales] = useState(1);
  const [detallesModal, setDetallesModal] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [totalRegistros, setTotalRegistros] = useState(0);

  useEffect(() => {
    if (seccionSeleccionada) {
      cargarRegistros();
    }
  }, [seccionSeleccionada, pagina]);

  async function cargarRegistros() {
    setCargando(true);
    setError('');
    try {
      const res = await api.get(`/auditoria?tipo=${seccionSeleccionada}&pagina=${pagina}`);
      setRegistros(Array.isArray(res.data.registros) ? res.data.registros : []);
      setPaginasTotales(res.data.paginas_totales || 1);
      setTotalRegistros(res.data.total ?? 0);
    } catch (err: unknown) {
      const detalle = (err as { response?: { data?: { detail?: string }; status?: number } })?.response?.data?.detail;
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 403) {
        setError('No tenés permiso para ver los logs de auditoría. Pedí que activen "Logs de Auditoría" para tu rol.');
      } else {
        setError(detalle ?? 'No se pudieron cargar los registros. Verificá que las tablas de auditoría existan en la base de datos.');
      }
      setRegistros([]);
      setTotalRegistros(0);
    } finally {
      setCargando(false);
    }
  }

  function formatearFecha(isoString: string) {
    if (!isoString) return 'Desconocida';
    try {
      const fecha = new Date(isoString);
      if (isNaN(fecha.getTime())) return 'Inválida';
      return fecha.toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });
    } catch {
      return 'Inválida';
    }
  }

  function registroAFila(reg: RegistroAuditoria) {
    return {
      fecha: formatearFecha(reg?.fecha_creacion),
      usuario: reg?.usuario
        ? `${reg.usuario.nombre || ''} ${reg.usuario.apellido || ''}`.trim()
        : (reg?.email || 'Desconocido'),
      email: reg?.email || 'N/A',
      accion: reg?.accion || 'Desconocida',
      ip: reg?.ip || 'N/A',
      estado: String(reg?.estado_codigo ?? ''),
      detalles: reg?.detalles && reg.detalles !== '{}' ? reg.detalles : 'Sin detalles',
    };
  }

  const columnasAuditoria = useMemo(
    () => [
      { encabezado: 'Fecha y Hora', clave: 'fecha' },
      { encabezado: 'Usuario', clave: 'usuario' },
      { encabezado: 'Email', clave: 'email' },
      { encabezado: 'Acción', clave: 'accion' },
      { encabezado: 'IP', clave: 'ip' },
      { encabezado: 'Estado HTTP', clave: 'estado' },
      { encabezado: 'Detalles', clave: 'detalles' },
    ],
    []
  );

  const filasExportacion = useMemo(
    () => registros.map(registroAFila),
    [registros]
  );

  const exportarTodosRegistros = useCallback(async () => {
    if (!seccionSeleccionada) return [];
    const todos: RegistroAuditoria[] = [];
    let paginaActual = 1;
    let paginas = 1;
    while (paginaActual <= paginas) {
      const res = await api.get(`/auditoria?tipo=${seccionSeleccionada}&pagina=${paginaActual}&limite=100`);
      todos.push(...(Array.isArray(res.data.registros) ? res.data.registros : []));
      paginas = res.data.paginas_totales || 1;
      paginaActual += 1;
    }
    return todos.map(registroAFila);
  }, [seccionSeleccionada]);

  function mostrarDetalles(detallesJson: string) {
    try {
      const parseado = JSON.parse(detallesJson);
      setDetallesModal(JSON.stringify(parseado, null, 2));
    } catch {
      setDetallesModal(detallesJson);
    }
  }

  if (!seccionSeleccionada) {
    return (
      <div className="pagina pagina--centrada">
        <h1>Panel de Auditoría General</h1>
        <p style={{ color: 'var(--color-texto-secundario)' }}>Seleccione una categoría para visualizar los registros de auditoría.</p>
        
        <div className="panel-auditoria__grilla">
          {SECCIONES.map(({ id, titulo, descripcion, icono: Icono }) => (
            <div 
              key={id} 
              className="panel-auditoria__tarjeta"
              onClick={() => {
                setSeccionSeleccionada(id);
                setPagina(1);
              }}
            >
              <div className="panel-auditoria__icono-envolvente">
                <Icono size={28} />
              </div>
              <div className="panel-auditoria__info">
                <span className="panel-auditoria__nombre">{titulo}</span>
                <span className="panel-auditoria__descripcion">{descripcion}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const seccion = SECCIONES.find(s => s.id === seccionSeleccionada);

  return (
    <div className="pagina">
      <div className="panel-auditoria__encabezado-tabla">
        <button className="panel-auditoria__btn-volver" onClick={() => setSeccionSeleccionada(null)}>
          <ArrowLeft size={16} /> Volver
        </button>
        <h1 className="panel-auditoria__titulo-tabla">Auditoría: {seccion?.titulo}</h1>
        {totalRegistros > 0 && (
          <span className="panel-auditoria__contador-total">{totalRegistros} registros</span>
        )}
        <MenuExportar
          opciones={{
            titulo: `Auditoría ${seccion?.titulo ?? ''} - Scrum IPS`,
            nombreArchivo: `auditoria-${seccionSeleccionada}`,
            columnas: columnasAuditoria,
            filas: filasExportacion,
          }}
          deshabilitado={cargando || !!error}
          alExportarTodos={exportarTodosRegistros}
        />
      </div>

      {error && (
        <div className="panel-auditoria__error">{error}</div>
      )}

      <div className="panel-auditoria__tabla-contenedor">
        {cargando ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando registros...</div>
        ) : error ? null : !Array.isArray(registros) || registros.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            No hay registros en esta categoría. Los cambios (crear, editar, eliminar) aparecen acá automáticamente.
          </div>
        ) : (
          <table className="panel-auditoria__tabla">
            <thead>
              <tr>
                <th>Fecha y Hora</th>
                <th>Usuario</th>
                <th>Acción</th>
                <th>IP</th>
                <th>Estado HTTP</th>
                <th>Detalles</th>
              </tr>
            </thead>
            <tbody>
              {registros.map((reg) => (
                <tr key={reg.id}>
                  <td>{formatearFecha(reg?.fecha_creacion)}</td>
                  <td>
                    {reg?.usuario ? `${reg.usuario.nombre || ''} ${reg.usuario.apellido || ''}` : (reg?.email || 'Desconocido')}
                    <br />
                    <small style={{ color: 'var(--color-texto-secundario)' }}>{reg?.email || 'N/A'}</small>
                  </td>
                  <td>{reg?.accion || 'Desconocida'}</td>
                  <td>{reg?.ip || 'N/A'}</td>
                  <td>
                    <span style={{ 
                      color: (reg?.estado_codigo || 200) >= 400 ? 'var(--color-peligro)' : 'var(--color-exito)',
                      fontWeight: 600
                    }}>
                      {reg.estado_codigo}
                    </span>
                  </td>
                  <td>
                    {reg?.detalles && reg.detalles !== '{}' ? (
                      <button 
                        className="panel-auditoria__detalles-btn"
                        onClick={() => mostrarDetalles(reg.detalles)}
                      >
                        Ver Detalles
                      </button>
                    ) : (
                      <span style={{ color: 'var(--color-texto-secundario)', fontSize: '0.8rem' }}>Sin detalles</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {registros.length > 0 && (
        <div className="paginacion-auditoria">
          <span>Página {pagina} de {paginasTotales}</span>
          <div className="paginacion-auditoria__botones">
            <button 
              className="paginacion-auditoria__btn" 
              disabled={pagina === 1 || cargando}
              onClick={() => setPagina(p => p - 1)}
            >
              Anterior
            </button>
            <button 
              className="paginacion-auditoria__btn" 
              disabled={pagina >= paginasTotales || cargando}
              onClick={() => setPagina(p => p + 1)}
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {detallesModal && (
        <div className="modal-auditoria-detalles" onClick={() => setDetallesModal(null)}>
          <div className="modal-auditoria-detalles__contenido" onClick={e => e.stopPropagation()}>
            <div className="modal-auditoria-detalles__header">
              <h3>Detalles de la Petición</h3>
              <button className="modal-auditoria-detalles__cerrar" onClick={() => setDetallesModal(null)}>
                <X size={24} />
              </button>
            </div>
            <pre className="modal-auditoria-detalles__pre">
              {detallesModal}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
