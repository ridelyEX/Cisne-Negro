import { useState } from 'react';
import axios from 'axios';
import { questions } from '../constants/questions';

const CisnerosForm = () => {
/*
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState({
    nombres: '',
    curp: '',
    apellido_p: '',
    apellido_m: '',
    dependencia: '',
    coordinacion: '',
    departamento: '',
    puesto: '',
    cargo: '',
    autor_acoso: 'No aplica'
  });
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleProfileChange = (e) => {
    const{name, value, tagName} = e.target;

    if (tagName === 'SELECT') {
        setProfile((prev) => ({
            ...prev,
            [name]: value
        }));
        return;
    }

    const maxAttr = e.target.maxLength;
    const max = (typeof maxAttr === 'number' && maxAttr > 0) ? maxAttr: undefined;

    let sanitized = value.toUpperCase();

    if (name === 'nombres' || name === 'apellido_p' || name === 'apellido_m' || name === 'cargo') {
        sanitized = sanitized.replace(/[^A-ZÀ-ÖØ-Ý\s']/g, ''); // permite letras, acentos y espacios y apóstrofo
    }

    const finalValue = max ? sanitized.slice(0, max) : sanitized;

    setProfile((prev) => ({...prev, [name]: finalValue}));
  };

  const validateProfile = () => {
    const newErrors = {};

    if (!(profile.nombres ?? '').trim()) newErrors.nombres = 'El nombre es obligatorio';
    if (!(profile.apellido_p ?? '').trim()) newErrors.apellido_p = 'El apellido paterno es obligatorio';
    if (!(profile.apellido_m ?? '').trim()) newErrors.apellido_m = 'El apellido materno es obligatorio';
    if (!(profile.curp ?? '').trim()) newErrors.curp = 'La CURP es obligatoria';
    if ((profile.curp ?? '').trim().length !== 18) newErrors.curp = 'La CURP debe tener 18 caracteres';
    if (!(profile.dependencia ?? "").trim()) newErrors.dependencia = 'Selecciona una dependencia';
    if (!(profile.coordinacion ?? "").trim()) newErrors.coordinacion = 'Selecciona una coordinación';
    if (!(profile.departamento ?? "").trim()) newErrors.departamento = 'Selecciona un departamento';
    if (!(profile.puesto ?? "").trim()) newErrors.puesto = 'Selecciona un puesto';
    if (!(profile.cargo ?? '').trim()) newErrors.cargo = 'El cargo es obligatorio';

    return newErrors;
  };

  const handleNext = () => {
    const validationErrors = validateProfile();
    if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        alert("Completa los campos antes de continuar")
        return;
    }

    setErrors({});
    setStep(2);
  };

  const handleAnswer = (questionId, value) => {
    setAnswers({ ...answers, [`q${questionId}`]: value });
  };

  const validateAnswers = () => {
    const missing = [];

    for (let i = 1; i <= 43 ; i++) {
        if (answers[`q${i}`] === undefined)
            missing.push(`q${i}`);
    }

    return missing;
  };

  const handleSubmit = async () => {
    const missingAnswers = validateAnswers();
    if (missingAnswers.length > 0) {
        alert("Debes responder las 43 preguntas");
        return;
    }

    if (!profile.curp || profile.curp.length !== 18) {
        alert("La CURP debe tener 18 caracteres");
        return;
    }

    const profileErrors = validateProfile();
    if (Object.keys(profileErrors).length > 0) {
        setErrors(profileErrors);
        alert("Todos los campos son obligatorios");
        return;
    }

    setLoading(true);
    try {
      const response = await axios.post('http://10.218.32.138:5000/api/submit', {
        ...profile,
        answers
      });
      setResult(response.data.results);
    } catch (error) {
      alert("Error al enviar evaluación");
    } finally {
      setLoading(false);
    }
  };
*/
  if (result) {
    return (
      <div className="container">
        <div className="glass-card" style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
          <h2>Resultados de Evaluación</h2>
          <div style={{ margin: '2rem 0', padding: '2rem', background: 'rgba(0,0,0,0.2)', borderRadius: '1rem' }}>
            <h3 style={{ fontSize: '2rem', color: 'var(--primary-color)', marginBottom: '1rem' }}>{result.risk_level}</h3>
            <p style={{ fontSize: '1.25rem' }}>IMAP: <strong>{result.imap}</strong></p>
            <p style={{ fontSize: '1.25rem' }}>IGAP: <strong>{result.igap}</strong></p>
            <p style={{ fontSize: '1.25rem' }}>NEAP: <strong>{result.neap}</strong></p>
          </div>
          <button className="btn" onClick={() => window.location.reload()}>Finalizar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="glass-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        {step === 1 && (
          <div>
            <h2>Datos Demográficos</h2>
            <div className="form-group">
              <label>CURP</label>
              <input type="text" name="curp" value={profile.curp} onChange={handleProfileChange} maxLength={18} style={{ textTransform: 'uppercase' }} required />
              {errors.curp && <small className="error-text">{errors.curp}</small>}
             </div>
            <div className="form-group">
              <label>Apellido Paterno</label>
              <input type="text" name="apellido_p" value={profile.apellido_p} onChange={handleProfileChange} maxLength={40} required />
              {errors.apellido_p && <small className="error-text">{errors.apellido_p}</small>}
            </div>
            <div className="form-group">
              <label>Apellido Materno</label>
              <input type="text" name="apellido_m" value={profile.apellido_m} onChange={handleProfileChange} maxLength={40} required />
              {errors.apellido_m && <small className="error-text">{errors.apellido_m}</small>}
            </div>
            <div className="form-group">
              <label>Nombre(s)</label>
              <input type="text" name="nombres" value={profile.nombres} onChange={handleProfileChange} maxLength={60} required />
              {errors.nombres && <small className="error-text">{errors.nombres}</small>}
            </div>
            <div className="form-group">
              <label>Dependencia</label>
              <select name="dependencia" value={profile.dependencia} onChange={handleProfileChange}>
                  <option value="">--- Seleccione una opción ---</option>
                  <option value="Dirección de Obras Públicas">Dirección de Obras Públicas</option>
              </select>
              {errors.dependencia && <small className="error-text">{errors.dependencia}</small>}
            </div>
            <div className="form-group">
              <label>Coordinación/Subdirección</label>
              <select name="coordinacion" value={profile.coordinacion} onChange={handleProfileChange}>
                  <option value="">--- Seleccione una opción ---</option>
                  <option value="Coordinación de Gestión Integral, Evaluación y Modernización">Coordinación de Gestión Integral, Evaluación y Modernización</option>
                  <option value="Coordinación de Vinculación Social">Coordinación de Vinculación Social</option>
                  <option value="Coordinación Administrativa">Coordinación Administrativa</option>
                  <option value="Coordinación Jurídica">Coordinación Jurídica</option>
                  <option value="Subdirección de Infraestructura">Subdirección de Infraestructura</option>
                  <option value="Subdirección de Estudios y Proyectos">Subdirección de Estudios y Proyectos</option>
                  <option value="Despacho del director de obras públicas">Despacho del director de obras públicas</option>
              </select>
              {errors.coordinacion && <small className="error-text">{errors.coordinacion}</small>}
            </div>
            <div className="form-group">
              <label>Departamentos</label>
              <select name="departamento" value={profile.departamento} onChange={handleProfileChange}>
                  <option value="">--- Seleccione una opción ---</option>
                  <option value="Despacho del Coordinación de Gestión Integral, Evaluación y Modernización">Despacho del Coordinación de Gestión Integral, Evaluación y Modernización</option>
                  <option value="Depto. de Gestión Integral y Modernización">Depto. de Gestión Integral y Modernización</option>
                  <option value="Despacho del Coordinador de Vinculación Social">Despacho del Coordinador de Vinculación Social</option>
                  <option value="Depto. De Mantenimiento Vial">Depto. De Mantenimiento Vial</option>
                  <option value="Depto. De Maquinaria Pesada">Depto. De Maquinaria Pesada</option>
                  <option value="Depto. De Enlace Social">Depto. De Enlace Social</option>
                  <option value="Despacho del Coordinador Administrativo">Despacho del Coordinador Administrativo</option>
                  <option value="Depto. De Inversión">Depto. De Inversión</option>
                  <option value="Despacho del Coordinador Jurídico">Despacho del Coordinador Jurídico</option>
                  <option value="Depto. De Contratos y Comité de Obra">Depto. De Contratos y Comité de Obra</option>
                  <option value="Depto. De Auditoría, Transparencia y Archivo">Depto. De Auditoría, Transparencia y Archivo</option>
                  <option value="Despacho del Subdirector de Infraestructura">Despacho del Subdirector de Infraestructura</option>
                  <option value="Depto. De Construcción">Depto. De Construcción</option>
                  <option value="Depto. De Administración de Obra">Depto. De Administración de Obra</option>
                  <option value="Despacho del Subdirector de Estudios y Proyectos">Despacho del Subdirector de Estudios y Proyectos</option>
                  <option value="Depto. De Topografía">Depto. De Topografía</option>
                  <option value="Depto. De Estudios y Proyectos Urbanos">Depto. De Estudios y Proyectos Urbanos</option>
                  <option value="Depto. De Estudios y Proyectos Sociales">Depto. De Estudios y Proyectos Sociales</option>
                  <option value="Depto. De Costos e Integración de Expedientes">Depto. De Costos e Integración de Expedientes</option>
                  <option value="Secretaría Técnica">Secretaría Técnica</option>
              </select>
              {errors.departamento && <small className="error-text">{errors.departamento}</small>}
            </div>
            <div className="form-group">
              <label>Puesto</label>
              <select name="puesto" value={profile.puesto} onChange={handleProfileChange}>
                  <option value="">--- Seleccione una opción ---</option>
                  <option value="Asesor A">Asesor A</option>
                  <option value="Auxiliar">Auxiliar</option>
                  <option value="Auxiliar especializado">Auxiliar especializado</option>
                  <option value="Capturista de datos">Capturista de datos</option>
                  <option value="Chofer recolector de aseo urbano">Chofer recolector de aseo urbano</option>
                  <option value="Consultor jurídico">Consultor jurídico</option>
                  <option value="Director general">Director general</option>
                  <option value="Jefe de departamento">Jefe de departamento</option>
                  <option value="Jefe de división">Jefe de división</option>
                  <option value="Jefe de oficina">Jefe de oficina</option>
                  <option value="Líder de proyecto">Líder de proyecto</option>
                  <option value="Mecánico">Mecánico</option>
                  <option value="Operador de servicio 6">Operador de servicio 6</option>
                  <option value="Personal especializado">Personal especializado</option>
                  <option value="Residente de obra">Residente de obra</option>
                  <option value="Subdirector">Subdirector</option>
                  <option value="Supervisor de obra">Supervisor de obra</option>
                  <option value="Supervisor de servicios">Supervisor de servicios</option>
                  <option value="Técnico especializado administrativo">Técnico especializado administrativo</option>
                  <option value="Técnico servicios y operaciones">Técnico servicios y operaciones</option>
                  <option value="Técnico vigilante">Técnico vigilante</option>
              </select>
              {errors.puesto && <small className="error-text">{errors.puesto}</small>}
            </div>
          <div className="form-group">
              <label>Cargo</label>
              <input type="text" name="cargo" value={profile.cargo} onChange={handleProfileChange} />
              {errors.cargo && <small className="error-text">{errors.cargo}</small>}
          </div>
            <div className="form-group">
              <label>¿Quiénes son el/los autores de los hostigamientos recibidos?</label>
              <select name="autor_acoso" value={profile.autor_acoso} onChange={handleProfileChange}>
                <option value="No aplica">No aplica</option>
                <option value="Jefes o Supervisores">Jefes o Supervisores</option>
                <option value="Compañeros de trabajo">Compañeros de trabajo</option>
                <option value="Subordinados">Subordinados</option>
              </select>
              {errors.autor_acoso && <small className="error-text">{errors.autor_acoso}</small>}
            </div>
            <button className="btn" onClick={handleNext}>Siguiente: Cuestionario</button>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2>Cuestionario Escala Cisneros</h2>
            <p style={{ marginBottom: '2rem' }}>Señale el grado de frecuencia con que se producen estos hostigamientos. (0 = Nunca, 6 = Todos los días)</p>
            
            {questions.map((q) => (
              <div key={q.id} className="question-card">
                <p style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1rem' }}>
                  {q.id}. {q.text}
                </p>
                <div className="scale-options">
                  {[0, 1, 2, 3, 4, 5, 6].map((val) => (
                    <div 
                      key={val}
                      className={`scale-btn ${answers[`q${q.id}`] === val ? 'selected' : ''}`}
                      onClick={() => handleAnswer(q.id, val)}
                    >
                      {val}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn" style={{ background: 'transparent', border: '1px solid var(--border-color)' }} onClick={() => setStep(1)}>Volver</button>
              <button 
                className="btn" 
                onClick={handleSubmit} 
                disabled={loading || Object.keys(answers).length < 43}
              >
                {loading ? 'Calculando...' : 'Enviar Evaluación'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default CisnerosForm;
