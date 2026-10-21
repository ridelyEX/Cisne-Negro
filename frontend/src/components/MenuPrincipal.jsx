import { useNavigate } from 'react-router-dom';
import { ClipboardList, Settings, LogOut } from 'lucide-react';
import AvisoPrivacidadModal from './AvisoPrivacidadModal';
import { useAvisoPrivacidad } from '../hooks/useAvisoPrivacidad';

const MenuPrincipal = ({ user, onLogout, onPrivacyAccepted }) => {
  const navigate = useNavigate();

  const { isOpen, accepted, shouldShowModal, openModal, closeModal, accept, setAccepted } =
    useAvisoPrivacidad(user?.role);

  const handleStartQuestionnaire = () => {
      if (user?.role === 'admin') {
        navigate('/admin');
        return;
      }

    if (!user?.privacyAccepted) {
        openModal();
        return;
    }

    navigate("/cuestionario");
  };

  const handleAcceptConsent = () => {
    accept();
    if (typeof onPrivacyAccepted === 'function') {
        onPrivacyAccepted();
    }
    navigate("/cuestionario");
  };

  const handleLogout = () => {
    localStorage.removeItem("privacyAccepted");
    onLogout();
    navigate('/login');
  };

  return (
    <>
        {shouldShowModal && (
            <AvisoPrivacidadModal
                isOpen={isOpen}
                accepted={accepted}
                setAccepted={setAccepted}
                onClose={closeModal}
                onAccept={handleAcceptConsent}
            />
        )}

    <div className="container" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="glass-card" style={{ maxWidth: '600px', width: '100%', textAlign: 'center' }}>
        <div style={{ marginBottom: '3rem' }}>
          <h1>Bienvenido</h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>
            Esta plataforma es para identificar factores laborales que podrían afectan tu bienestar.
            Tu participación nos ayuda a prevenir riesgos psicosociales y
            construir un entorno de trabajo más seguro y saludable.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: user.role === 'admin' ? '1fr 1fr': '1fr', gap: '1.5rem', marginBottom: '2rem', justifyItems: 'center' }}>
          {user.role !== 'admin' && (
            <button
              onClick={handleStartQuestionnaire}
              className="btn"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2rem',
                fontSize: '1rem',
                height: '200px',
                width: '100%',
                maxWidth: '260px'
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
  </>
  );
};

export default MenuPrincipal;