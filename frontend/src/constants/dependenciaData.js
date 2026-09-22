// ============================================
// CATÁLOGOS BASE (sin repeticiones)
// ============================================
export const CATALOGO = {
  coordinaciones: {
    COORD_INFRA_URB: 'Coordinación de Infraestructura Urbana',
    COORD_INFRA_SOC: 'Coordinación de Infraestructura Social',
    COORD_EST_PROY: 'Coordinación de Estudios y Proyectos',
    COORD_MANT_VIAL: 'Coordinación de Mantenimiento Vial',
    COORD_SERV_ADM: 'Coordinación de Servicios Administrativos',
    COORD_TOPOGRAFIA: 'Coordinación de Topografía',
    COORD_JURIDICO: 'Coordinación Jurídica',
    COORD_LICITACIONES: 'Coordinación de Licitaciones',
    COORD_MAQUINARIA: 'Coordinación de Maquinaria Pesada',
  },
  puestos: {
    ASESOR_A: 'Asesor A',
    AUXILIAR: 'Auxiliar',
    AUXILIAR_ESP: 'Auxiliar especializado',
    CAPTURISTA: 'Capturista de datos',
    CHOFER: 'Chofer recolector de aseo urbano',
    CONSULTOR_JUR: 'Consultor jurídico',
    DIRECTOR_GRAL: 'Director general',
    JEFE_DEPTO: 'Jefe de departamento',
    JEFE_DIV: 'Jefe de división',
    JEFE_OFICINA: 'Jefe de oficina',
    LIDER_PROY: 'Líder de proyecto',
    MECANICO: 'Mecánico',
    OPERADOR_6: 'Operador de servicio 6',
    PERSONAL_ESP: 'Personal especializado',
    RESIDENTE_OBRA: 'Residente de obra',
    SUBDIRECTOR: 'Subdirector',
    SUP_OBRA: 'Supervisor de obra',
    SUP_SERVICIOS: 'Supervisor de servicios',
    TEC_ESP_ADM: 'Técnico especializado administrativo',
    TEC_SERV_OP: 'Técnico servicios y operaciones',
    TEC_VIGILANTE: 'Técnico vigilante',
  }
};

// ============================================
// RELACIONES: Dependencia → Coordinaciones + Puestos
// ============================================
export const DEPARTAMENTO_OPTIONS = [
  {
    key: 'INFRA_URB',
    label: 'Departamento de infraestructura urbana',
    coordinaciones: ['COORD_INFRA_URB', 'COORD_MANT_VIAL'],
    puestos: ['JEFE_DEPTO', 'SUP_OBRA', 'ASESOR_A', 'AUXILIAR']
  },
  {
    key: 'INFRA_SOC',
    label: 'Departamento de infraestructura social',
    coordinaciones: ['COORD_INFRA_SOC', 'COORD_EST_PROY'],
    puestos: ['JEFE_DEPTO', 'AUXILIAR_ESP', 'PERSONAL_ESP']
  },
  {
    key: 'EST_PROY',
    label: 'Departamento de estudios y proyectos',
    coordinaciones: ['COORD_EST_PROY'],
    puestos: ['LIDER_PROY', 'ASESOR_A', 'CAPTURISTA']
  },
  {
    key: 'MANT_VIAL',
    label: 'Departamento de mantenimiento vial e infraestructura',
    coordinaciones: ['COORD_MANT_VIAL'],
    puestos: ['SUP_OBRA', 'OPERADOR_6', 'MECANICO']
  },
  {
    key: 'SERV_ADM',
    label: 'Departamento de servicios administrativos obras públicas',
    coordinaciones: ['COORD_SERV_ADM'],
    puestos: ['AUXILIAR', 'CAPTURISTA', 'SUP_SERVICIOS']
  },
  {
    key: 'TOPOGRAFIA',
    label: 'Departamento de topografía',
    coordinaciones: ['COORD_TOPOGRAFIA'],
    puestos: ['TEC_ESP_ADM', 'AUXILIAR_ESP', 'PERSONAL_ESP']
  },
  {
    key: 'JURIDICO',
    label: 'Departamento de jurídico y afecciones',
    coordinaciones: ['COORD_JURIDICO'],
    puestos: ['CONSULTOR_JUR', 'ASESOR_A']
  },
  {
    key: 'LICITACIONES',
    label: 'Departamento de licitaciones y control de obra',
    coordinaciones: ['COORD_LICITACIONES'],
    puestos: ['JEFE_DEPTO', 'RESIDENTE_OBRA', 'SUPERVISOR_OBRA']
  },
  {
    key: 'MAQUINARIA',
    label: 'Departamento de maquinaria pesada y obras públicas',
    coordinaciones: ['COORD_MAQUINARIA'],
    puestos: ['MECANICO', 'OPERADOR_6', 'SUP_SERVICIOS']
  },
  {
    key: 'DESPACHO_SUBDIR_SOC',
    label: 'Despacho del subdirector de infraestructura social',
    coordinaciones: ['COORD_INFRA_SOC'],
    puestos: ['SUBDIRECTOR', 'ASESOR_A', 'AUXILIAR']
  },
  {
    key: 'DESPACHO_SUBDIR_URB',
    label: 'Despacho del subdirector de infraestructura urbana',
    coordinaciones: ['COORD_INFRA_URB'],
    puestos: ['SUBDIRECTOR', 'ASESOR_A', 'AUXILIAR']
  },
  {
    key: 'DESPACHO_DIRECTOR',
    label: 'Despacho del director de obras públicas',
    coordinaciones: ['COORD_INFRA_URB', 'COORD_INFRA_SOC', 'COORD_EST_PROY'],
    puestos: ['DIRECTOR_GRAL', 'ASESOR_A', 'CONSULTOR_JUR']
  }
];

