import { useEffect, useRef, useState } from 'react';
import { Download, FileSpreadsheet, FileText, FileType } from 'lucide-react';
import type { FormatoExportacion, OpcionesExportacion } from '../../utilidades/exportarDatos';
import './MenuExportar.css';

interface Props {
  opciones: OpcionesExportacion;
  deshabilitado?: boolean;
  alExportarTodos?: () => Promise<Record<string, unknown>[]>;
}

const FORMATOS: { id: FormatoExportacion; etiqueta: string; icono: typeof FileSpreadsheet }[] = [
  { id: 'excel', etiqueta: 'Excel (.xlsx)', icono: FileSpreadsheet },
  { id: 'pdf', etiqueta: 'PDF', icono: FileText },
  { id: 'word', etiqueta: 'Word (.docx)', icono: FileType },
];

export default function MenuExportar({ opciones, deshabilitado = false, alExportarTodos }: Props) {
  const [abierto, setAbierto] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [error, setError] = useState('');
  const contenedorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function cerrarAlClickFuera(evento: MouseEvent) {
      if (contenedorRef.current && !contenedorRef.current.contains(evento.target as Node)) {
        setAbierto(false);
      }
    }
    if (abierto) {
      document.addEventListener('mousedown', cerrarAlClickFuera);
    }
    return () => document.removeEventListener('mousedown', cerrarAlClickFuera);
  }, [abierto]);

  async function manejarExportar(formato: FormatoExportacion, todos = false) {
    setExportando(true);
    setError('');
    setAbierto(false);
    try {
      let filas = opciones.filas;
      if (todos && alExportarTodos) {
        filas = await alExportarTodos();
      }
      const { exportarDatos } = await import('../../utilidades/exportarDatos');
      await exportarDatos(formato, { ...opciones, filas });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo exportar');
    } finally {
      setExportando(false);
    }
  }

  const sinDatos = opciones.filas.length === 0;

  return (
    <div className="menu-exportar" ref={contenedorRef}>
      <button
        type="button"
        className="menu-exportar__boton"
        disabled={deshabilitado || exportando || sinDatos}
        onClick={() => setAbierto((v) => !v)}
      >
        <Download size={16} />
        {exportando ? 'Exportando...' : 'Exportar'}
      </button>

      {abierto && (
        <div className="menu-exportar__dropdown">
          {FORMATOS.map(({ id, etiqueta, icono: Icono }) => (
            <button
              key={id}
              type="button"
              className="menu-exportar__opcion"
              onClick={() => manejarExportar(id, false)}
            >
              <Icono size={16} />
              {etiqueta}
              <span className="menu-exportar__opcion-detalle">vista actual</span>
            </button>
          ))}
          {alExportarTodos && (
            <>
              <div className="menu-exportar__separador" />
              {FORMATOS.map(({ id, etiqueta, icono: Icono }) => (
                <button
                  key={`${id}-todos`}
                  type="button"
                  className="menu-exportar__opcion menu-exportar__opcion--todos"
                  onClick={() => manejarExportar(id, true)}
                >
                  <Icono size={16} />
                  {etiqueta}
                  <span className="menu-exportar__opcion-detalle">todos los registros</span>
                </button>
              ))}
            </>
          )}
        </div>
      )}

      {error && <span className="menu-exportar__error">{error}</span>}
    </div>
  );
}
