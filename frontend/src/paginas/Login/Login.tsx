import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contextos/ContextoAuth';
import { login } from '../../servicios/autenticacion';
import CampoTexto from '../../componentes/CampoTexto/CampoTexto';
import Boton from '../../componentes/Boton/Boton';
import logoNombre from '../../assets/logo-nombre.svg';
import './Login.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const { iniciarSesion } = useAuth();
  const navegar = useNavigate();

  async function manejarEnvio(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      const { token, usuario } = await login(email, password);
      iniciarSesion(token, usuario);
      const tieneSectores = (usuario.sectores && usuario.sectores.length > 0) || usuario.ver_todos;

      if (usuario.rol === 'admin') {
        navegar('/admin');
      } else if (!usuario.seleccion_completada && !tieneSectores) {
        navegar('/seleccion-sector');
      } else {
        navegar('/tablero');
      }
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 401) {
        setError('Email o contraseña incorrectos');
      } else if (!status) {
        setError('No se pudo conectar con el servidor. Verificá que el backend esté activo.');
      } else {
        setError('Error del servidor al iniciar sesión. Contactá al administrador.');
      }
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="login">
      <div className="login__tarjeta modern-card animate-fade-in">
        <img src={logoNombre} alt="Logo Scrum IPS" className="login__logo-grande" />
        <h1 className="login__titulo">Scrum Cómputos</h1>
        <p className="login__subtitulo">Sistema interno de gestion de tareas</p>
        <form onSubmit={manejarEnvio} className="login__formulario">
          <CampoTexto
            etiqueta="Email"
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
          <CampoTexto
            etiqueta="Contraseña"
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="login__error">{error}</p>}
          <Boton type="submit" disabled={cargando} className="login__boton">
            {cargando ? 'Ingresando...' : 'Ingresar'}
          </Boton>
        </form>
      </div>
    </div>
  );
}
