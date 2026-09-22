import { questions } from './questions';
import { useCisnerosForm } from '../hooks/useCisnerosForm';
import { Questionnaire } from './Questionnaire';

const Cisneros = () => {
    const {
        questions, answers, handleAnswer, handleSubmit, loading, result, resetForm
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

export default Cisneros;