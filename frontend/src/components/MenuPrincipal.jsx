import { useNavigate } from 'react-router-dom';
import { ClipboardList, Settings, LogOut } from 'lucide-react';

const MenuPrincipal = ({ user, onLogout }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <div className="container" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="glass-card" style={{ maxWidth: '600px', width: '100%', textAlign: 'center' }}>
        <div style={{ marginBottom: '3rem' }}>
          <h1>Bienvenido</h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>¿Qué deseas hacer?</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
          {user.role !== 'admin' && (
            <button
              onClick={() => navigate('/cuestionario')}
              className="btn"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2rem',
                height: '200px',
                fontSize: '1rem'
              }}
            >
              <ClipboardList size={48} style={{ marginBottom: '1rem' }} />
              <span>Responder Cuestionario</span>
            </button>
          )}

          {user.role === 'admin' && (
            <button
              onClick={() => navigate('/admin')}
              className="btn"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2rem',
                height: '200px',
                fontSize: '1rem'
              }}
            >
              <Settings size={48} style={{ marginBottom: '1rem' }} />
              <span>Panel Administrativo</span>
            </button>
          )}
        </div>

        <button
          onClick={handleLogout}
          style={{
            background: 'transparent',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            width: '100%'
          }}
          className="btn"
        >
          <LogOut size={20} />
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
};

export default MenuPrincipal;