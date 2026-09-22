import { useState } from 'react';
import axios from 'axios';
import API_BASE_URL from '../constants/api';

export const useLoginForm = (onLogin) => {
  const [mode, setMode] = useState('login');
  const [usernameVal, setUsernameVal] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile((p) => ({ ...p, [name]: value }));
  };

  const handleUsernameChange = (e) => setUsernameVal(e.target.value);
  const handlePasswordChange = (e) => setPassword(e.target.value);

  const handleLogin = async (e) => {
    e?.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/login`, {
        username: usernameVal,
        password
      });

      const { token, role } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('role', role);
      localStorage.setItem('username', usernameVal);

      if (typeof onLogin === 'function') {
        onLogin({ token, role, username: usernameVal });
      }
    } catch (err) {
      const detail = err?.response?.data?.detail ?? 'Credenciales inválidas';
      setError(typeof detail === 'string' ? detail : JSON.stringify(detail));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e?.preventDefault();
    setError('');
    setLoading(true);

    const required = [
      'nombres',
      'apellido_p',
      'apellido_m',
      'curp',
      'dependencia',
      'coordinacion',
      'departamento',
      'puesto',
      'cargo'
    ];

    const missing = required.filter((field) => !profile[field]?.toString().trim());
    if (missing.length > 0) {
      setError(`Faltan campos obligatorios: ${missing.join(', ')}`);
      setLoading(false);
      return;
    }

    if ((profile.curp || '').trim().length !== 18) {
      setError('La CURP debe tener exactamente 18 caracteres.');
      setLoading(false);
      return;
    }

    if (!usernameVal || !password) {
      setError('Usuario y contraseña son requeridos.');
      setLoading(false);
      return;
    }

    try {
      // Crear usuario + datos demográficos en el mismo request
      const createRes = await axios.post(`${API_BASE_URL}/api/crear-usuario`, {
        username: usernameVal,
        password,
        nombres: profile.nombres,
        curp: profile.curp.trim().toUpperCase(),
        apellido_p: profile.apellido_p,
        apellido_m: profile.apellido_m,
        dependencia: profile.dependencia,
        coordinacion: profile.coordinacion,
        departamento: profile.departamento,
        puesto: profile.puesto,
        cargo: profile.cargo
      });

      const respondentId = createRes.data?.id ?? createRes.data?.respondent_id;
      if (respondentId) {
        localStorage.setItem('respondent_id', respondentId);
      }

      // Luego iniciar sesión con ese usuario recién creado
      const loginRes = await axios.post(`${API_BASE_URL}/api/login`, {
        username: usernameVal,
        password
      });

      const { token, role } = loginRes.data;
      localStorage.setItem('token', token);
      localStorage.setItem('role', role);
      localStorage.setItem('username', usernameVal);

      if (typeof onLogin === 'function') {
        onLogin({ token, role, username: usernameVal });
      }

    } catch (err) {
      const detail = err?.response?.data?.detail ?? err?.response?.data ?? 'Error al registrar';
      setError(Array.isArray(detail) ? detail.map(d => d.msg).join(' | ') : detail);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return {
    mode,
    setMode,
    usernameVal,
    password,
    errors,
    loading,
    profile,
    handleProfileChange,
    handleUsernameChange,
    handlePasswordChange,
    handleLogin,
    handleRegister
  };
};