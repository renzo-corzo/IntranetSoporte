import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL + '/vacaciones' || 'http://localhost:4001/api/vacaciones';

// Configurar axios con interceptores
const vacacionesApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token de autenticación
vacacionesApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar errores
vacacionesApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const vacacionesService = {
  // Obtener todas las vacaciones
  getVacaciones: async (filters?: {
    empleadoId?: string;
    estado?: string;
    departamento?: string;
    fechaInicio?: string;
    fechaFin?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters?.empleadoId) params.append('empleadoId', filters.empleadoId);
    if (filters?.estado) params.append('estado', filters.estado);
    if (filters?.departamento) params.append('departamento', filters.departamento);
    if (filters?.fechaInicio) params.append('fechaInicio', filters.fechaInicio);
    if (filters?.fechaFin) params.append('fechaFin', filters.fechaFin);

    const response = await vacacionesApi.get(`?${params.toString()}`);
    // El backend devuelve { success: true, data: [...] }
    // Adaptar a la forma consumida por los componentes: { data: [...] }
    if (response.data && response.data.success && Array.isArray(response.data.data)) {
      return { data: response.data.data };
    } else if (Array.isArray(response.data)) {
      return { data: response.data };
    } else if (response.data && Array.isArray(response.data.data)) {
      return { data: response.data.data };
    }
    return { data: [] };
  },

  // Crear solicitud de vacaciones
  createVacacion: async (vacacionData: {
    empleadoId: string;
    fechaInicio: string;
    fechaFin: string;
    observaciones?: string;
  }) => {
    try {
      console.log('📤 Enviando petición POST a /vacaciones con datos:', vacacionData);
      const response = await vacacionesApi.post('/', vacacionData);
      console.log('✅ Respuesta del servidor:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error en createVacacion:', error);
      console.error('❌ Respuesta del error:', error.response?.data);
      throw error;
    }
  },

  // Aprobar vacación
  aprobarVacacion: async (id: string, comentarioDecision?: string) => {
    const response = await vacacionesApi.put(`/${id}/aprobar`, {
      comentarioDecision
    });
    return response.data;
  },

  // Rechazar vacación
  rechazarVacacion: async (id: string, comentarioDecision?: string) => {
    const response = await vacacionesApi.put(`/${id}/rechazar`, {
      comentarioDecision
    });
    return response.data;
  },

  // Cancelar vacación
  cancelarVacacion: async (id: string) => {
    const response = await vacacionesApi.put(`/${id}/cancelar`);
    return response.data;
  },

  // Eliminar vacación
  eliminarVacacion: async (id: string) => {
    const response = await vacacionesApi.delete(`/${id}`);
    return response.data;
  }
};
