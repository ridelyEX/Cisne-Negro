export const FormSelect = ({ label, name, value, onChange, error, options }) => (
  <div className="form-group">
    <label>{label}</label>
    <select name={name} value={value} onChange={onChange}>
      <option value="">--- Seleccione una opción ---</option>
      {options.map((opt, idx) => (
        <option key={idx} value={opt}>{opt}</option>
      ))}
    </select>
    {error && <small className="error-text">{error}</small>}
  </div>
);