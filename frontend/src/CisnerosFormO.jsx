import { useCisnerosForm } from './hooks/useCisnerosFormO';
import { Questionnaire } from './components/Questionnaire';
import { EvaluationResults } from './components/EvaluationResults';
import { questions } from './constants/questions';

const CisnerosFormO = () => {
  const {
    answers,
    result,
    loading,
    autorAcoso,
    anonimo,
    handleAnonimo,
    handleAutorAcosoChange,
    handleAnswer,
    handleSubmit,
    resetForm
  } = useCisnerosForm();

  if (result) {
    return (
      <div className="container">
        <EvaluationResults result={result} onReset={resetForm} />
      </div>
    );
  }

  return (
    <div className="container">
      <div className="glass-card" style={{ maxWidth: '800px', margin: '0 auto' }}>

        <div
          className="form-group anonimos-row"
          style={{ marginBottom: '1.5rem' }}
        >
          <label htmlFor="anonimos" className="anonimos-label">
            ¿Mantener datos anónimos?
          </label>
          <input
            type="checkbox"
            id="anonimos"
            name="anonimo"
            checked={anonimo}
            onChange={handleAnonimo}
            className="anonimos-check"
          />
        </div>

        <Questionnaire
          questions={questions}
          answers={answers}
          onAnswer={handleAnswer}
          onSubmit={handleSubmit}
          loading={loading}
        />
      </div>
    </div>
  );
};

export default CisnerosFormO;