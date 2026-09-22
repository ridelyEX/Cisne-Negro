import { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, Users, AlertTriangle } from 'lucide-react';
import API_BASE_URL from '../constants/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/statistics`);
        setStats(response.data);
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return <div className="container" style={{ textAlign: 'center', marginTop: '4rem' }}>Cargando estadísticas...</div>;
  }

  if (!stats) {
    return <div className="container" style={{ textAlign: 'center', marginTop: '4rem' }}>Error al cargar datos.</div>;
  }

  return (
    <div className="container">
      <div style={{ marginBottom: '2rem' }}>
        <h1>Panel de Administración</h1>
        <p>Estadísticas globales del Barómetro de Cisneros</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <Users size={32} color="var(--primary-color)" style={{ marginBottom: '1rem' }} />
          <div className="stat-value">{stats.total_evaluations}</div>
          <div style={{ color: 'var(--text-secondary)' }}>Evaluaciones Totales</div>
        </div>

        <div className="stat-card">
          <Activity size={32} color="var(--success-color)" style={{ marginBottom: '1rem' }} />
          <div className="stat-value">{stats.averages.imap}</div>
          <div style={{ color: 'var(--text-secondary)' }}>IMAP Promedio</div>
        </div>

        <div className="stat-card">
          <Activity size={32} color="var(--warning-color)" style={{ marginBottom: '1rem' }} />
          <div className="stat-value">{stats.averages.igap}</div>
          <div style={{ color: 'var(--text-secondary)' }}>IGAP Promedio</div>
        </div>
      </div>

      <h2 style={{ marginTop: '3rem' }}>Distribución de Riesgo</h2>
      <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <AlertTriangle size={48} color="var(--success-color)" style={{ marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{stats.risk_distribution.leve}</h3>
          <p style={{ color: 'var(--success-color)' }}>Leve o inexistente</p>
        </div>

        <div style={{ textAlign: 'center' }}>
          <AlertTriangle size={48} color="var(--warning-color)" style={{ marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{stats.risk_distribution.medio}</h3>
          <p style={{ color: 'var(--warning-color)' }}>Medio</p>
        </div>

        <div style={{ textAlign: 'center' }}>
          <AlertTriangle size={48} color="var(--danger-color)" style={{ marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{stats.risk_distribution.grave}</h3>
          <p style={{ color: 'var(--danger-color)' }}>Grave a muy grave</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;