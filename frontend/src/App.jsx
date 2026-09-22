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
    if (token) {
      setUser({ token, role, username });
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
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
          element={user ? <MenuPrincipal user={user} onLogout={handleLogout} /> : <Navigate to="/login" />}
        />
        
        <Route 
          path="/cuestionario" 
          element={user && user.role !== 'admin' ? <CisnerosFormO /> : <Navigate to="/login" />}
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
