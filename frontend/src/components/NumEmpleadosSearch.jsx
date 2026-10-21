import { useState, useEffect } from 'react';
import API_BASE_URL from '../constants/api';
import '../css/NumEmpleadosSearch.css';

export const NumEmpleadosSearch = ({ value, onChange, error }) => {
  const [inputValue, setInputValue] = useState(value || '');
  const [empleados, setEmpleados] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Sincroniza si el valor viene desde el padre
  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  // Buscar coincidencias mientras escribe
  useEffect(() => {
    const fetchEmpleados = async () => {
      const query = inputValue.trim();

      if (query.length === 0) {
        setEmpleados([]);
        setIsOpen(false);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/num-empleado/search?query=${encodeURIComponent(query)}`
        );
        const data = await response.json();
        setEmpleados(data.empleados || []);
        setIsOpen(true);
      } catch (err) {
        console.error('Error fetching empleados:', err);
        setEmpleados([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchEmpleados, 300);
    return () => clearTimeout(debounceTimer);
  }, [inputValue]);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    // Si el usuario escribe algo distinto, actualiza el valor del formulario
    onChange({
      target: {
        name: 'num_empleado',
        value: newValue
      }
    });
  };

  const handleSelectEmpleado = (numEmpleado) => {
    setInputValue(numEmpleado);
    setIsOpen(false);
    setEmpleados([]);

    onChange({
      target: {
        name: 'num_empleado',
        value: numEmpleado
      }
    });
  };

  const handleInputFocus = () => {
    if (empleados.length > 0) {
      setIsOpen(true);
    }
  };

  const handleInputBlur = () => {
    setTimeout(() => setIsOpen(false), 200);
  };

  return (
    <div className="num-empleado-search">
      <label htmlFor="num_empleado" className="form-label">
        Número de empleado
      </label>

      <div className="search-input-wrapper">
        <input
          id="num_empleado"
          type="text"
          className={`search-input ${error ? 'input-error' : ''}`}
          placeholder="Ingresa número de empleado..."
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          autoComplete="off"
        />

        {isLoading && <span className="spinner">⟳</span>}
      </div>

      {isOpen && empleados.length > 0 && (
        <ul className="dropdown-list">
          {empleados.map((empleado) => (
            <li
              key={empleado.id}
              className="dropdown-item"
              onMouseDown={() => handleSelectEmpleado(empleado.num_empleado)}
            >
              <span className="empleado-number">{empleado.num_empleado}</span>
              <span className="empleado-username">({empleado.username})</span>
            </li>
          ))}
        </ul>
      )}

      {isOpen && inputValue.length > 0 && empleados.length === 0 && !isLoading && (
        <div className="no-results">
          No se encontraron resultados para "{inputValue}"
        </div>
      )}

      {error && <span className="error-message">{error}</span>}
    </div>
  );
};