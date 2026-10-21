import { QuestionItem } from './QuestionItems';

export const Questionnaire = ({ questions, answers, onAnswer, onBack, onSubmit, loading }) => {
  const isComplete = Object.keys(answers).filter((key) => answers[key] !== undefined).length === 43;

  return (
    <div>
      <h2>Cuestionario Escala Cisneros</h2>
      <p style={{ marginBottom: '2rem' }}>
        Señale el grado de frecuencia con que se producen estas situaciones.
        (0 = Nunca, 6 = Todos los días)
      </p>

      {questions.map((q) => (
        <QuestionItem
          key={q.id}
          question={q}
          selectedValue={answers[`q${q.id}`]}
          onSelect={onAnswer}
        />
      ))}

      <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
        {onBack && (
          <button
            className="btn"
            style={{ background: 'transparent', border: '1px solid var(--border-color)' }}
            onClick={onBack}
            type="button"
          >
            Volver
          </button>
        )}
        <button className="btn" onClick={onSubmit} disabled={loading || !isComplete} type="button">
          {loading ? 'Calculando...' : 'Enviar Evaluación'}
        </button>
      </div>
    </div>
  );
};