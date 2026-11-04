import { useState } from 'react';
import axios from 'axios';
import API_BASE_URL from '../constants/api';

export const useCisnerosForm = () => {
  const [respondentId] = useState(() => {
    const stored = localStorage.getItem('respondent_id');
    return stored ? Number(stored) : null;
  });

  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [autorAcoso, setAutorAcoso] = useState('No aplica');

  const [anonimo, setAnonimo] = useState(true);

  const handleAutorAcosoChange = (e) => {
    setAutorAcoso(e.target.value);
  };

  const handleAnonimo = (e) => {
    setAnonimo(e.target.checked);
  };

  const handleAnswer = (questionId, value) => {
    setAnswers((prev) => ({
      ...prev,
      [`q${questionId}`]: Number(value)
    }));
  };

  const validateAnswers = () => {
    const missing = [];
    for (let i = 1; i <= 43; i++) {
      if (answers[`q${i}`] === undefined) {
        missing.push(`q${i}`);
      }
    }
    return missing;
  };



  const handleSubmit = async () => {
    const missingAnswers = validateAnswers();

    if (missingAnswers.length > 0) {
      const message =
        missingAnswers.length === 1
            ? `Falta responder la pregunta ${missingAnswers[0]}.`
            : `Faltan responder las preguntas: ${missingAnswers.join(',')}`;

      alert(message);
      return;
    }

    const storedRespondentId = localStorage.getItem('respondent_id');
    const effectiveRespondentId = respondentId ?? (storedRespondentId ? Number(storedRespondentId) : null);

    if (!effectiveRespondentId) {
      alert('No se encontró respondent_id. Debes crear el usuario o iniciar sesión antes de enviar el cuestionario.');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/api/Cuestionario-cisneros`,
        {
          respondent_id: effectiveRespondentId,
          autor_acoso: autorAcoso,
          anonimo,
          answers
        },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        }
      );

      setResult(response.data.results);
    } catch (error) {
      console.error(error.response?.data ?? error);
      alert('Error al enviar evaluación');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    window.location.reload();
  };

  return {
    respondentId,
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
  };
};
