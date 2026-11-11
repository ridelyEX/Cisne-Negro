import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ShieldCheck,
  BarChart3,
  Users,
  FileSpreadsheet,
  CalendarPlus,
  Search,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Activity,
  ClipboardCheck
} from 'lucide-react';
import API_BASE_URL from '../constants/api';

const INSTRUMENT_OPTIONS = [
  'Barómetro de Cisneros',
  'Otro instrumento'
];

const PREDEFINED_DEPENDENCIAS = [
  'Dirección de Obras Públicas'
];

const formatDateShort = (isoDate) => {
  if (!isoDate) return '—';
  const [y, m, d] = isoDate.split('-');
  if (!y || !m || !d) return isoDate;
  const months = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
  ];
  const monthLabel = months[Number(m) - 1] || m;
  return `${Number(d)} ${monthLabel} ${y}`;
};

const getRiskBadgeClass = (riskLevel) => {
  if (riskLevel === 'Leve o inexistente') return 'badge badge-success';
  if (riskLevel === 'Medio') return 'badge badge-warning';
  if (riskLevel === 'Grave a muy grave') return 'badge badge-danger';
  return 'badge badge-neutral';
};

/**
 * Calcula el nivel de peligro, colorimetría (verde=leve, amarillo=medio, rojo=grave)
 * y el porcentaje de llenado de la barra de medida para IMAP e IGAP.
 */
const getIndicatorGauge = (type, rawValue) => {
  const val = Math.max(0, Number(rawValue) || 0);
  // Umbrales basados en el Barómetro de Cisneros (escala 0 a 6)
  // IMAP: < 1.80 Leve (verde), 1.80 - 2.79 Medio (amarillo), >= 2.80 Grave (rojo)
  // IGAP: < 0.60 Leve (verde), 0.60 - 1.22 Medio (amarillo), >= 1.23 Grave (rojo)
  const thresholds =
    type === 'imap'
      ? { medio: 1.8, grave: 2.8, max: 6.0 }
      : { medio: 0.6, grave: 1.23, max: 6.0 };

  let level = 'Leve';
  let color = 'var(--success-color)';
  let badgeClass = 'badge badge-success';
  let percentage = 0;

  if (val < thresholds.medio) {
    level = 'Leve';
    color = 'var(--success-color)';
    badgeClass = 'badge badge-success';
    percentage = (val / thresholds.medio) * 33.33;
  } else if (val < thresholds.grave) {
    level = 'Medio';
    color = 'var(--warning-color)';
    badgeClass = 'badge badge-warning';
    percentage = 33.33 + ((val - thresholds.medio) / (thresholds.grave - thresholds.medio)) * 33.33;
  } else {
    level = 'Grave';
    color = 'var(--danger-color)';
    badgeClass = 'badge badge-danger';
    const graveSpan = thresholds.max - thresholds.grave;
    percentage = 66.66 + Math.min(1, (val - thresholds.grave) / graveSpan) * 33.34;
  }

  const clampedPct = val === 0 ? 0 : Math.min(100, Math.max(5, Number(percentage.toFixed(1))));

  return {
    value: val,
    level,
    color,
    badgeClass,
    percentage: clampedPct,
    thresholds
  };
};

