import { useState, useEffect, useCallback } from 'react';
import { Star, Check } from 'lucide-react';
import apiPublica from '../../servicios/apiPublica';
import './ValoracionSolicitud.css';

type EstadoTarea = 'por_hacer' | 'en_proceso' | 'pendiente' | 'finalizada' | string;

interface EstadoValoracion {
  id: number;
  titulo?: string;
  estado: EstadoTarea;
  estado_legible?: string;
  fecha_creacion?: string | null;
  fecha_inicio?: string | null;
  fecha_finalizacion?: string | null;
  puede_valorar: boolean;
  ya_valorada: boolean;
  puntuacion: number | null;
  comentario: string | null;
}

interface Props {
  solicitudId: number;
  dni: string;
  compacto?: boolean;
}

const PASOS: { clave: EstadoTarea; etiqueta: string }[] = [
  { clave: 'por_hacer', etiqueta: 'Por hacer' },
  { clave: 'en_proceso', etiqueta: 'En proceso' },
  { clave: 'pendiente', etiqueta: 'Pendiente' },
  { clave: 'finalizada', etiqueta: 'Finalizada' },
];

function indicePaso(estado: EstadoTarea): number {
  const idx = PASOS.findIndex(p => p.clave === estado);
  return idx >= 0 ? idx : 0;
}

