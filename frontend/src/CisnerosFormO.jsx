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
        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
          <label>Autor del acoso</label>
          <select value={autorAcoso} onChange={handleAutorAcosoChange}>
            <option value="No aplica">No aplica</option>
            <option value="Jefe inmediato">Jefe inmediato</option>
            <option value="Compañero">Compañero</option>
            <option value="Subordinado">Subordinado</option>
            <option value="Cliente / Usuario">Cliente / Usuario</option>
            <option value="Otro">Otro</option>
          </select>
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