// ============================================
// FUNCIONES HELPER
// ============================================

/**
 * Obtiene todas las opciones de dependencia con label
 */
export const getDependencias = () => {
  return DEPARTAMENTO_OPTIONS.map(d => ({
    key: d.key,
    label: d.label
  }));
};

/**
 * Obtiene coordinaciones expandidas por dependencia
 * @param {string} dependenciaKey - Clave de dependencia
 * @returns {Array} [{key, label}, ...]
 */
export const getCoordinacionesByDependencia = (dependenciaKey) => {
  const depto = DEPARTAMENTO_OPTIONS.find(d => d.key === dependenciaKey);
  if (!depto) return [];

  return depto.coordinaciones
    .map(key => ({
      key,
      label: CATALOGO.coordinaciones[key]
    }))
    .filter(c => c.label); // evita keys inexistentes
};

/**
 * Obtiene puestos expandidos por dependencia
 * @param {string} dependenciaKey - Clave de dependencia
 * @returns {Array} [{key, label}, ...]
 */
export const getPuestosByDependencia = (dependenciaKey) => {
  const depto = DEPARTAMENTO_OPTIONS.find(d => d.key === dependenciaKey);
  if (!depto) return [];

  return depto.puestos
    .map(key => ({
      key,
      label: CATALOGO.puestos[key]
    }))
    .filter(p => p.label); // evita keys inexistentes
};

/**
 * Bonus: Obtiene todas las coordinaciones únicas
 */
export const getAllCoordinaciones = () => {
  const coordKeys = new Set();
  DEPARTAMENTO_OPTIONS.forEach(d => {
    d.coordinaciones.forEach(k => coordKeys.add(k));
  });

  return Array.from(coordKeys)
    .map(key => ({
      key,
      label: CATALOGO.coordinaciones[key]
    }))
    .filter(c => c.label);
};

/**
 * Bonus: Obtiene todos los puestos únicos (sin duplicar)
 */
export const getAllPuestos = () => {
  const puestosKeys = new Set();
  DEPARTAMENTO_OPTIONS.forEach(d => {
    d.puestos.forEach(k => puestosKeys.add(k));
  });

  return Array.from(puestosKeys)
    .map(key => ({
      key,
      label: CATALOGO.puestos[key]
    }))
    .filter(p => p.label);
};

/**
 * Obtiene el label a partir de key
 */
export const getLabelByKey = (type, key) => {
  if (type === 'coordinacion') return CATALOGO.coordinaciones[key];
  if (type === 'puesto') return CATALOGO.puestos[key];
  return null;
};
