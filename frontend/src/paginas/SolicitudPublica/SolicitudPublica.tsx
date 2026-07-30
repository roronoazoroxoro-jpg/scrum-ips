import { useState, useEffect } from 'react';
import apiPublica from '../../servicios/apiPublica';
import logoSiglas from '../../assets/logo-siglas.svg';
import Selector from '../../componentes/Selector/Selector';
import ValoracionSolicitud from './ValoracionSolicitud';
import './SolicitudPublica.css';
import './ValoracionSolicitud.css';

interface Sede { id: number; nombre: string; }
interface Sector { id: number; nombre: string; }

type Criticidad = 'baja' | 'media' | 'alta';

const CRITICIDAD_LABELS: Record<Criticidad, string> = {
  baja: 'Baja',
  media: 'Media',
  alta: 'Alta',
};

const CRITICIDAD_DESC: Record<Criticidad, string> = {
  baja: 'Consulta general o tarea de rutina',
  media: 'Afecta el trabajo pero tiene solución temporal',
  alta: 'Impide operar o es atencion al público',
};

export default function SolicitudPublica() {
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [sectores, setSectores] = useState<Sector[]>([]);

  const [titulo, setTitulo] = useState('');
  const [detalle, setDetalle] = useState('');
  const [criticidad, setCriticidad] = useState<Criticidad>('baja');
  const [sedeId, setSedeId] = useState('');
  const [sectorId, setSectorId] = useState('');
  const [nombre, setNombre] = useState('');
  const [dni, setDni] = useState('');
  const [telefono, setTelefono] = useState('');

  const [bloqueaAtencion, setBloqueaAtencion] = useState<boolean | null>(null);
  const [esRemoto, setEsRemoto] = useState<boolean | null>(null);
  const [rustdeskId, setRustdeskId] = useState('');
  const [rustdeskPassword, setRustdeskPassword] = useState('');
  const [tareaIdCreada, setTareaIdCreada] = useState<number | null>(null);

  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState('');

  const [mostrarBuscarSeguimiento, setMostrarBuscarSeguimiento] = useState(false);
  const [idBuscarSeguimiento, setIdBuscarSeguimiento] = useState('');
  const [dniBuscarSeguimiento, setDniBuscarSeguimiento] = useState('');
  const [idSeguimientoActivo, setIdSeguimientoActivo] = useState<number | null>(null);
  const [dniSeguimientoActivo, setDniSeguimientoActivo] = useState('');

  useEffect(() => {
    apiPublica.get<Sede[]>('/publico/sedes').then(r => setSedes(r.data));
    apiPublica.get<Sector[]>('/publico/sectores').then(r => setSectores(r.data));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!titulo.trim()) {
      setError('Por favor, completá qué necesitás.');
      return;
    }
    if (!sedeId) {
      setError('Por favor, seleccioná tu sede.');
      return;
    }
    if (!sectorId) {
      setError('Por favor, seleccioná el área que debe atender tu solicitud.');
      return;
    }
    if (bloqueaAtencion === null) {
      setError('Por favor, indicá si el problema imposibilita la atención al público.');
      return;
    }
    if (!nombre.trim()) {
      setError('Por favor, ingresá tu nombre.');
      return;
    }
    const dniLimpio = dni.replace(/\D/g, '');
    if (!dniLimpio) {
      setError('Por favor, ingresá tu DNI.');
      return;
    }
    if (dniLimpio.length < 7 || dniLimpio.length > 8) {
      setError('El DNI debe tener 7 u 8 dígitos.');
      return;
    }
    if (!telefono.trim()) {
      setError('Por favor, ingresá tu teléfono de contacto.');
      return;
    }
    if (esRemoto === null) {
      setError('Por favor, indicá si el problema se puede solucionar de forma remota.');
      return;
    }
    if (esRemoto === true && (!rustdeskId.trim() || !rustdeskPassword.trim())) {
      setError('Por favor, ingresá tu ID y contraseña de RustDesk para soporte remoto.');
      return;
    }
    if (!detalle.trim()) {
      setError('Por favor, ingresá el detalle adicional.');
      return;
    }

    setEnviando(true);
    try {
      let detalleFinal = detalle.trim();
      if (esRemoto === true) {
        const remotoInfo = `[SOPORTE REMOTO RUSTDESK]\nID de RustDesk: ${rustdeskId.trim()}\nContraseña: ${rustdeskPassword.trim()}`;
        detalleFinal = `${remotoInfo}\n\nDetalle adicional:\n${detalleFinal}`;
      }

      const respuesta = await apiPublica.post<{ ok: boolean; id: number }>('/publico/solicitud', {
        titulo: titulo.trim(),
        detalle: detalleFinal,
        criticidad,
        sede_id: Number(sedeId),
        sector_id: Number(sectorId),
        nombre_contacto: nombre.trim(),
        dni_contacto: dniLimpio,
        telefono_contacto: telefono.trim(),
      });
      setTareaIdCreada(respuesta.data.id);
      setEnviado(true);
    } catch (e: unknown) {
      const detalle = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(detalle ?? 'Hubo un error al enviar la solicitud. Intentá de nuevo.');
    } finally {
      setEnviando(false);
    }
  }

  function reiniciar() {
    setTitulo(''); setDetalle(''); setCriticidad('baja');
    setSedeId(''); setSectorId(''); setNombre(''); setDni(''); setTelefono('');
    setBloqueaAtencion(null);
    setEsRemoto(null);
    setRustdeskId('');
    setRustdeskPassword('');
    setTareaIdCreada(null);
    setEnviado(false); setError('');
    setMostrarBuscarSeguimiento(false);
    setIdBuscarSeguimiento('');
    setDniBuscarSeguimiento('');
    setIdSeguimientoActivo(null);
    setDniSeguimientoActivo('');
  }

  function buscarSeguimiento() {
    const id = parseInt(idBuscarSeguimiento, 10);
    const dniLimpio = dniBuscarSeguimiento.replace(/\D/g, '');
    if (Number.isNaN(id) || id < 1) {
      setError('Ingresá un número de solicitud válido.');
      return;
    }
    if (dniLimpio.length < 7 || dniLimpio.length > 8) {
      setError('Ingresá el DNI con el que cargaste la solicitud (7 u 8 dígitos).');
      return;
    }
    setError('');
    setIdSeguimientoActivo(id);
    setDniSeguimientoActivo(dniLimpio);
  }

  if (enviado) {
    return (
      <div className="sp-fondo">
        <div className="sp-caja sp-caja--exito sp-caja--con-valoracion">
          <div className="sp-exito-icono">✓</div>
          <h1 className="sp-exito-titulo">¡Solicitud enviada!</h1>
          {tareaIdCreada !== null && (
            <p className="sp-exito-numero">
              Tu número de solicitud es el <strong>#{tareaIdCreada}</strong>
            </p>
          )}
          <p className="sp-exito-texto">
            El equipo de informática recibió tu solicitud y la va a atender a la brevedad.
            Guardá este número y tu DNI para consultar el estado cuando quieras.
          </p>

          {tareaIdCreada !== null && (
            <ValoracionSolicitud solicitudId={tareaIdCreada} dni={dni} />
          )}

          <button className="sp-btn sp-btn--secundario" onClick={reiniciar}>
            Enviar otra solicitud
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="sp-fondo">
      <div className="sp-caja">
        <div className="sp-encabezado">
          <img src={logoSiglas} alt="IPS" className="sp-logo-img" />
          <div>
            <h1 className="sp-titulo">Solicitud de soporte</h1>
            <p className="sp-subtitulo">Sistemas — IPS Misiones</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="sp-formulario">

          {/* Descripción */}
          <div className="sp-campo">
            <label className="sp-etiqueta" htmlFor="sp-titulo">
              ¿Qué necesitás? <span className="sp-requerido">*</span>
            </label>
            <input
              id="sp-titulo"
              className="sp-input"
              type="text"
              placeholder="Ej: La impresora del piso 2 no imprime"
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
              maxLength={255}
              required
            />
          </div>

          {/* Sede */}
          <div className="sp-campo">
            <label className="sp-etiqueta" htmlFor="sp-sede">
              Sede <span className="sp-requerido">*</span>
            </label>
            <Selector
              id="sp-sede"
              value={sedeId}
              onChange={e => setSedeId(e.target.value)}
              required
              opciones={[
                { valor: '', etiqueta: 'Seleccioná tu sede' },
                ...sedes.map(s => ({ valor: s.id, etiqueta: s.nombre }))
              ]}
            />
          </div>

          {/* Sector / área */}
          <div className="sp-campo">
            <label className="sp-etiqueta" htmlFor="sp-sector">
              Área de soporte <span className="sp-requerido">*</span>
            </label>
            <Selector
              id="sp-sector"
              value={sectorId}
              onChange={e => setSectorId(e.target.value)}
              required
              opciones={[
                { valor: '', etiqueta: 'Seleccioná el equipo que debe atender' },
                ...sectores.map(s => ({ valor: s.id, etiqueta: s.nombre }))
              ]}
            />
          </div>

          {/* Bloqueo atención al público */}
          <div className="sp-campo">
            <label className="sp-etiqueta">
              ¿Este problema imposibilita la atención al público? <span className="sp-requerido">*</span>
            </label>
            <div className="sp-bloqueo-opciones">
              <label className={`sp-bloqueo-opcion ${bloqueaAtencion === true ? 'sp-bloqueo-opcion--activa sp-bloqueo-opcion--si' : ''}`}>
                <input
                  type="radio"
                  name="bloqueaAtencion"
                  className="sp-radio-oculto"
                  checked={bloqueaAtencion === true}
                  onChange={() => { setBloqueaAtencion(true); setCriticidad('alta'); }}
                />
                Sí
              </label>
              <label className={`sp-bloqueo-opcion ${bloqueaAtencion === false ? 'sp-bloqueo-opcion--activa sp-bloqueo-opcion--no' : ''}`}>
                <input
                  type="radio"
                  name="bloqueaAtencion"
                  className="sp-radio-oculto"
                  checked={bloqueaAtencion === false}
                  onChange={() => setBloqueaAtencion(false)}
                />
                No
              </label>
            </div>
          </div>

          {/* Criticidad */}
          <div className="sp-campo">
            <label className="sp-etiqueta">
              Urgencia <span className="sp-requerido">*</span>
            </label>
            <div className="sp-criticidad-opciones">
              {(['baja', 'media', 'alta'] as Criticidad[]).map(c => (
                <label
                  key={c}
                  className={`sp-criticidad-opcion sp-criticidad-opcion--${c} ${criticidad === c ? 'sp-criticidad-opcion--activa' : ''}`}
                >
                  <input
                    type="radio"
                    name="criticidad"
                    value={c}
                    checked={criticidad === c}
                    onChange={() => setCriticidad(c)}
                    className="sp-radio-oculto"
                  />
                  <span className="sp-criticidad-label">{CRITICIDAD_LABELS[c]}</span>
                  <span className="sp-criticidad-desc">{CRITICIDAD_DESC[c]}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Nombre, DNI y teléfono */}
          <div className="sp-fila">
            <div className="sp-campo">
              <label className="sp-etiqueta" htmlFor="sp-nombre">
                Nombre <span className="sp-requerido">*</span>
              </label>
              <input
                id="sp-nombre"
                className="sp-input"
                type="text"
                placeholder="Tu nombre"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                required
              />
            </div>
            <div className="sp-campo">
              <label className="sp-etiqueta" htmlFor="sp-dni">
                DNI <span className="sp-requerido">*</span>
              </label>
              <input
                id="sp-dni"
                className="sp-input"
                type="text"
                inputMode="numeric"
                placeholder="Sin puntos"
                value={dni}
                onChange={e => setDni(e.target.value.replace(/\D/g, '').slice(0, 8))}
                required
              />
            </div>
          </div>
          <div className="sp-campo">
            <label className="sp-etiqueta" htmlFor="sp-telefono">
              Teléfono <span className="sp-requerido">*</span>
            </label>
            <input
              id="sp-telefono"
              className="sp-input"
              type="tel"
              placeholder="Número o interno"
              value={telefono}
              onChange={e => setTelefono(e.target.value)}
              required
            />
          </div>

          {/* Asistencia Remota (RustDesk) */}
          <div className="sp-campo">
            <label className="sp-etiqueta">
              ¿Tu problema puedo solucionarlo de forma remota? <span className="sp-requerido">*</span> <span className="sp-opcional">(Requiere RustDesk)</span>
            </label>
            <div className="sp-bloqueo-opciones">
              <label className={`sp-bloqueo-opcion ${esRemoto === true ? 'sp-bloqueo-opcion--activa sp-bloqueo-opcion--no' : ''}`}>
                <input
                  type="radio"
                  name="esRemoto"
                  className="sp-radio-oculto"
                  checked={esRemoto === true}
                  onChange={() => setEsRemoto(true)}
                />
                Sí
              </label>
              <label className={`sp-bloqueo-opcion ${esRemoto === false ? 'sp-bloqueo-opcion--activa sp-bloqueo-opcion--si' : ''}`}>
                <input
                  type="radio"
                  name="esRemoto"
                  className="sp-radio-oculto"
                  checked={esRemoto === false}
                  onChange={() => setEsRemoto(false)}
                />
                No
              </label>
            </div>
          </div>

          {esRemoto === true && (
            <div className="sp-caja-remoto animate-fade-in">
              <p className="sp-remoto-instrucciones">
                Por favor, ingresá las credenciales de <strong>RustDesk</strong> para que podamos conectarnos a tu equipo.
              </p>
              <div className="sp-fila">
                <div className="sp-campo">
                  <label className="sp-etiqueta" htmlFor="sp-rustdesk-id">
                    ID de RustDesk <span className="sp-requerido">*</span>
                  </label>
                  <input
                    id="sp-rustdesk-id"
                    className="sp-input"
                    type="text"
                    placeholder="Ej: 1 234 567 890"
                    value={rustdeskId}
                    onChange={e => setRustdeskId(e.target.value)}
                    required
                  />
                </div>
                <div className="sp-campo">
                  <label className="sp-etiqueta" htmlFor="sp-rustdesk-pwd">
                    Contraseña <span className="sp-requerido">*</span>
                  </label>
                  <input
                    id="sp-rustdesk-pwd"
                    className="sp-input"
                    type="text"
                    placeholder="Contraseña de RustDesk"
                    value={rustdeskPassword}
                    onChange={e => setRustdeskPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Detalle */}
          <div className="sp-campo">
            <label className="sp-etiqueta" htmlFor="sp-detalle">
              Detalle adicional <span className="sp-requerido">*</span>
            </label>
            <textarea
              id="sp-detalle"
              className="sp-textarea"
              placeholder="Describí el problema con más detalle, errores que aparecen, etc."
              value={detalle}
              onChange={e => setDetalle(e.target.value)}
              rows={4}
              required
            />
          </div>

          {error && <p className="sp-error">{error}</p>}

          <button type="submit" className="sp-btn sp-btn--primario" disabled={enviando}>
            {enviando ? 'Enviando...' : 'Enviar solicitud'}
          </button>

          <div className="sp-valoracion-buscar">
            <button
              type="button"
              className="sp-valoracion-buscar__toggle"
              onClick={() => {
                setMostrarBuscarSeguimiento(v => !v);
                setIdSeguimientoActivo(null);
                setDniSeguimientoActivo('');
                setError('');
              }}
            >
              {mostrarBuscarSeguimiento
                ? 'Ocultar seguimiento'
                : 'Consultá el estado de tu solicitud'}
            </button>

            {mostrarBuscarSeguimiento && (
              <div className="sp-valoracion-buscar__form">
                <div className="sp-valoracion-buscar__fila">
                  <div className="sp-campo">
                    <label className="sp-etiqueta" htmlFor="sp-buscar-id">
                      Número de solicitud
                    </label>
                    <input
                      id="sp-buscar-id"
                      className="sp-input"
                      type="number"
                      min={1}
                      placeholder="Ej: 165"
                      value={idBuscarSeguimiento}
                      onChange={e => setIdBuscarSeguimiento(e.target.value)}
                    />
                  </div>
                  <div className="sp-campo">
                    <label className="sp-etiqueta" htmlFor="sp-buscar-dni">
                      DNI
                    </label>
                    <input
                      id="sp-buscar-dni"
                      className="sp-input"
                      type="text"
                      inputMode="numeric"
                      placeholder="Sin puntos"
                      value={dniBuscarSeguimiento}
                      onChange={e => setDniBuscarSeguimiento(e.target.value.replace(/\D/g, '').slice(0, 8))}
                    />
                  </div>
                  <button type="button" className="sp-btn sp-btn--secundario" onClick={buscarSeguimiento}>
                    Buscar
                  </button>
                </div>
                {idSeguimientoActivo !== null && dniSeguimientoActivo && (
                  <ValoracionSolicitud
                    solicitudId={idSeguimientoActivo}
                    dni={dniSeguimientoActivo}
                    compacto
                  />
                )}
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
