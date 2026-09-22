export const EvaluationResults = ({ result, onReset }) => (
  <div className="glass-card" style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
    <h2>Resultados de Evaluación</h2>
    <div style={{ margin: '2rem 0', padding: '2rem', background: 'rgba(0,0,0,0.2)', borderRadius: '1rem' }}>
      <h3 style={{ fontSize: '2rem', color: 'var(--primary-color)', marginBottom: '1rem' }}>{result.risk_level}</h3>
      <p style={{ fontSize: '1.25rem' }}>IMAP: <strong>{result.imap}</strong></p>
      <p style={{ fontSize: '1.25rem' }}>IGAP: <strong>{result.igap}</strong></p>
      <p style={{ fontSize: '1.25rem' }}>NEAP: <strong>{result.neap}</strong></p>
    </div>
    <button className="btn" onClick={onReset}>Finalizar</button>
  </div>
);