import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, TrendingUp, Clock, Zap, CheckCircle, Loader, AlertTriangle } from 'lucide-react';
import type { KpisUsuario } from '../../tipos';
import { obtenerKpisUsuarios } from '../../servicios/estadisticas';
import MenuExportar from '../../componentes/MenuExportar/MenuExportar';
import './EstadisticasUsuarios.css';

function formatHoras(h: number | null): string {
  if (h === null) return '—';
  if (h < 1) return `${Math.round(h * 60)} min`;
  if (h < 24) return `${h.toFixed(1)} h`;
  return `${(h / 24).toFixed(1)} días`;
}

function BarraProgreso({ valor, max, color }: { valor: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((valor / max) * 100) : 0;
  return (
    <div className="kpi-barra-fondo">
      <div className="kpi-barra-relleno" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

function GraficoCriticidad({ alta, media, baja }: { alta: number; media: number; baja: number }) {
  const total = alta + media + baja;
  if (total === 0) return <span className="kpi-sin-datos">Sin tareas</span>;
  const pA = Math.round((alta / total) * 100);
  const pM = Math.round((media / total) * 100);
  const pB = 100 - pA - pM;
  return (
    <div className="kpi-criticidad-grafico">
      <div className="kpi-criticidad-barra">
        {pA > 0 && <div style={{ width: `${pA}%` }} className="kpi-crit-alta" title={`Alta: ${alta}`} />}
        {pM > 0 && <div style={{ width: `${pM}%` }} className="kpi-crit-media" title={`Media: ${media}`} />}
        {pB > 0 && <div style={{ width: `${pB}%` }} className="kpi-crit-baja" title={`Baja: ${baja}`} />}
      </div>
      <div className="kpi-criticidad-leyenda">
        <span className="kpi-crit-dot kpi-crit-dot--alta" /><span>{alta} alta</span>
        <span className="kpi-crit-dot kpi-crit-dot--media" /><span>{media} media</span>
        <span className="kpi-crit-dot kpi-crit-dot--baja" /><span>{baja} baja</span>
      </div>
    </div>
  );
}

function TarjetaUsuario({ u, maxPuntos, rank }: { u: KpisUsuario; maxPuntos: number; rank: number }) {
  const medallaClase = rank === 1 ? 'kpi-medalla--oro' : rank === 2 ? 'kpi-medalla--plata' : rank === 3 ? 'kpi-medalla--bronce' : '';
  return (
    <div className={`kpi-tarjeta ${rank <= 3 ? 'kpi-tarjeta--destacada' : ''}`}>
      <div className="kpi-tarjeta-cabecera">
        <div className="kpi-tarjeta-identidad">
          <span className={`kpi-medalla ${medallaClase}`}>{rank}</span>
          <div>
            <p className="kpi-nombre">{u.nombre} {u.apellido}</p>
            <p className="kpi-subtitulo">{u.tareas_finalizadas} finalizadas · {u.tareas_en_proceso} en proceso · {u.tareas_por_hacer} pendientes</p>
          </div>
        </div>
        <div className="kpi-tarjeta-puntos">
          <span className="kpi-puntos-num">{u.puntos}</span>
          <span className="kpi-puntos-label">pts</span>
        </div>
      </div>

      <BarraProgreso valor={u.puntos} max={maxPuntos} color={rank === 1 ? '#f59e0b' : rank <= 3 ? '#6366f1' : '#94a3b8'} />

      <div className="kpi-metricas-fila">
        <div className="kpi-metrica">
          <Clock size={14} />
          <div>
            <p className="kpi-metrica-valor">{formatHoras(u.promedio_respuesta_horas)}</p>
            <p className="kpi-metrica-etiqueta">Prom. respuesta</p>
          </div>
        </div>
        <div className="kpi-metrica">
          <TrendingUp size={14} />
          <div>
            <p className="kpi-metrica-valor">{formatHoras(u.promedio_resolucion_horas)}</p>
            <p className="kpi-metrica-etiqueta">Prom. resolución</p>
          </div>
        </div>
        <div className="kpi-metrica">
          <Zap size={14} />
          <div>
            <p className={`kpi-metrica-valor ${u.pct_alta >= 50 ? 'kpi-metrica-valor--alerta' : ''}`}>{u.pct_alta}%</p>
            <p className="kpi-metrica-etiqueta">% tareas alta</p>
          </div>
        </div>
        <div className="kpi-metrica">
          <CheckCircle size={14} />
          <div>
            <p className="kpi-metrica-valor">{u.puntos}</p>
            <p className="kpi-metrica-etiqueta">Puntos totales</p>
          </div>
        </div>
      </div>

      <div className="kpi-detalle">
          <p className="kpi-detalle-titulo">Distribución de criticidad</p>
          <GraficoCriticidad alta={u.tareas_alta} media={u.tareas_media} baja={u.tareas_baja} />
          <div className="kpi-detalle-estados">
            <div className="kpi-estado-chip kpi-estado-chip--finalizada">
              <CheckCircle size={12} /> {u.tareas_finalizadas} finalizadas
            </div>
            <div className="kpi-estado-chip kpi-estado-chip--proceso">
              <Loader size={12} /> {u.tareas_en_proceso} en proceso
            </div>
            <div className="kpi-estado-chip kpi-estado-chip--pendiente">
              <AlertTriangle size={12} /> {u.tareas_por_hacer} pendientes
            </div>
          </div>
        </div>
      </div>
  );
}

function GraficoBarrasGlobal({ usuarios }: { usuarios: KpisUsuario[] }) {
  const max = Math.max(...usuarios.map(u => u.puntos), 1);
  return (
    <div className="kpi-grafico-global">
      <h3 className="kpi-seccion-titulo">Ranking de puntos</h3>
      <div className="kpi-barras-container">
        {usuarios.map((u, i) => (
          <div key={u.usuario_id} className="kpi-barra-item">
            <div className="kpi-barra-etiqueta">{u.nombre} {u.apellido.charAt(0)}.</div>
            <div className="kpi-barra-wrap">
              <div
                className="kpi-barra-fill"
                style={{
                  width: `${Math.round((u.puntos / max) * 100)}%`,
                  background: i === 0 ? '#f59e0b' : i === 1 ? '#a78bfa' : i === 2 ? '#60a5fa' : '#94a3b8',
                }}
              />
              <span className="kpi-barra-num">{u.puntos}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function GraficoTiempos({ usuarios }: { usuarios: KpisUsuario[] }) {
  const conDatos = usuarios.filter(u => u.promedio_resolucion_horas !== null);
  if (conDatos.length === 0) return null;
  const max = Math.max(...conDatos.map(u => u.promedio_resolucion_horas!), 1);
  return (
    <div className="kpi-grafico-global">
      <h3 className="kpi-seccion-titulo">Tiempo promedio de resolución</h3>
      <div className="kpi-barras-container">
        {conDatos.map(u => (
          <div key={u.usuario_id} className="kpi-barra-item">
            <div className="kpi-barra-etiqueta">{u.nombre} {u.apellido.charAt(0)}.</div>
            <div className="kpi-barra-wrap">
              <div
                className="kpi-barra-fill kpi-barra-fill--tiempo"
                style={{ width: `${Math.round((u.promedio_resolucion_horas! / max) * 100)}%` }}
              />
              <span className="kpi-barra-num">{formatHoras(u.promedio_resolucion_horas)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function EstadisticasUsuarios() {
  const [usuarios, setUsuarios] = useState<KpisUsuario[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    obtenerKpisUsuarios()
      .then(r => setUsuarios(r.usuarios))
      .finally(() => setCargando(false));
  }, []);

  const maxPuntos = Math.max(...usuarios.map(u => u.puntos), 1);
  const totalTareas = usuarios.reduce((s, u) => s + u.tareas_finalizadas + u.tareas_en_proceso + u.tareas_por_hacer, 0);
  const totalFinalizadas = usuarios.reduce((s, u) => s + u.tareas_finalizadas, 0);
  const promedioResolucion = (() => {
    const vals = usuarios.filter(u => u.promedio_resolucion_horas !== null).map(u => u.promedio_resolucion_horas!);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  })();

  const filasExportacion = useMemo(
    () =>
      usuarios.map((u, i) => ({
        ranking: String(i + 1),
        nombre: `${u.nombre} ${u.apellido}`,
        puntos: String(u.puntos),
        finalizadas: String(u.tareas_finalizadas),
        en_proceso: String(u.tareas_en_proceso),
        pendientes: String(u.tareas_por_hacer),
        prom_respuesta: formatHoras(u.promedio_respuesta_horas),
        prom_resolucion: formatHoras(u.promedio_resolucion_horas),
        alta: String(u.tareas_alta),
        media: String(u.tareas_media),
        baja: String(u.tareas_baja),
        pct_alta: `${u.pct_alta}%`,
      })),
    [usuarios]
  );

  return (
    <div className="estadisticas-usuarios pagina pagina--centrada">
      <Link to="/admin" className="btn-volver">
        <ArrowLeft size={18} />
        Volver al Panel Admin
      </Link>

      <div className="estadisticas-usuarios__encabezado">
        <div>
          <h1 className="estadisticas-usuarios__titulo">Panel de estadísticas</h1>
          <p className="estadisticas-usuarios__aclaracion">KPIs por usuario · Puntos: Alta = 3, Media = 2, Baja = 1</p>
        </div>
        <MenuExportar
          opciones={{
            titulo: 'Estadísticas de usuarios - Scrum IPS',
            nombreArchivo: 'estadisticas-usuarios',
            columnas: [
              { encabezado: '#', clave: 'ranking' },
              { encabezado: 'Usuario', clave: 'nombre' },
              { encabezado: 'Puntos', clave: 'puntos' },
              { encabezado: 'Finalizadas', clave: 'finalizadas' },
              { encabezado: 'En proceso', clave: 'en_proceso' },
              { encabezado: 'Pendientes', clave: 'pendientes' },
              { encabezado: 'Prom. respuesta', clave: 'prom_respuesta' },
              { encabezado: 'Prom. resolución', clave: 'prom_resolucion' },
              { encabezado: 'Alta', clave: 'alta' },
              { encabezado: 'Media', clave: 'media' },
              { encabezado: 'Baja', clave: 'baja' },
              { encabezado: '% alta', clave: 'pct_alta' },
            ],
            filas: filasExportacion,
          }}
          deshabilitado={cargando}
        />
      </div>

      {cargando ? (
        <p className="estadisticas-usuarios__vacio">Cargando...</p>
      ) : usuarios.length === 0 ? (
        <p className="estadisticas-usuarios__vacio">Sin datos todavía</p>
      ) : (
        <>
          {/* Resumen global */}
          <div className="kpi-resumen-global">
            <div className="kpi-resumen-card">
              <p className="kpi-resumen-num">{usuarios.length}</p>
              <p className="kpi-resumen-label">Usuarios activos</p>
            </div>
            <div className="kpi-resumen-card">
              <p className="kpi-resumen-num">{totalTareas}</p>
              <p className="kpi-resumen-label">Tareas totales</p>
            </div>
            <div className="kpi-resumen-card">
              <p className="kpi-resumen-num">{totalFinalizadas}</p>
              <p className="kpi-resumen-label">Finalizadas</p>
            </div>
            <div className="kpi-resumen-card">
              <p className="kpi-resumen-num">{formatHoras(promedioResolucion)}</p>
              <p className="kpi-resumen-label">Resolución promedio</p>
            </div>
          </div>

          {/* Gráficos globales */}
          <div className="kpi-graficos-fila">
            <GraficoBarrasGlobal usuarios={usuarios} />
            <GraficoTiempos usuarios={usuarios} />
          </div>

          {/* Tarjetas por usuario */}
          <h2 className="kpi-seccion-titulo kpi-seccion-titulo--grande">Detalle por usuario</h2>
          <div className="kpi-tarjetas-grid">
            {usuarios.map((u, i) => (
              <TarjetaUsuario key={u.usuario_id} u={u} maxPuntos={maxPuntos} rank={i + 1} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
