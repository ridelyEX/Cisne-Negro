import { Lock, User } from 'lucide-react';
import { useLoginForm } from '../hooks/useLoginForm';
import { ProfileForm } from './ProfileForm';

const Login = ({ onLogin }) => {
  const {
    mode,
    setMode,
    usernameVal,
    password,
    errors,
    loading,
    profile,
    handleProfileChange,
    handleUsernameChange,
    handlePasswordChange,
    handleLogin,
    handleRegister
  } = useLoginForm(onLogin);

  const onSubmit = (e) => {
    e.preventDefault();

    if (mode === 'login') {
      handleLogin();
    } else {
      handleRegister();
    }
  };

  return (
    <div
      className="container"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '80vh'
      }}
    >
      <div className="glass-card" style={{ maxWidth: '720px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2>{mode === 'login' ? 'Iniciar Sesión' : 'Registrar nuevo usuario'}</h2>
          <p>
            {mode === 'login'
              ? 'Ingresa tus credenciales para continuar'
              : 'Completa los datos para registrar tu cuenta'}
          </p>
        </div>

        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label>Usuario</label>
            <div style={{ position: 'relative' }}>
              <User
                size={18}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '12px',
                  color: 'var(--text-secondary)'
                }}
              />
              <input
                type="text"
                value={usernameVal}
                onChange={handleUsernameChange}
                placeholder="Ej. admin o user"
                required
                style={{ paddingLeft: '40px' }}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Contraseña</label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={18}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '12px',
                  color: 'var(--text-secondary)'
                }}
              />
              <input
                type="password"
                value={password}
                onChange={handlePasswordChange}
                placeholder="••••••••"
                required
                style={{ paddingLeft: '40px' }}
              />
            </div>
          </div>

          {mode === 'register' && (
            <div style={{ marginTop: '1.5rem' }}>
              <ProfileForm
                profile={profile}
                errors={{}}
                onChange={handleProfileChange}
                onNext={() => {}}
              />
            </div>
          )}

          {errors && (
            <p className="error-message" style={{ color: 'var(--danger-color)' }}>
              {errors}
            </p>
          )}

          <button
            type="submit"
            className="btn"
            disabled={loading}
            style={{ marginTop: '1rem' }}
          >
            {loading
              ? 'Procesando...'
              : mode === 'login'
                ? 'Entrar al Sistema'
                : 'Registrar y Entrar'}
          </button>
        </form>

        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--primary-color)',
              cursor: 'pointer'
            }}
          >
            {mode === 'login'
              ? '¿No tienes cuenta? Regístrate'
              : '¿Ya tienes cuenta? Inicia sesión'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;