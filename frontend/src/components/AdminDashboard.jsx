import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ShieldCheck,
  Building2,
  Users,
  FileSpreadsheet,
  CalendarPlus,
  Search,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Activity,
  ClipboardCheck,
  Clock
} from 'lucide-react';
import API_BASE_URL from '../constants/api';

const INSTRUMENT_OPTIONS = [
  'Barómetro de Cisneros',
  'Otro instrumento'
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

const getIndicatorGauge = (type, rawValue) => {
  const val = Math.max(0, Number(rawValue) || 0);
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

const AdminDashboard = () => {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('bitacora');
  const navigate = useNavigate();
  const role = localStorage.getItem('role');

  // 1. Estado para formulario de solicitud de etapa de la dependencia
  const [instrumentSelect, setInstrumentSelect] = useState('Barómetro de Cisneros');
  const [customInstrument, setCustomInstrument] = useState('');
  const [startDate, setStartDate] = useState('2026-11-01');
  const [endDate, setEndDate] = useState('2026-12-31');
  const [targetApplications, setTargetApplications] = useState(15);
  const [creatingStage, setCreatingStage] = useState(false);
  const [stageMessage, setStageMessage] = useState({ type: '', text: '' });

  // 3 y 4. Estado de búsqueda en tablas de su dependencia
  const [userSearch, setUserSearch] = useState('');
  const [evalSearch, setEvalSearch] = useState('');

  // 2. Estado para filtros en cascada del Dashboard / Bitácora de su dependencia
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedInstrument, setSelectedInstrument] = useState('');
  const [selectedStageId, setSelectedStageId] = useState('');

  const fetchAdminOverview = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/admin/overview`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = response.data;
      setOverview(data);

      if (data?.summary?.total_respondents > 0) {
        setTargetApplications(data.summary.total_respondents);
      }

      if (data?.stages?.length > 0 && !selectedStageId) {
        const first = data.stages[0];
        setSelectedYear(String(first.year));
        setSelectedInstrument(first.instrument_name);
        setSelectedStageId(String(first.id));
      }
    } catch (err) {
      console.error('Error fetching admin overview:', err);
      setError(err?.response?.data?.detail || 'Error al cargar el panel de Administración.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminOverview();
  }, []);

  const stages = overview?.stages || [];
  const adminDependencia = overview?.dependencia || 'Dirección de Obras Públicas';

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

  const handleCreateAdminStage = async (e) => {
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

    setCreatingStage(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `${API_BASE_URL}/api/admin/stages`,
        {
          instrument_name: finalInstrument,
          start_date: startDate,
          end_date: endDate,
          target_applications: Number(targetApplications) || 1
        },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        }
      );

      const created = res.data.stage;
      setStageMessage({
        type: 'success',
        text: `${res.data.message}: ${created.instrument_name} (${formatDateShort(created.start_date)} - ${formatDateShort(created.end_date)})`
      });

      await fetchAdminOverview();
      setSelectedYear(String(created.year));
      setSelectedInstrument(created.instrument_name);
      setSelectedStageId(String(created.id));
    } catch (err) {
      const detail = err?.response?.data?.detail || 'Error al solicitar la etapa de cuestionario.';
      setStageMessage({
        type: 'error',
        text: Array.isArray(detail) ? detail.map((d) => d.msg).join(' | ') : String(detail)
      });
    } finally {
      setCreatingStage(false);
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
        u.coordinacion.toLowerCase().includes(q) ||
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
        ev.departamento.toLowerCase().includes(q) ||
        ev.risk_level.toLowerCase().includes(q) ||
        ev.autor_acoso.toLowerCase().includes(q)
    );
  }, [overview, evalSearch]);

  if (loading && !overview) {
    return (
      <div className="container" style={{ textAlign: 'center', marginTop: '4rem' }}>
        Cargando panel de Administración...
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
    dependencia: adminDependencia,
    total_evaluations: 0,
    total_meta_evaluaciones: 0,
    total_departamentos: 0,
    risk_distribution: { leve: 0, medio: 0, grave: 0, leve_pct: 0, medio_pct: 0, grave_pct: 0 },
    averages: { imap: 0, igap: 0, neap: 0 },
    by_departamento: []
  };

  return (
    <div className="container" style={{ maxWidth: '1320px' }}>
      {/* Encabezado Principal */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Building2 size={32} color="var(--primary-color)" />
            <h1 style={{ margin: 0 }}>Panel de Administración</h1>
          </div>
          <p style={{ marginTop: '0.35rem', color: 'var(--text-secondary)' }}>
            Dependencia asignada: <strong style={{ color: 'var(--text-primary)' }}>{adminDependencia}</strong>
          </p>
        </div>

        {role === 'superadmin' && (
          <button
            onClick={() => navigate('/superadmin')}
            className="btn"
            style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.25rem' }}
          >
            <ShieldCheck size={18} />
            <span>Volver a Superadministrador</span>
          </button>
        )}
      </div>

      {/* Pestañas del Administrador */}
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
          1. DASHBOARD / BITÁCORA (SOLO DE SU DEPENDENCIA)
         ===================================================================== */}
      {activeTab === 'bitacora' && (
        <div>
          <div className="glass-card" style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
              <Search size={22} color="var(--primary-color)" />
              <h2 style={{ margin: 0 }}>Bitácora de Evaluaciones — {adminDependencia}</h2>
            </div>
            <p style={{ marginBottom: '1.5rem' }}>
              Filtra por año, instrumento y periodo habilitado para consultar los indicadores de tu dependencia.
            </p>

            {stages.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', border: '1px dashed var(--border-color)', borderRadius: '1rem' }}>
                <p style={{ marginBottom: '1rem' }}>No hay etapas de cuestionarios registradas para {adminDependencia}.</p>
                <button
                  type="button"
                  className="btn"
                  style={{ width: 'auto' }}
                  onClick={() => setActiveTab('etapas')}
                >
                  <CalendarPlus size={18} />
                  <span>Solicitar Etapa de Cuestionarios</span>
                </button>
              </div>
            ) : (
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
            )}
          </div>

          {selectedStageData && (
            <>
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

              <div className="glass-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div>
                    <h2 style={{ margin: 0 }}>{selectedStageData.instrument_name} — {adminDependencia}</h2>
                    <p style={{ marginTop: '0.25rem' }}>
                      Periodo seleccionado: <strong>{formatDateShort(selectedStageData.start_date)}</strong> al{' '}
                      <strong>{formatDateShort(selectedStageData.end_date)}</strong>
                    </p>
                  </div>
                  <span
                    className={
                      selectedStageData.approval_status === 'pending'
                        ? 'badge badge-warning'
                        : selectedStageData.is_currently_open
                          ? 'badge badge-success'
                          : 'badge badge-neutral'
                    }
                  >
                    {selectedStageData.approval_status === 'pending'
                      ? 'Pendiente de Aprobación por Superadministrador'
                      : selectedStageData.is_currently_open
                        ? 'Etapa Vigente y Abierta'
                        : 'Etapa Cerrada / Fuera de fecha'}
                  </span>
                </div>

                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Instrumento</th>
                        <th>Periodo Habilitado</th>
                        <th>Meta de Aplicaciones</th>
                        <th>Respondidos ({adminDependencia})</th>
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
          2. GENERAR ETAPA DE CUESTIONARIO (SOLO PARA SU DEPENDENCIA Y SUJETA A APROBACIÓN)
         ===================================================================== */}
      {activeTab === 'etapas' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="glass-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
              <CalendarPlus size={24} color="var(--primary-color)" />
              <h2 style={{ margin: 0 }}>Generar Etapa para mi Dependencia</h2>
            </div>
            <p style={{ marginBottom: '1.25rem' }}>
              Como administrador, puedes generar etapas de evaluación exclusivamente para <strong>{adminDependencia}</strong>. La solicitud requerirá la aprobación del Superadministrador antes de habilitarse a los usuarios.
            </p>

            <div
              style={{
                marginBottom: '1.5rem',
                padding: '0.75rem 1rem',
                borderRadius: '0.75rem',
                background: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                fontSize: '0.88rem',
                color: '#fbbf24'
              }}
            >
              <Clock size={18} />
              <span>Requiere aprobación del Superadministrador para activarse.</span>
            </div>

            <form onSubmit={handleCreateAdminStage}>
              <div className="form-group">
                <label>Dependencia asignada (fija)</label>
                <input
                  type="text"
                  value={adminDependencia}
                  disabled
                  style={{ opacity: 0.75, cursor: 'not-allowed' }}
                />
              </div>

              <div className="form-group">
                <label>Instrumento a solicitar</label>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label style={{ margin: 0 }}>Meta de aplicaciones para {adminDependencia}</label>
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
                      Usar total de mi dependencia ({overview.summary.total_respondents})
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
                <span>{creatingStage ? 'Enviando solicitud...' : 'Solicitar Etapa para Aprobación'}</span>
              </button>
            </form>
          </div>

          <div className="glass-card">
            <h2 style={{ marginBottom: '0.5rem' }}>Etapas de {adminDependencia} ({stages.length})</h2>
            <p style={{ marginBottom: '1.5rem' }}>
              Estado de aprobación y avance de las etapas aplicables a tu dependencia.
            </p>

            {stages.length === 0 ? (
              <p>No hay etapas registradas para esta dependencia.</p>
            ) : (
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Instrumento</th>
                      <th>Alcance</th>
                      <th>Periodo</th>
                      <th>Avance</th>
                      <th>Aprobación Superadmin</th>
                      <th>Vigencia</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stages.map((st) => {
                      const appStatus = st.approval_status || 'approved';
                      return (
                        <tr key={st.id}>
                          <td>#{st.id}</td>
                          <td><strong>{st.instrument_name}</strong></td>
                          <td>
                            <span className="badge badge-neutral">
                              {st.scope_label || adminDependencia}
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
                              {st.is_active && appStatus === 'approved' ? 'Habilitada' : 'Inactiva'}
                            </span>
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
          3. DATOS PERSONALES DE LOS USUARIOS DE SU DEPENDENCIA
         ===================================================================== */}
      {activeTab === 'usuarios' && (
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <h2 style={{ margin: 0 }}>Datos Personales de Usuarios — {adminDependencia}</h2>
              <p style={{ marginTop: '0.25rem' }}>
                Padrón de empleados pertenecientes a tu dependencia.
              </p>
            </div>

            <div style={{ minWidth: '280px' }}>
              <input
                type="text"
                placeholder="Buscar por nombre, No. empleado, CURP o departamento..."
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
                      No se encontraron usuarios en tu dependencia con ese criterio.
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
          4. RESULTADOS NOMINALES (OCULTANDO NOMBRE Y NO. EMPLEADO SI ES ANÓNIMO)
         ===================================================================== */}
      {activeTab === 'resultados' && (
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <h2 style={{ margin: 0 }}>Resultados de Usuarios que ya Respondieron — {adminDependencia}</h2>
              <p style={{ marginTop: '0.25rem' }}>
                Resultados de las evaluaciones de tu dependencia. Cuando el usuario marcó sus datos como <strong>anónimos</strong>, su nombre y número de empleado permanecen protegidos.
              </p>
            </div>

            <div style={{ minWidth: '280px' }}>
              <input
                type="text"
                placeholder="Filtrar por departamento, nivel de riesgo o empleado..."
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
                  <th>Departamento / Coordinación</th>
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
                      No hay evaluaciones registradas en tu dependencia para mostrar.
                    </td>
                  </tr>
                ) : (
                  filteredEvaluations.map((ev) => (
                    <tr key={ev.evaluation_id}>
                      <td>#{ev.evaluation_id}</td>
                      <td>
                        {ev.anonimo ? (
                          <span className="badge badge-neutral">Anónimo</span>
                        ) : (
                          <strong>{ev.num_empleado}</strong>
                        )}
                      </td>
                      <td>
                        {ev.anonimo ? (
                          <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Anónimo</span>
                        ) : (
                          ev.nombre_completo
                        )}
                      </td>
                      <td>
                        <div>{ev.departamento}</div>
                        <small style={{ color: 'var(--text-secondary)' }}>{ev.coordinacion}</small>
                      </td>
                      <td>
                        <span className="badge badge-neutral">
                          {ev.anonimo ? 'Anónimo' : 'Público'}
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
          5. TABLA GENERAL Y DISTRIBUCIÓN DE RIESGO (SEPARADA POR DEPARTAMENTOS)
         ===================================================================== */}
      {activeTab === 'riesgo' && (
        <div>
          <div className="stats-grid">
            <div className="stat-card">
              <AlertTriangle size={36} color="var(--success-color)" style={{ marginBottom: '0.75rem' }} />
              <div className="stat-value" style={{ color: 'var(--success-color)' }}>
                {riskOverview.risk_distribution.leve}
              </div>
              <div style={{ fontWeight: 600 }}>Leve o inexistente</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                {riskOverview.risk_distribution.leve_pct}% en {adminDependencia}
              </div>
            </div>

            <div className="stat-card">
              <AlertTriangle size={36} color="var(--warning-color)" style={{ marginBottom: '0.75rem' }} />
              <div className="stat-value" style={{ color: 'var(--warning-color)' }}>
                {riskOverview.risk_distribution.medio}
              </div>
              <div style={{ fontWeight: 600 }}>Riesgo Medio</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                {riskOverview.risk_distribution.medio_pct}% en {adminDependencia}
              </div>
            </div>

            <div className="stat-card">
              <AlertTriangle size={36} color="var(--danger-color)" style={{ marginBottom: '0.75rem' }} />
              <div className="stat-value" style={{ color: 'var(--danger-color)' }}>
                {riskOverview.risk_distribution.grave}
              </div>
              <div style={{ fontWeight: 600 }}>Grave a muy grave</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                {riskOverview.risk_distribution.grave_pct}% en {adminDependencia}
              </div>
            </div>
          </div>

          {/* Tabla de Conteo y Distribución de Riesgo de la Dependencia */}
          <div className="glass-card" style={{ marginBottom: '2rem' }}>
            <h2 style={{ marginBottom: '0.5rem' }}>Conteo y Distribución de Riesgo — {adminDependencia}</h2>
            <p style={{ marginBottom: '1.25rem' }}>
              Consolidado de tu dependencia (IMAP: {riskOverview.averages.imap} | IGAP: {riskOverview.averages.igap} | NEAP Promedio: {riskOverview.averages.neap}).
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
                    <td>Total de la Dependencia</td>
                    <td>{adminDependencia}</td>
                    <td>{riskOverview.total_evaluations}</td>
                    <td>{riskOverview.total_evaluations > 0 ? '100%' : '0%'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Tabla General de Riesgo por Departamentos de la Dependencia */}
          <div className="glass-card">
            <h2 style={{ marginBottom: '0.5rem' }}>Tabla General de Riesgo por Departamentos — {adminDependencia}</h2>
            <p style={{ marginBottom: '1.25rem' }}>
              Desglose por departamento dentro de {adminDependencia} y total global de la dependencia.
            </p>

            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th rowSpan={2}>Departamentos ({adminDependencia})</th>
                    <th colSpan={2} style={{ textAlign: 'center', borderBottom: '1px solid var(--border-color)' }}>
                      Total Evaluaciones
                    </th>
                    <th rowSpan={2}>Leve o inexistente</th>
                    <th rowSpan={2}>Medio</th>
                    <th rowSpan={2}>Grave a muy grave</th>
                    <th rowSpan={2}>IGAP Promedio</th>
                    <th rowSpan={2}>IMAP Promedio</th>
                    <th rowSpan={2}>NEAP Promedio</th>
                  </tr>
                  <tr>
                    <th>Meta de Encuestas/Evaluaciones</th>
                    <th>Encuestas/Evaluaciones Contestadas</th>
                  </tr>
                </thead>
                <tbody>
                  {(!riskOverview.by_departamento || riskOverview.by_departamento.length === 0) ? (
                    <tr>
                      <td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                        Sin departamentos registrados en tu dependencia para mostrar.
                      </td>
                    </tr>
                  ) : (
                    <>
                      {riskOverview.by_departamento.map((row, idx) => {
                        const metaVal = row.meta_evaluaciones ?? 0;
                        const contestadasVal = row.contestadas ?? 0;
                        return (
                          <tr key={row.departamento || idx}>
                            <td>
                              <div><strong>{row.departamento}</strong></div>
                              {row.coordinacion && (
                                <small style={{ color: 'var(--text-secondary)' }}>{row.coordinacion}</small>
                              )}
                            </td>
                            <td>
                              <strong>{metaVal}</strong>
                            </td>
                            <td>
                              <span className={contestadasVal >= metaVal && metaVal > 0 ? 'badge badge-success' : 'badge badge-neutral'}>
                                {contestadasVal}
                              </span>
                            </td>
                            <td>
                              <span className="badge badge-success">{row.leve}</span>
                            </td>
                            <td>
                              <span className="badge badge-warning">{row.medio}</span>
                            </td>
                            <td>
                              <span className="badge badge-danger">{row.grave}</span>
                            </td>
                            <td><strong>{row.igap}</strong></td>
                            <td><strong>{row.imap}</strong></td>
                            <td>{row.neap}</td>
                          </tr>
                        );
                      })}
                      <tr style={{ background: 'rgba(79, 70, 229, 0.14)', fontWeight: 700 }}>
                        <td>
                          Total Global de la Dependencia ({adminDependencia} — {riskOverview.total_departamentos ?? riskOverview.by_departamento.length} departamentos)
                        </td>
                        <td>
                          {riskOverview.total_meta_evaluaciones ??
                            riskOverview.by_departamento.reduce((acc, r) => acc + (r.meta_evaluaciones ?? 0), 0)}
                        </td>
                        <td>
                          {riskOverview.total_evaluations}
                        </td>
                        <td>
                          <span className="badge badge-success">{riskOverview.risk_distribution.leve}</span>
                        </td>
                        <td>
                          <span className="badge badge-warning">{riskOverview.risk_distribution.medio}</span>
                        </td>
                        <td>
                          <span className="badge badge-danger">{riskOverview.risk_distribution.grave}</span>
                        </td>
                        <td>{riskOverview.averages.igap}</td>
                        <td>{riskOverview.averages.imap}</td>
                        <td>{riskOverview.averages.neap}</td>
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

export default AdminDashboard;
