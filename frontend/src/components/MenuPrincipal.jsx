import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ClipboardList, Settings, ShieldCheck, LogOut, Calendar } from 'lucide-react';
import AvisoPrivacidadModal from './AvisoPrivacidadModal';
import { useAvisoPrivacidad } from '../hooks/useAvisoPrivacidad';
import API_BASE_URL from '../constants/api';

const MenuPrincipal = ({ user, onLogout, onPrivacyAccepted }) => {
  const navigate = useNavigate();
  const [activeStage, setActiveStage] = useState(null);
  const [checkingStage, setCheckingStage] = useState(false);

  const { isOpen, accepted, shouldShowModal, openModal, closeModal, accept, setAccepted } =
    useAvisoPrivacidad(user?.role);

  const isPrivileged = user?.role === 'admin' || user?.role === 'superadmin';

  useEffect(() => {
    if (isPrivileged) return;
    const fetchActiveStage = async () => {
      setCheckingStage(true);
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_BASE_URL}/api/stages/active`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (res.data?.active) {
          setActiveStage(res.data.stage);
        } else {
          setActiveStage(null);
        }
      } catch (err) {
        console.error('Error verificando etapa activa:', err);
      } finally {
        setCheckingStage(false);
      }
    };
    fetchActiveStage();
  }, [isPrivileged]);

  const handleStartQuestionnaire = () => {
    if (user?.role === 'superadmin') {
      navigate('/superadmin');
      return;
    }
    if (user?.role === 'admin') {
      navigate('/admin');
      return;
    }

    if (!activeStage) {
      alert('Actualmente no hay una etapa de cuestionario habilitada para la fecha actual.');
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
          <div style={{ marginBottom: '2rem' }}>
            <h1>Bienvenido</h1>
            <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>
              Esta plataforma es para identificar factores laborales que podrían afectan tu bienestar.
              Tu participación nos ayuda a prevenir riesgos psicosociales y
              construir un entorno de trabajo más seguro y saludable.
            </p>
          </div>

          {!isPrivileged && !checkingStage && (
            <div
              style={{
                marginBottom: '1.5rem',
                padding: '0.85rem 1rem',
                borderRadius: '0.75rem',
                border: `1px solid ${activeStage ? 'rgba(16, 185, 129, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`,
                background: activeStage ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                fontSize: '0.9rem'
              }}
            >
              <Calendar size={18} color={activeStage ? 'var(--success-color)' : 'var(--warning-color)'} />
              {activeStage ? (
                <span>
                  <strong>{activeStage.instrument_name}</strong> habilitado del{' '}
                  <strong>{activeStage.start_date}</strong> al <strong>{activeStage.end_date}</strong>
                </span>
              ) : (
                <span>No hay un periodo de evaluación activo en la fecha actual.</span>
              )}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: user?.role === 'superadmin' ? '1fr 1fr' : '1fr', gap: '1.5rem', marginBottom: '2rem', justifyItems: 'center' }}>
            {!isPrivileged && (
              <button
                onClick={handleStartQuestionnaire}
                disabled={checkingStage || !activeStage}
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
                  maxWidth: '260px',
                  opacity: checkingStage || !activeStage ? 0.55 : 1,
                  cursor: checkingStage || !activeStage ? 'not-allowed' : 'pointer'
                }}
              >
                <ClipboardList size={48} style={{ marginBottom: '1rem' }} />
                <span>Responder Cuestionario</span>
              </button>
            )}

            {user?.role === 'superadmin' && (
              <button
                onClick={() => navigate('/superadmin')}
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
                <ShieldCheck size={48} style={{ marginBottom: '1rem' }} />
                <span>Panel Superadministrador</span>
              </button>
            )}

            {isPrivileged && (
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