const SuperAdminDashboard = () => {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('bitacora');
  const navigate = useNavigate();

  // Estado para formulario de nueva etapa (Requerimientos 1 y 2)
  const [instrumentSelect, setInstrumentSelect] = useState('Barómetro de Cisneros');
  const [customInstrument, setCustomInstrument] = useState('');
  const [startDate, setStartDate] = useState('2026-11-01');
  const [endDate, setEndDate] = useState('2026-12-31');
  const [applyToAll, setApplyToAll] = useState('all'); // 'all' | 'specific'
  const [targetDependencia, setTargetDependencia] = useState('Dirección de Obras Públicas');
  const [targetApplications, setTargetApplications] = useState(30);
  const [creatingStage, setCreatingStage] = useState(false);
  const [stageMessage, setStageMessage] = useState({ type: '', text: '' });

  // Estado para búsqueda en tablas (Requerimiento 3)
  const [userSearch, setUserSearch] = useState('');
  const [evalSearch, setEvalSearch] = useState('');
  const [areaFilterSelect, setAreaFilterSelect] = useState('');

  // Estado para filtros en cascada del Dashboard / Bitácora (Requerimiento 4)
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedInstrument, setSelectedInstrument] = useState('');
  const [selectedStageId, setSelectedStageId] = useState('');

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/superadmin/overview`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = response.data;
      setOverview(data);

      if (data?.summary?.total_respondents > 0) {
        setTargetApplications(data.summary.total_respondents);
      }

      // Inicializar selección por defecto en la bitácora si hay etapas
      if (data?.stages?.length > 0 && !selectedStageId) {
        const first = data.stages[0];
        setSelectedYear(String(first.year));
        setSelectedInstrument(first.instrument_name);
        setSelectedStageId(String(first.id));
      }
    } catch (err) {
      console.error('Error fetching superadmin overview:', err);
      setError(err?.response?.data?.detail || 'Error al cargar el panel de Superadministrador.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const stages = overview?.stages || [];

  // Opciones dinámicas para el buscador de Bitácora (Año -> Instrumento -> Periodo)
  const availableYears = useMemo(() => {
    const yearsSet = new Set(stages.map((s) => String(s.year)));
    return Array.from(yearsSet).sort((a, b) => Number(b) - Number(a));
  }, [stages]);

  const availableInstrumentsForYear = useMemo(() => {
    const filtered = selectedYear
      ? stages.filter((s) => String(s.year) === String(selectedYear))
      : stages;
    const instSet = new Set(filtered.map((s) => s.instrument_name));
    if (instSet.size === 0) instSet.add('Barómetro de Cisneros');
    return Array.from(instSet);
  }, [stages, selectedYear]);

  const availablePeriods = useMemo(() => {
    return stages.filter((s) => {
      const matchYear = !selectedYear || String(s.year) === String(selectedYear);
      const matchInst = !selectedInstrument || s.instrument_name === selectedInstrument;
      return matchYear && matchInst;
    });
  }, [stages, selectedYear, selectedInstrument]);

  const selectedStageData = useMemo(() => {
    if (!selectedStageId) return availablePeriods[0] || null;
    return stages.find((s) => String(s.id) === String(selectedStageId)) || null;
  }, [stages, selectedStageId, availablePeriods]);

  const handleYearChange = (e) => {
    const nextYear = e.target.value;
    setSelectedYear(nextYear);
    const matchingStages = stages.filter((s) => !nextYear || String(s.year) === String(nextYear));
    const nextInst = matchingStages[0]?.instrument_name || '';
    setSelectedInstrument(nextInst);
    const nextStage = matchingStages.find((s) => !nextInst || s.instrument_name === nextInst);
    setSelectedStageId(nextStage ? String(nextStage.id) : '');
  };

  const handleInstrumentFilterChange = (e) => {
    const nextInst = e.target.value;
    setSelectedInstrument(nextInst);
    const matchingStages = stages.filter(
      (s) =>
        (!selectedYear || String(s.year) === String(selectedYear)) &&
        (!nextInst || s.instrument_name === nextInst)
    );
    setSelectedStageId(matchingStages[0] ? String(matchingStages[0].id) : '');
  };

  const handleCreateStage = async (e) => {
    e.preventDefault();
    setStageMessage({ type: '', text: '' });

    const finalInstrument =
      instrumentSelect === 'Otro instrumento' ? customInstrument.trim() : instrumentSelect;

    if (!finalInstrument) {
      setStageMessage({ type: 'error', text: 'Especifica el nombre del instrumento.' });
      return;
    }

    if (!startDate || !endDate) {
      setStageMessage({ type: 'error', text: 'Selecciona las fechas de inicio y fin del periodo.' });
      return;
    }

    if (endDate < startDate) {
      setStageMessage({ type: 'error', text: 'La fecha final no puede ser anterior a la fecha inicial.' });
      return;
    }

    const isAllUsers = applyToAll === 'all';
    if (!isAllUsers && !targetDependencia.trim()) {
      setStageMessage({ type: 'error', text: 'Selecciona a qué dependencia se le asignará este bloque.' });
      return;
    }

    setCreatingStage(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `${API_BASE_URL}/api/superadmin/stages`,
        {
          instrument_name: finalInstrument,
          start_date: startDate,
          end_date: endDate,
          target_applications: Number(targetApplications) || 1,
          apply_to_all: isAllUsers,
          target_dependencia: isAllUsers ? null : targetDependencia,
          is_active: true
        },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        }
      );

      const created = res.data.stage;
      setStageMessage({
        type: 'success',
        text: `Etapa habilitada correctamente: ${created.instrument_name} (${formatDateShort(created.start_date)} - ${formatDateShort(created.end_date)}) — Asignada a: ${created.scope_label || 'Todos los usuarios'}`
      });

      await fetchOverview();
      setSelectedYear(String(created.year));
      setSelectedInstrument(created.instrument_name);
      setSelectedStageId(String(created.id));
    } catch (err) {
      const detail = err?.response?.data?.detail || 'Error al crear la etapa de cuestionario.';
      setStageMessage({
        type: 'error',
        text: Array.isArray(detail) ? detail.map((d) => d.msg).join(' | ') : String(detail)
      });
    } finally {
      setCreatingStage(false);
    }
  };

  const handleToggleStage = async (stageId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${API_BASE_URL}/api/superadmin/stages/${stageId}/toggle`,
        {},
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      await fetchOverview();
    } catch (err) {
      console.error('Error cambiando estado de etapa:', err);
    }
  };

  const handleReviewStage = async (stageId, action) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${API_BASE_URL}/api/superadmin/stages/${stageId}/approval`,
        { action },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      await fetchOverview();
    } catch (err) {
      console.error('Error revisando solicitud de etapa:', err);
    }
  };

  const filteredUsers = useMemo(() => {
    const list = overview?.users_table || [];
    const q = userSearch.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (u) =>
        u.nombre_completo.toLowerCase().includes(q) ||
        u.num_empleado.toLowerCase().includes(q) ||
        u.curp.toLowerCase().includes(q) ||
        u.dependencia.toLowerCase().includes(q) ||
        u.departamento.toLowerCase().includes(q)
    );
  }, [overview, userSearch]);

  const filteredEvaluations = useMemo(() => {
    const list = overview?.evaluations_table || [];
    const q = evalSearch.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (ev) =>
        ev.nombre_completo.toLowerCase().includes(q) ||
        ev.num_empleado.toLowerCase().includes(q) ||
        ev.dependencia.toLowerCase().includes(q) ||
        ev.risk_level.toLowerCase().includes(q) ||
        ev.autor_acoso.toLowerCase().includes(q)
    );
  }, [overview, evalSearch]);

  const filteredAreas = useMemo(() => {
    const list = overview?.risk_overview?.by_dependencia || [];
    if (!areaFilterSelect) return list;
    return list.filter((row) => row.dependencia === areaFilterSelect);
  }, [overview, areaFilterSelect]);

  const filteredAreasSummary = useMemo(() => {
    const countAreas = filteredAreas.length;
    let metaTotal = 0;
    let contestadasTotal = 0;
    let leveTotal = 0;
    let medioTotal = 0;
    let graveTotal = 0;
    let weightedImap = 0;
    let weightedIgap = 0;
    let weightedNeap = 0;

    filteredAreas.forEach((r) => {
      const m = r.meta_evaluaciones ?? r.total ?? 0;
      const c = r.contestadas ?? r.total ?? 0;
      metaTotal += m;
      contestadasTotal += c;
      leveTotal += r.leve || 0;
      medioTotal += r.medio || 0;
      graveTotal += r.grave || 0;
      weightedImap += (Number(r.imap) || 0) * c;
      weightedIgap += (Number(r.igap) || 0) * c;
      weightedNeap += (Number(r.neap) || 0) * c;
    });

    return {
      countAreas,
      metaTotal,
      contestadasTotal,
      leveTotal,
      medioTotal,
      graveTotal,
      avgImap: contestadasTotal > 0 ? (weightedImap / contestadasTotal).toFixed(2) : 0,
      avgIgap: contestadasTotal > 0 ? (weightedIgap / contestadasTotal).toFixed(2) : 0,
      avgNeap: contestadasTotal > 0 ? (weightedNeap / contestadasTotal).toFixed(2) : 0
    };
  }, [filteredAreas]);

  if (loading && !overview) {
    return (
      <div className="container" style={{ textAlign: 'center', marginTop: '4rem' }}>
        Cargando panel de Superadministrador...
      </div>
    );
  }

  if (error) {
    return (
      <div className="container" style={{ textAlign: 'center', marginTop: '4rem', color: 'var(--danger-color)' }}>
        {error}
      </div>
    );
  }

  const riskOverview = overview?.risk_overview || {
    total_evaluations: 0,
    risk_distribution: { leve: 0, medio: 0, grave: 0, leve_pct: 0, medio_pct: 0, grave_pct: 0 },
    averages: { imap: 0, igap: 0, neap: 0 },
    by_dependencia: []
  };

  return (
    <div className="container" style={{ maxWidth: '1320px' }}>
      {/* Encabezado Principal */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <ShieldCheck size={34} color="var(--primary-color)" />
            <h1 style={{ margin: 0 }}>Panel de Superadministrador</h1>
          </div>
          <p style={{ marginTop: '0.35rem', color: 'var(--text-secondary)' }}>
            Gestión de etapas de cuestionarios, bitácora de muestras e información nominal y de riesgo
          </p>
        </div>

        <button
          onClick={() => navigate('/admin')}
          className="btn"
          style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.25rem' }}
        >
          <BarChart3 size={18} />
          <span>Ver Vista Administrador</span>
        </button>
      </div>

      {/* Pestañas de navegación de los módulos del Superadministrador */}
      <div className="tabs-bar">
        <button
          type="button"
          className={`tab-btn ${activeTab === 'bitacora' ? 'active' : ''}`}
          onClick={() => setActiveTab('bitacora')}
        >
          <Search size={18} />
          <span>Dashboard / Bitácora</span>
        </button>

        <button
          type="button"
          className={`tab-btn ${activeTab === 'etapas' ? 'active' : ''}`}
          onClick={() => setActiveTab('etapas')}
        >
          <CalendarPlus size={18} />
          <span>Generar Etapa de Cuestionarios</span>
        </button>

        <button
          type="button"
          className={`tab-btn ${activeTab === 'usuarios' ? 'active' : ''}`}
          onClick={() => setActiveTab('usuarios')}
        >
          <Users size={18} />
          <span>Datos Personales ({overview?.users_table?.length || 0})</span>
        </button>

        <button
          type="button"
          className={`tab-btn ${activeTab === 'resultados' ? 'active' : ''}`}
          onClick={() => setActiveTab('resultados')}
        >
          <FileSpreadsheet size={18} />
          <span>Resultados Nominales ({overview?.evaluations_table?.length || 0})</span>
        </button>

        <button
          type="button"
          className={`tab-btn ${activeTab === 'riesgo' ? 'active' : ''}`}
          onClick={() => setActiveTab('riesgo')}
        >
          <AlertTriangle size={18} />
          <span>Tabla General y Distribución de Riesgo</span>
        </button>
      </div>

      {/* =====================================================================
          MÓDULO 4: DASHBOARD / BITÁCORA POR FORMATO DE BÚSQUEDAS
         ===================================================================== */}
      {activeTab === 'bitacora' && (
        <div>
          <div className="glass-card" style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
              <Search size={22} color="var(--primary-color)" />
              <h2 style={{ margin: 0 }}>Bitácora de Evaluaciones por Periodo</h2>
            </div>
            <p style={{ marginBottom: '1.5rem' }}>
              Selecciona el año, el instrumento de evaluación y el periodo de aplicación para consultar el cumplimiento de la muestra e indicadores generales.
            </p>

            {stages.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', border: '1px dashed var(--border-color)', borderRadius: '1rem' }}>
                <p style={{ marginBottom: '1rem' }}>Aún no se han registrado etapas de cuestionarios en la bitácora.</p>
                <button
                  type="button"
                  className="btn"
                  style={{ width: 'auto' }}
                  onClick={() => setActiveTab('etapas')}
                >
                  <CalendarPlus size={18} />
                  <span>Generar Primera Etapa de Cuestionarios</span>
                </button>
              </div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>1. Año de Aplicación</label>
                    <select value={selectedYear} onChange={handleYearChange}>
                      {availableYears.map((yr) => (
                        <option key={yr} value={yr}>
                          {yr}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>2. Instrumento / Evaluación</label>
                    <select value={selectedInstrument} onChange={handleInstrumentFilterChange}>
                      {availableInstrumentsForYear.map((inst) => (
                        <option key={inst} value={inst}>
                          {inst}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>3. Periodo Habilitado</label>
                    <select
                      value={selectedStageId}
                      onChange={(e) => setSelectedStageId(e.target.value)}
                    >
                      {availablePeriods.map((st) => (
                        <option key={st.id} value={st.id}>
                          {formatDateShort(st.start_date)} a {formatDateShort(st.end_date)} (Etapa #{st.id})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}
          </div>

          {selectedStageData && (
            <>
              {/* Tarjetas de Meta de Aplicaciones, Significancia de Muestra e Indicadores IGAP / IMAP */}
              <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))' }}>
                <div className="stat-card">
                  <ClipboardCheck size={30} color="var(--primary-color)" style={{ marginBottom: '0.75rem' }} />
                  <div className="stat-value">
                    {selectedStageData.completed_applications} / {selectedStageData.target_applications}
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
                    Aplicaciones vs Meta ({selectedStageData.completion_pct}%)
                  </div>
                </div>

                <div className="stat-card">
                  {selectedStageData.sample_fulfilled ? (
                    <CheckCircle2 size={30} color="var(--success-color)" style={{ marginBottom: '0.75rem' }} />
                  ) : (
                    <XCircle size={30} color="var(--warning-color)" style={{ marginBottom: '0.75rem' }} />
                  )}
                  <div
                    className="stat-value"
                    style={{
                      fontSize: '1.65rem',
                      color: selectedStageData.sample_fulfilled ? 'var(--success-color)' : 'var(--warning-color)'
                    }}
                  >
                    {selectedStageData.sample_fulfilled ? 'Muestra Cumplida' : 'Muestra Incompleta'}
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    {selectedStageData.sample_fulfilled
                      ? 'Muestra estadísticamente significativa'
                      : `Faltan ${Math.max(0, selectedStageData.target_applications - selectedStageData.completed_applications)} aplicaciones para la meta`}
                  </div>
                </div>

                {(() => {
                  const imapGauge = getIndicatorGauge('imap', selectedStageData.averages.imap);
                  const igapGauge = getIndicatorGauge('igap', selectedStageData.averages.igap);

                  return (
                    <>
                      <div className="stat-card">
                        <Activity size={30} color={imapGauge.color} style={{ marginBottom: '0.5rem' }} />
                        <div className="stat-value" style={{ color: imapGauge.color }}>
                          {selectedStageData.averages.imap}
                        </div>
                        <div style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
                          IMAP Promedio ({selectedStageData.instrument_name})
                        </div>

                        <div className="gauge-container">
                          <div className="gauge-header">
                            <span style={{ color: 'var(--text-secondary)' }}>Nivel de peligro:</span>
                            <span className={imapGauge.badgeClass}>{imapGauge.level}</span>
                          </div>
                          <div className="gauge-track">
                            <div className="gauge-zones-bg">
                              <div className="gauge-zone-green" />
                              <div className="gauge-zone-yellow" />
                              <div className="gauge-zone-red" />
                            </div>
                            <div
                              className="gauge-fill"
                              style={{
                                width: `${imapGauge.percentage}%`,
                                backgroundColor: imapGauge.color,
                                boxShadow: `0 0 10px ${imapGauge.color}`
                              }}
                            />
                          </div>
                          <div className="gauge-scale-labels">
                            <span style={{ color: 'var(--success-color)' }}>Leve (&lt;1.80)</span>
                            <span style={{ color: 'var(--warning-color)' }}>Medio (1.80-2.79)</span>
                            <span style={{ color: 'var(--danger-color)' }}>Grave (≥2.80)</span>
                          </div>
                        </div>
                      </div>

                      <div className="stat-card">
                        <Activity size={30} color={igapGauge.color} style={{ marginBottom: '0.5rem' }} />
                        <div className="stat-value" style={{ color: igapGauge.color }}>
                          {selectedStageData.averages.igap}
                        </div>
                        <div style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
                          IGAP Promedio ({selectedStageData.instrument_name})
                        </div>

                        <div className="gauge-container">
                          <div className="gauge-header">
                            <span style={{ color: 'var(--text-secondary)' }}>Nivel de peligro:</span>
                            <span className={igapGauge.badgeClass}>{igapGauge.level}</span>
                          </div>
                          <div className="gauge-track">
                            <div className="gauge-zones-bg">
                              <div className="gauge-zone-green" />
                              <div className="gauge-zone-yellow" />
                              <div className="gauge-zone-red" />
                            </div>
                            <div
                              className="gauge-fill"
                              style={{
                                width: `${igapGauge.percentage}%`,
                                backgroundColor: igapGauge.color,
                                boxShadow: `0 0 10px ${igapGauge.color}`
                              }}
                            />
                          </div>
                          <div className="gauge-scale-labels">
                            <span style={{ color: 'var(--success-color)' }}>Leve (&lt;0.60)</span>
                            <span style={{ color: 'var(--warning-color)' }}>Medio (0.60-1.22)</span>
                            <span style={{ color: 'var(--danger-color)' }}>Grave (≥1.23)</span>
                          </div>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Detalle de la Etapa Seleccionada en Bitácora */}
              <div className="glass-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div>
                    <h2 style={{ margin: 0 }}>{selectedStageData.instrument_name} — Año {selectedStageData.year}</h2>
                    <p style={{ marginTop: '0.25rem' }}>
                      Periodo seleccionado: <strong>{formatDateShort(selectedStageData.start_date)}</strong> al{' '}
                      <strong>{formatDateShort(selectedStageData.end_date)}</strong>
                    </p>
                  </div>
                  <span className={selectedStageData.is_currently_open ? 'badge badge-success' : 'badge badge-neutral'}>
                    {selectedStageData.is_currently_open ? 'Etapa Vigente y Abierta' : 'Etapa Cerrada / Fuera de fecha'}
                  </span>
                </div>

                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Instrumento</th>
                        <th>Periodo Habilitado</th>
                        <th>Meta de Aplicaciones</th>
                        <th>Respondidos</th>
                        <th>¿Se cumplió la muestra?</th>
                        <th>IGAP</th>
                        <th>IMAP</th>
                        <th>NEAP Prom.</th>
                        <th>Riesgo (L / M / G)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><strong>{selectedStageData.instrument_name}</strong></td>
                        <td>{formatDateShort(selectedStageData.start_date)} - {formatDateShort(selectedStageData.end_date)}</td>
                        <td>{selectedStageData.target_applications}</td>
                        <td>{selectedStageData.completed_applications} ({selectedStageData.completion_pct}%)</td>
                        <td>
                          <span className={selectedStageData.sample_fulfilled ? 'badge badge-success' : 'badge badge-warning'}>
                            {selectedStageData.sample_fulfilled ? 'Sí (Muestra significativa)' : 'No (Muestra insuficiente)'}
                          </span>
                        </td>
                        <td><strong>{selectedStageData.averages.igap}</strong></td>
                        <td><strong>{selectedStageData.averages.imap}</strong></td>
                        <td>{selectedStageData.averages.neap}</td>
                        <td>
                          <span className="badge badge-success" style={{ marginRight: '0.35rem' }}>
                            L: {selectedStageData.risk_distribution.leve}
                          </span>
                          <span className="badge badge-warning" style={{ marginRight: '0.35rem' }}>
                            M: {selectedStageData.risk_distribution.medio}
                          </span>
                          <span className="badge badge-danger">
                            G: {selectedStageData.risk_distribution.grave}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* =====================================================================
          MÓDULO 1 Y 2: GENERAR NUEVA ETAPA DE CUESTIONARIOS Y PERIODO DE FECHAS
         ===================================================================== */}
      {activeTab === 'etapas' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="glass-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
              <CalendarPlus size={24} color="var(--primary-color)" />
              <h2 style={{ margin: 0 }}>Habilitar Nueva Etapa de Cuestionarios</h2>
            </div>
            <p style={{ marginBottom: '1.5rem' }}>
              Selecciona el instrumento que deseas habilitar y define el periodo de fechas en el que estará disponible para los usuarios (por ejemplo, de 1 de noviembre a 31 de diciembre).
            </p>

            <form onSubmit={handleCreateStage}>
              <div className="form-group">
                <label>Instrumento a habilitar</label>
                <select
                  value={instrumentSelect}
                  onChange={(e) => setInstrumentSelect(e.target.value)}
                >
                  {INSTRUMENT_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {instrumentSelect === 'Otro instrumento' && (
                <div className="form-group">
                  <label>Nombre del nuevo instrumento</label>
                  <input
                    type="text"
                    value={customInstrument}
                    onChange={(e) => setCustomInstrument(e.target.value)}
                    placeholder="Ej. Cuestionario de Clima Organizacional"
                    required
                  />
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Fecha de inicio del periodo</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Fecha de cierre del periodo</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>¿Habilitar etapa para todos los usuarios?</label>
                <select
                  value={applyToAll}
                  onChange={(e) => setApplyToAll(e.target.value)}
                >
                  <option value="all">Sí, habilitar a todos los usuarios</option>
                  <option value="specific">No, asignar únicamente a una dependencia específica</option>
                </select>
              </div>

              {applyToAll === 'specific' && (
                <div className="form-group">
                  <label>Seleccionar dependencia a la que se asignará este bloque</label>
                  <select
                    value={targetDependencia}
                    onChange={(e) => setTargetDependencia(e.target.value)}
                    required
                  >
                    {PREDEFINED_DEPENDENCIAS.map((dep) => (
                      <option key={dep} value={dep}>
                        {dep}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label style={{ margin: 0 }}>Meta de aplicaciones (Tamaño de muestra esperada)</label>
                  {overview?.summary?.total_respondents > 0 && (
                    <button
                      type="button"
                      onClick={() => setTargetApplications(overview.summary.total_respondents)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--primary-color)',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: 600
                      }}
                    >
                      Usar total de encuestados ({overview.summary.total_respondents})
                    </button>
                  )}
                </div>
                <input
                  type="number"
                  min={1}
                  value={targetApplications}
                  onChange={(e) => setTargetApplications(e.target.value)}
                  required
                />
              </div>

              {stageMessage.text && (
                <div
                  style={{
                    marginBottom: '1rem',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.75rem',
                    background:
                      stageMessage.type === 'success'
                        ? 'rgba(16, 185, 129, 0.15)'
                        : 'rgba(239, 68, 68, 0.15)',
                    color: stageMessage.type === 'success' ? '#34d399' : '#f87171',
                    fontSize: '0.9rem'
                  }}
                >
                  {stageMessage.text}
                </div>
              )}

              <button type="submit" className="btn" disabled={creatingStage}>
                <CalendarPlus size={18} />
                <span>{creatingStage ? 'Guardando etapa...' : 'Generar y Habilitar Etapa'}</span>
              </button>
            </form>
          </div>

          <div className="glass-card">
            <h2 style={{ marginBottom: '0.5rem' }}>Etapas Registradas ({stages.length})</h2>
            <p style={{ marginBottom: '1.5rem' }}>
              Historial de etapas configuradas y su estado de vigencia actual.
            </p>

            {stages.length === 0 ? (
              <p>No hay etapas creadas todavía.</p>
            ) : (
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Instrumento</th>
                      <th>Asignación / Dependencia</th>
                      <th>Periodo</th>
                      <th>Avance Muestra</th>
                      <th>Aprobación</th>
                      <th>Estado</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stages.map((st) => {
                      const appStatus = st.approval_status || 'approved';
                      return (
                        <tr key={st.id}>
                          <td>#{st.id}</td>
                          <td>
                            <div><strong>{st.instrument_name}</strong></div>
                            {st.requested_by && (
                              <small style={{ color: 'var(--text-secondary)' }}>
                                Solicitado por: {st.requested_by}
                              </small>
                            )}
                          </td>
                          <td>
                            <span className={st.apply_to_all === false ? 'badge badge-warning' : 'badge badge-neutral'}>
                              {st.scope_label || (st.apply_to_all === false ? st.target_dependencia : 'Todos los usuarios')}
                            </span>
                          </td>
                          <td>
                            {formatDateShort(st.start_date)} al {formatDateShort(st.end_date)}
                          </td>
                          <td>
                            {st.completed_applications} / {st.target_applications} ({st.completion_pct}%)
                          </td>
                          <td>
                            <span
                              className={
                                appStatus === 'approved'
                                  ? 'badge badge-success'
                                  : appStatus === 'pending'
                                    ? 'badge badge-warning'
                                    : 'badge badge-danger'
                              }
                            >
                              {appStatus === 'approved'
                                ? 'Aprobada'
                                : appStatus === 'pending'
                                  ? 'Pendiente de Aprobación'
                                  : 'Rechazada'}
                            </span>
                          </td>
                          <td>
                            <span className={st.is_active && appStatus === 'approved' ? 'badge badge-success' : 'badge badge-neutral'}>
                              {st.is_active && appStatus === 'approved' ? 'Habilitada' : 'Pausada'}
                            </span>
                          </td>
                          <td>
                            {appStatus === 'pending' ? (
                              <div style={{ display: 'flex', gap: '0.4rem' }}>
                                <button
                                  type="button"
                                  onClick={() => handleReviewStage(st.id, 'approve')}
                                  className="tab-btn"
                                  style={{
                                    padding: '0.35rem 0.65rem',
                                    fontSize: '0.78rem',
                                    borderColor: 'var(--success-color)',
                                    color: 'var(--success-color)'
                                  }}
                                >
                                  Aprobar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleReviewStage(st.id, 'reject')}
                                  className="tab-btn"
                                  style={{
                                    padding: '0.35rem 0.65rem',
                                    fontSize: '0.78rem',
                                    borderColor: 'var(--danger-color)',
                                    color: 'var(--danger-color)'
                                  }}
                                >
                                  Rechazar
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleToggleStage(st.id)}
                                className="tab-btn"
                                style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                              >
                                {st.is_active ? 'Deshabilitar' : 'Habilitar'}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          MÓDULO 3A: TABLA DE DATOS PERSONALES DE LOS USUARIOS
         ===================================================================== */}
      {activeTab === 'usuarios' && (
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <h2 style={{ margin: 0 }}>Tabla de Datos Personales de los Usuarios</h2>
              <p style={{ marginTop: '0.25rem' }}>
                Padrón demográfico y organizacional completo de los usuarios registrados en la plataforma.
              </p>
            </div>

            <div style={{ minWidth: '280px' }}>
              <input
                type="text"
                placeholder="Buscar por nombre, No. empleado, CURP, área..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>No. Empleado</th>
                  <th>Usuario</th>
                  <th>Nombre Completo</th>
                  <th>CURP</th>
                  <th>Dependencia</th>
                  <th>Coordinación</th>
                  <th>Departamento</th>
                  <th>Puesto / Cargo</th>
                  <th>Estado Encuesta</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                      No se encontraron usuarios registrados con ese criterio.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.respondent_id}>
                      <td><strong>{u.num_empleado}</strong></td>
                      <td>{u.username}</td>
                      <td>{u.nombre_completo}</td>
                      <td style={{ fontFamily: 'monospace' }}>{u.curp}</td>
                      <td>{u.dependencia}</td>
                      <td>{u.coordinacion}</td>
                      <td>{u.departamento}</td>
                      <td>{u.puesto} ({u.cargo})</td>
                      <td>
                        <span className={u.has_answered ? 'badge badge-success' : 'badge badge-warning'}>
                          {u.has_answered ? `Respondido (${u.evaluations_count})` : 'Pendiente'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =====================================================================
          MÓDULO 3B: TABLA DE RESULTADOS DE LOS USUARIOS QUE YA RESPONDIERON
         ===================================================================== */}
      {activeTab === 'resultados' && (
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <h2 style={{ margin: 0 }}>Tabla de Resultados de Usuarios que ya Respondieron</h2>
              <p style={{ marginTop: '0.25rem' }}>
                Vista exclusiva de Superadministrador con acceso a la identidad completa e indicadores individuales (NEAP, IMAP, IGAP y Nivel de Riesgo).
              </p>
            </div>

            <div style={{ minWidth: '280px' }}>
              <input
                type="text"
                placeholder="Filtrar por empleado, dependencia o nivel de riesgo..."
                value={evalSearch}
                onChange={(e) => setEvalSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Folio</th>
                  <th>No. Empleado</th>
                  <th>Nombre Completo</th>
                  <th>Dependencia / Depto.</th>
                  <th>Modalidad</th>
                  <th>Autor Señalado</th>
                  <th>NEAP</th>
                  <th>IMAP</th>
                  <th>IGAP</th>
                  <th>Nivel de Riesgo</th>
                  <th>Periodo / Etapa</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvaluations.length === 0 ? (
                  <tr>
                    <td colSpan={11} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                      No hay evaluaciones registradas para mostrar.
                    </td>
                  </tr>
                ) : (
                  filteredEvaluations.map((ev) => (
                    <tr key={ev.evaluation_id}>
                      <td>#{ev.evaluation_id}</td>
                      <td><strong>{ev.num_empleado}</strong></td>
                      <td>{ev.nombre_completo}</td>
                      <td>
                        <div>{ev.dependencia}</div>
                        <small style={{ color: 'var(--text-secondary)' }}>{ev.departamento}</small>
                      </td>
                      <td>
                        <span className="badge badge-neutral">
                          {ev.anonimo ? 'Marcó Anónimo' : 'Público'}
                        </span>
                      </td>
                      <td>{ev.autor_acoso}</td>
                      <td><strong>{ev.neap}</strong></td>
                      <td><strong>{ev.imap_score}</strong></td>
                      <td><strong>{ev.igap_score}</strong></td>
                      <td>
                        <span className={getRiskBadgeClass(ev.risk_level)}>
                          {ev.risk_level}
                        </span>
                      </td>
                      <td>
                        <div>{ev.instrument_name}</div>
                        <small style={{ color: 'var(--text-secondary)' }}>{ev.stage_period}</small>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =====================================================================
          MÓDULO 3C: TABLA GENERAL DE RIESGO Y CONTEO DE DISTRIBUCIÓN DE RIESGO
         ===================================================================== */}
      {activeTab === 'riesgo' && (
        <div>
          {/* Conteo visual de distribución de riesgo */}
          <div className="stats-grid">
            <div className="stat-card">
              <AlertTriangle size={36} color="var(--success-color)" style={{ marginBottom: '0.75rem' }} />
              <div className="stat-value" style={{ color: 'var(--success-color)' }}>
                {riskOverview.risk_distribution.leve}
              </div>
              <div style={{ fontWeight: 600 }}>Leve o inexistente</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                {riskOverview.risk_distribution.leve_pct}% del total ({riskOverview.total_evaluations})
              </div>
            </div>

            <div className="stat-card">
              <AlertTriangle size={36} color="var(--warning-color)" style={{ marginBottom: '0.75rem' }} />
              <div className="stat-value" style={{ color: 'var(--warning-color)' }}>
                {riskOverview.risk_distribution.medio}
              </div>
              <div style={{ fontWeight: 600 }}>Riesgo Medio</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                {riskOverview.risk_distribution.medio_pct}% del total ({riskOverview.total_evaluations})
              </div>
            </div>

            <div className="stat-card">
              <AlertTriangle size={36} color="var(--danger-color)" style={{ marginBottom: '0.75rem' }} />
              <div className="stat-value" style={{ color: 'var(--danger-color)' }}>
                {riskOverview.risk_distribution.grave}
              </div>
              <div style={{ fontWeight: 600 }}>Grave a muy grave</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                {riskOverview.risk_distribution.grave_pct}% del total ({riskOverview.total_evaluations})
              </div>
            </div>
          </div>

          {/* Tabla de Conteo de Distribución de Riesgo */}
          <div className="glass-card" style={{ marginBottom: '2rem' }}>
            <h2 style={{ marginBottom: '0.5rem' }}>Tabla de Conteo y Distribución de Riesgo</h2>
            <p style={{ marginBottom: '1.25rem' }}>
              Consolidado estadístico de niveles de riesgo e indicadores globales (IMAP: {riskOverview.averages.imap} | IGAP: {riskOverview.averages.igap} | NEAP Promedio: {riskOverview.averages.neap}).
            </p>

            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nivel de Riesgo</th>
                    <th>Criterio Barómetro de Cisneros</th>
                    <th>Conteo de Usuarios</th>
                    <th>Porcentaje (%)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <span className="badge badge-success">Leve o inexistente</span>
                    </td>
                    <td>IMAP &lt; 2.80</td>
                    <td><strong>{riskOverview.risk_distribution.leve}</strong></td>
                    <td>{riskOverview.risk_distribution.leve_pct}%</td>
                  </tr>
                  <tr>
                    <td>
                      <span className="badge badge-warning">Medio</span>
                    </td>
                    <td>IMAP ≥ 2.80 e IGAP &lt; 1.23</td>
                    <td><strong>{riskOverview.risk_distribution.medio}</strong></td>
                    <td>{riskOverview.risk_distribution.medio_pct}%</td>
                  </tr>
                  <tr>
                    <td>
                      <span className="badge badge-danger">Grave a muy grave</span>
                    </td>
                    <td>IMAP ≥ 2.80 e IGAP ≥ 1.23</td>
                    <td><strong>{riskOverview.risk_distribution.grave}</strong></td>
                    <td>{riskOverview.risk_distribution.grave_pct}%</td>
                  </tr>
                  <tr style={{ background: 'rgba(79, 70, 229, 0.12)', fontWeight: 700 }}>
                    <td>Total Global</td>
                    <td>Todas las evaluaciones aplicadas</td>
                    <td>{riskOverview.total_evaluations}</td>
                    <td>{riskOverview.total_evaluations > 0 ? '100%' : '0%'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Tabla General de Riesgo desglosada por Áreas */}
          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ marginBottom: '0.5rem' }}>Tabla General de Riesgo por Áreas</h2>
                <p style={{ margin: 0 }}>
                  Distribución de riesgo, meta de aplicaciones, evaluaciones contestadas e índices promedio (IGAP, IMAP y NEAP) agrupados por área (dependencia, dirección o subdirección).
                </p>
              </div>

              <div style={{ minWidth: '280px' }}>
                <select
                  value={areaFilterSelect}
                  onChange={(e) => setAreaFilterSelect(e.target.value)}
                >
                  <option value="">Todas las dependencias</option>
                  {PREDEFINED_DEPENDENCIAS.map((dep) => (
                    <option key={dep} value={dep}>
                      {dep}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th rowSpan={2}>Áreas <br></br> (Dependencia / Dirección o Subdirección)</th>
                    <th colSpan={2} style={{ textAlign: 'center', borderBottom: '1px solid var(--border-color)' }}>
                      Total Evaluaciones
                    </th>
                    <th colSpan={3} style={{ textAlign: 'center', borderBottom: '1px solid var(--border-color)' }}>
                      Niveles de peligro
                    </th>
                    <th colSpan={3} style={{ textAlign: 'center', borderBottom: '1px solid var(--border-color)' }}>
                      Indicadores
                    </th>
                  </tr>
                  <tr>
                    <th className="col-divider">Meta</th>
                    <th>Contestadas</th>
                    <th className="col-divider">Leve o inexistente</th>
                    <th>Medio</th>
                    <th>Grave a muy grave</th>
                    <th className="col-divider">IGAP Promedio</th>
                    <th>IMAP Promedio</th>
                    <th>NEAP Promedio</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAreas.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                        No se encontraron áreas con ese criterio de búsqueda.
                      </td>
                    </tr>
                  ) : (
                    <>
                      {filteredAreas.map((row, idx) => {
                        const metaVal = row.meta_evaluaciones ?? row.total ?? 0;
                        const contestadasVal = row.contestadas ?? row.total ?? 0;
                        return (
                          <tr key={row.area || row.dependencia || idx}>
                            <td>
                              <div><strong>{row.coordinacion || row.dependencia}</strong></div>
                              {row.coordinacion && row.dependencia && row.coordinacion !== row.dependencia && (
                                <small style={{ color: 'var(--text-secondary)' }}>{row.dependencia}</small>
                              )}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <strong>{metaVal}</strong>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <span className={contestadasVal >= metaVal && metaVal > 0 ? 'badge badge-success' : 'badge badge-neutral'}>
                                {contestadasVal}
                              </span>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <span className="badge badge-success">{row.leve}</span>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <span className="badge badge-warning">{row.medio}</span>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <span className="badge badge-danger">{row.grave}</span>
                            </td>
                            <td style={{ textAlign: 'center' }}><strong>{row.igap}</strong></td>
                            <td style={{ textAlign: 'center' }}><strong>{row.imap}</strong></td>
                            <td style={{ textAlign: 'center' }}>{row.neap}</td>
                          </tr>
                        );
                      })}
                      <tr style={{ background: 'rgba(79, 70, 229, 0.14)', fontWeight: 700 }}>
                        <td>
                          {areaFilterSelect
                            ? `Total de áreas en ${areaFilterSelect} (${filteredAreasSummary.countAreas})`
                            : `Total de todas las áreas (${riskOverview.total_areas ?? riskOverview.by_dependencia.length})`}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {filteredAreasSummary.metaTotal}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {filteredAreasSummary.contestadasTotal}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className="badge badge-success">{filteredAreasSummary.leveTotal}</span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className="badge badge-warning">{filteredAreasSummary.medioTotal}</span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className="badge badge-danger">{filteredAreasSummary.graveTotal}</span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {areaFilterSelect ? filteredAreasSummary.avgIgap : riskOverview.averages.igap}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {areaFilterSelect ? filteredAreasSummary.avgImap : riskOverview.averages.imap}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {areaFilterSelect ? filteredAreasSummary.avgNeap : riskOverview.averages.neap}
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboard;
