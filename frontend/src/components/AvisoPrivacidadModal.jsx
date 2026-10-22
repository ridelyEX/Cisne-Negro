import { X } from 'lucide-react';

const AvisoPrivacidadModal = ({ isOpen, onClose, onAccept, accepted, setAccepted }) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.72)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem'
      }}
    >
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '620px',
          borderRadius: '18px',
          padding: '2rem',
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: '#8aa0b8'
          }}
        >
          <X size={20} />
        </button>

        <h2 style={{ marginBottom: '1rem', fontSize: '1.6rem' }}>
          Consentimiento de tratamiento de datos
        </h2>

        <p style={{ lineHeight: 1.7, color: 'var(--text-secondary)' }}>
          Mediante la aceptación de este aviso, el participante autoriza el tratamiento
          de sus datos personales para la evaluación de factores laborales y la prevención
          de riesgos psicosociales, conforme a la normativa aplicable y con fines estrictamente
          institucionales.
        </p>

        <p style={{ lineHeight: 1.7, color: 'var(--text-secondary)' }}>
          El documento completo puede consultarse en{' '}
          <a
            href="/politica-privacidad.pdf"
            target="_blank"
            rel="noreferrer"
            style={{ color: '#22c55e', textDecoration: 'underline' }}
          >
            Términos y acuerdos de privacidad
          </a>
        </p>

        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            marginTop: '1.5rem',
            marginBottom: '1.5rem',
            fontWeight: 500,
            cursor: 'pointer',
            padding: '0.85rem 1.1rem',
            borderRadius: '12px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
            userSelect: 'none',
            transition: 'background 0.2s ease'
          }}
        >
          <span style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>
            He leído y acepto los términos y acuerdos de privacidad.
          </span>
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            style={{
              width: '1.25rem',
              height: '1.25rem',
              accentColor: '#22c55e',
              cursor: 'pointer',
              flexShrink: 0
            }}
          />
        </label>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button
            type="button"
            className="btn"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)'
            }}
          >
            Cancelar
          </button>

          <button
            type="button"
            className="btn"
            onClick={onAccept}
            disabled={!accepted}
            style={{
              background: '#22c55e',
              color: '#fff',
              opacity: accepted ? 1 : 0.55,
              cursor: accepted ? 'pointer' : 'not-allowed'
            }}
          >
            Acepto
          </button>
        </div>
      </div>
    </div>
  );
};

export default AvisoPrivacidadModal;