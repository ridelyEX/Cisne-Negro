import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './components/Login';
import MenuPrincipal from './components/MenuPrincipal';
import CisnerosFormO from './CisnerosFormO';
import AdminDashboard from './components/AdminDashboard';
import { ShieldAlert } from 'lucide-react';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const username = localStorage.getItem('username');
    const privacyAccepted = localStorage.getItem("privacyAccepted") === "true";

    if (token) {
      setUser({ token, role, username, privacyAccepted });
    }
  }, []);

  const handleLogin = (userData) => {
      const nextUser = {
        ...userData,
        privacyAccepted: localStorage.getItem("privacyAccepted") === "true"
      };
    setUser(nextUser);
  };

  const handlePrivacyAccepted = () => {
    const nextUser = {
        ...user,
        privacyAccepted: true
    };
    setUser(nextUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    localStorage.removeItem('privacyAccepted');
    setUser(null);
  };

  return (
    <Router>
      <nav className="navbar">
        <div className="nav-brand">
          <ShieldAlert size={28} color="var(--primary-color)" />
          <span>Cisne Negro</span>
        </div>
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem'}}>
            <span style={{ color: 'var(--text-secondary)' }}>Sesión: {user.username}</span>
            <button onClick={handleLogout} className="btn" style={{ width: 'auto', padding: '0.5rem 1rem' }}>
              Cerrar Sesión
            </button>
          </div>
        )}
      </nav>
      
      <Routes>
        <Route 
          path="/login" 
          element={!user ? <Login onLogin={handleLogin} /> : <Navigate to={user.role === 'admin' ? '/admin' : '/menu'} />} 
        />

        <Route
          path="/menu"
          element={user ? <MenuPrincipal user={user} onLogout={handleLogout} onPrivacyAccepted={handlePrivacyAccepted} /> : <Navigate to="/login" />}
        />
        
        <Route 
          path="/cuestionario" 
          element={
              user && user.role !== 'admin' && user.privacyAccepted
              ? <CisnerosFormO />
              : <Navigate to="/menu" replace />
          }
        />
        
        <Route 
          path="/admin" 
          element={user && user.role === 'admin' ? <AdminDashboard /> : <Navigate to="/login" />} 
        />
        
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