export default function ValoracionSolicitud({ solicitudId, dni, compacto = false }: Props) {
  const [estado, setEstado] = useState<EstadoValoracion | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [puntuacion, setPuntuacion] = useState(0);
  const [hover, setHover] = useState(0);
  const [comentario, setComentario] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const dniLimpio = dni.replace(/\D/g, '');

  const consultarEstado = useCallback(async () => {
    if (!dniLimpio) {
      setError('Ingresá el DNI con el que cargaste la solicitud.');
      setEstado(null);
      setCargando(false);
      return;
    }
    try {
      const { data } = await apiPublica.get<EstadoValoracion>(
        `/publico/solicitud/${solicitudId}/valoracion`,
        { params: { dni: dniLimpio } }
      );
      setEstado(data);
      if (data.ya_valorada && data.puntuacion) {
        setPuntuacion(data.puntuacion);
        setComentario(data.comentario ?? '');
        setEnviado(true);
      }
      setError('');
    } catch (e: unknown) {
      const detalle = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(detalle ?? 'No encontramos esa solicitud. Verificá el número y el DNI.');
      setEstado(null);
    } finally {
      setCargando(false);
    }
  }, [solicitudId, dniLimpio]);

  useEffect(() => {
    setCargando(true);
    setEnviado(false);
    setPuntuacion(0);
    setComentario('');
    consultarEstado();
  }, [consultarEstado]);

  useEffect(() => {
    if (!estado || estado.puede_valorar || estado.ya_valorada) return;

    const intervalo = setInterval(consultarEstado, 20000);
    return () => clearInterval(intervalo);
  }, [estado, consultarEstado]);

  async function enviarValoracion() {
    if (puntuacion < 1) {
      setError('Seleccioná una puntuación con las estrellas.');
      return;
    }
    setEnviando(true);
    setError('');
    try {
      await apiPublica.post(`/publico/solicitud/${solicitudId}/valoracion`, {
        puntuacion,
        comentario: comentario.trim() || undefined,
        dni_contacto: dniLimpio,
      });
      setEnviado(true);
      await consultarEstado();
    } catch (e: unknown) {
      const detalle = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(detalle ?? 'No se pudo enviar la valoración. Intentá de nuevo.');
    } finally {
      setEnviando(false);
    }
  }

  if (cargando) {
    return <p className="sp-valoracion__cargando">Cargando seguimiento...</p>;
  }

  if (!estado) {
    return error ? <p className="sp-valoracion__error">{error}</p> : null;
  }

  const pasoActual = indicePaso(estado.estado);
  const estaFinalizada = estado.estado === 'finalizada';

  return (
    <div className={`sp-valoracion ${compacto ? 'sp-valoracion--compacto' : ''}`}>
      <h2 className="sp-valoracion__titulo">Seguimiento de tu solicitud</h2>
      {estado.titulo && (
        <p className="sp-valoracion__pedido">
          Pedido #{estado.id}: <strong>{estado.titulo}</strong>
        </p>
      )}

      <ol className="sp-seguimiento" aria-label="Progreso de la solicitud">
        {PASOS.map((paso, i) => {
          const hecho = i < pasoActual || (estaFinalizada && i <= pasoActual);
          const activo = i === pasoActual && !estaFinalizada;
          const clase = [
            'sp-seguimiento__paso',
            hecho || (estaFinalizada && i === pasoActual) ? 'sp-seguimiento__paso--hecho' : '',
            activo ? 'sp-seguimiento__paso--activo' : '',
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <li key={paso.clave} className={clase}>
              <span className="sp-seguimiento__punto" aria-hidden="true">
                {hecho || (estaFinalizada && i === pasoActual) ? <Check size={14} strokeWidth={3} /> : i + 1}
              </span>
              <span className="sp-seguimiento__etiqueta">{paso.etiqueta}</span>
            </li>
          );
        })}
      </ol>

      <p className="sp-valoracion__estado-actual">
        Estado actual:{' '}
        <strong>{estado.estado_legible || estado.estado}</strong>
      </p>

      {estaFinalizada ? (
        <div className="sp-seguimiento__finalizada" role="status">
          <p className="sp-seguimiento__finalizada-titulo">Tarea finalizada</p>
          <p className="sp-seguimiento__finalizada-texto">
            El equipo de informática terminó tu tarea.
          </p>
        </div>
      ) : (
        <p className="sp-valoracion__ayuda">
          El equipo de informática está trabajando en tu pedido. Esta pantalla se actualiza sola.
        </p>
      )}

      {enviado || estado.ya_valorada ? (
        <div className="sp-valoracion sp-valoracion--ok sp-valoracion--sin-borde">
          <p className="sp-valoracion__titulo">¡Gracias por tu valoración!</p>
          <div
            className="sp-valoracion__estrellas sp-valoracion__estrellas--solo-lectura"
            aria-label={`${puntuacion || estado.puntuacion} de 5 estrellas`}
          >
            {[1, 2, 3, 4, 5].map(n => (
              <Star
                key={n}
                size={22}
                className={n <= (puntuacion || estado.puntuacion || 0) ? 'sp-valoracion__estrella--activa' : 'sp-valoracion__estrella'}
                fill={n <= (puntuacion || estado.puntuacion || 0) ? 'currentColor' : 'none'}
              />
            ))}
          </div>
          {(comentario || estado.comentario) && (
            <p className="sp-valoracion__comentario-enviado">"{comentario || estado.comentario}"</p>
          )}
        </div>
      ) : estaFinalizada ? (
        <>
          <h2 className="sp-valoracion__titulo">¿Cómo fue la resolución?</h2>
          <p className="sp-valoracion__ayuda">Contanos cómo fue la atención de tu pedido.</p>

          <div
            className="sp-valoracion__estrellas"
            role="radiogroup"
            aria-label="Puntuación de 1 a 5 estrellas"
          >
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                type="button"
                className="sp-valoracion__estrella-btn"
                disabled={!estado.puede_valorar || enviando}
                onClick={() => setPuntuacion(n)}
                onMouseEnter={() => setHover(n)}
                onMouseLeave={() => setHover(0)}
                aria-label={`${n} estrella${n > 1 ? 's' : ''}`}
                aria-checked={puntuacion === n}
                role="radio"
              >
                <Star
                  size={28}
                  className={n <= (hover || puntuacion) ? 'sp-valoracion__estrella--activa' : 'sp-valoracion__estrella'}
                  fill={n <= (hover || puntuacion) ? 'currentColor' : 'none'}
                />
              </button>
            ))}
          </div>

          <div className="sp-valoracion__campo">
            <label className="sp-etiqueta" htmlFor={`sp-comentario-${solicitudId}`}>
              Comentario <span className="sp-opcional">(opcional)</span>
            </label>
            <textarea
              id={`sp-comentario-${solicitudId}`}
              className="sp-textarea sp-valoracion__textarea"
              placeholder="Contanos brevemente cómo fue la atención..."
              value={comentario}
              onChange={e => setComentario(e.target.value)}
              rows={3}
              maxLength={500}
              disabled={!estado.puede_valorar || enviando}
            />
          </div>

          {error && <p className="sp-valoracion__error">{error}</p>}

          <button
            type="button"
            className="sp-btn sp-btn--primario sp-valoracion__btn"
            onClick={enviarValoracion}
            disabled={!estado.puede_valorar || enviando || puntuacion < 1}
          >
            {enviando ? 'Enviando...' : 'Enviar valoración'}
          </button>
        </>
      ) : null}

      {error && !estaFinalizada && <p className="sp-valoracion__error">{error}</p>}
    </div>
  );
}
