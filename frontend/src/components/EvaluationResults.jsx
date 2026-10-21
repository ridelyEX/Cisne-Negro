export const EvaluationResults = ({ result, onReset }) => (
  <div className="glass-card" style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
    <h2>Instrumento finalizado</h2>
    <div style={{ margin: '2rem 0', padding: '2rem', background: 'rgba(0,0,0,0.2)', borderRadius: '1rem' }}>
      <h3>¡Gracias por contestar!</h3>
    </div>
    <button className="btn" onClick={onReset}>Finalizar</button>
  </div>
);