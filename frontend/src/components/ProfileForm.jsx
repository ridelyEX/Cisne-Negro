import { FormInput } from './FormInput';
import { FormSelect } from './FormSelect';

export const ProfileForm = ({ profile, errors = {}, onChange }) => {
  const coordinacionOptions = [
    'Coordinación de Gestión Integral, Evaluación y Modernización',
    'Coordinación de Vinculación Social',
    'Coordinación Administrativa',
    'Coordinación Jurídica',
    'Subdirección de Infraestructura',
    'Subdirección de Estudios y Proyectos',
    'Despacho del director de obras públicas'
  ];

  const departamentoOptions = [
    'Despacho del Coordinación de Gestión Integral, Evaluación y Modernización',
    'Depto. de Gestión Integral y Modernización',
    'Despacho del Coordinador de Vinculación Social',
    'Depto. De Mantenimiento Vial',
    'Depto. De Maquinaria Pesada',
    'Depto. De Enlace Social',
    'Despacho del Coordinador Administrativo',
    'Depto. De Inversión',
    'Despacho del Coordinador Jurídico',
    'Depto. De Contratos y Comité de Obra',
    'Depto. De Auditoría, Transparencia y Archivo',
    'Despacho del Subdirector de Infraestructura',
    'Depto. De Construcción',
    'Depto. De Administración de Obra',
    'Despacho del Subdirector de Estudios y Proyectos',
    'Depto. De Topografía',
    'Depto. De Estudios y Proyectos Urbanos',
    'Depto. De Estudios y Proyectos Sociales',
    'Depto. De Costos e Integración de Expedientes',
    'Secretaría Técnica'
  ];

  const puestoOptions = [
    'Asesor A',
    'Auxiliar',
    'Auxiliar especializado',
    'Capturista de datos',
    'Chofer recolector de aseo urbano',
    'Consultor jurídico',
    'Director general',
    'Jefe de departamento',
    'Jefe de división',
    'Jefe de oficina',
    'Líder de proyecto',
    'Mecánico',
    'Operador de servicio 6',
    'Personal especializado',
    'Residente de obra',
    'Subdirector',
    'Supervisor de obra',
    'Supervisor de servicios',
    'Técnico especializado administrativo',
    'Técnico servicios y operaciones',
    'Técnico vigilante'
  ];

  return (
    <div>

      <FormInput
        label="Número de empleado"
        name="num_empleado"
        value={profile.num_empleado}
        onChange={onChange}
        error={errors.num_empleado}
        maxLength={6}
      />

      <h2>Datos Demográficos</h2>

      <FormInput
        label="CURP"
        name="curp"
        value={profile.curp}
        onChange={onChange}
        error={errors.curp}
        maxLength={18}
      />

      <FormInput
        label="Apellido Paterno"
        name="apellido_p"
        value={profile.apellido_p}
        onChange={onChange}
        error={errors.apellido_p}
        maxLength={40}
      />

      <FormInput
        label="Apellido Materno"
        name="apellido_m"
        value={profile.apellido_m}
        onChange={onChange}
        error={errors.apellido_m}
        maxLength={40}
      />

      <FormInput
        label="Nombre(s)"
        name="nombres"
        value={profile.nombres}
        onChange={onChange}
        error={errors.nombres}
        maxLength={60}
      />

      <FormSelect
        label="Dependencia"
        name="dependencia"
        value={profile.dependencia}
        onChange={onChange}
        error={errors.dependencia}
        options={['Dirección de Obras Públicas']}
      />

      <FormSelect
        label="Coordinación/Subdirección"
        name="coordinacion"
        value={profile.coordinacion}
        onChange={onChange}
        error={errors.coordinacion}
        options={coordinacionOptions}
      />

      <FormSelect
        label="Departamento"
        name="departamento"
        value={profile.departamento}
        onChange={onChange}
        error={errors.departamento}
        options={departamentoOptions}
      />

      <FormSelect
        label="Puesto"
        name="puesto"
        value={profile.puesto}
        onChange={onChange}
        error={errors.puesto}
        options={puestoOptions}
      />

      <FormInput
        label="Cargo"
        name="cargo"
        value={profile.cargo}
        onChange={onChange}
        error={errors.cargo}
        maxLength={100}
      />
    </div>
  );
};