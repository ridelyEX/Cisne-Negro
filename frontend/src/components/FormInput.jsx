export const FormInput = ({ label, name, value, onChange, error, maxLength, type = "text" }) => (
  <div className="form-group">
    <label>{label}</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      maxLength={maxLength}
      style={name === 'curp' ? { textTransform: 'uppercase' } : {}}
      required
    />
    {error && <small className="error-text">{error}</small>}
  </div>
);