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
      alert('Debes responder las 43 preguntas');
      return;
    }

    if (!respondentId) {
      alert('No se encontró respondent_id. Debes crear el usuario antes de enviar el cuestionario.');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/Cuestionario-cisneros`, {
        respondent_id: respondentId,
        autor_acoso: autorAcoso,
        anonimo,
        answers
      });

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