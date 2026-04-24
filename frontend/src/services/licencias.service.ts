import axios from 'axios';
import { buildApiUrl } from '../config/api';

const API_URL = buildApiUrl('/licencias');

// Configurar axios con interceptores
const licenciasApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token de autenticación
licenciasApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar errores
licenciasApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const licenciasService = {
  // Obtener todas las licencias
  getLicencias: async (filters?: {
    empleadoId?: string;
    tipo?: string;
    fechaInicio?: string;
    fechaFin?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters?.empleadoId) params.append('empleadoId', filters.empleadoId);
    if (filters?.tipo) params.append('tipo', filters.tipo);
    if (filters?.fechaInicio) params.append('fechaInicio', filters.fechaInicio);
    if (filters?.fechaFin) params.append('fechaFin', filters.fechaFin);

    const response = await licenciasApi.get(`?${params.toString()}`);
    return response.data;
  },

  // Crear licencia
  createLicencia: async (licenciaData: {
    empleadoId: string;
    tipo: string;
    fechaInicio: string;
    fechaFin: string;
    observaciones?: string;
  }) => {
    const response = await licenciasApi.post('/', licenciaData);
    return response.data;
  },

  // Actualizar licencia
  updateLicencia: async (id: string, licenciaData: {
    tipo?: string;
    fechaInicio?: string;
    fechaFin?: string;
    observaciones?: string;
  }) => {
    const response = await licenciasApi.put(`/${id}`, licenciaData);
    return response.data;
  },

  // Eliminar licencia
  deleteLicencia: async (id: string) => {
    const response = await licenciasApi.delete(`/${id}`);
    return response.data;
  },

  // Obtener tipos de licencia
  getTiposLicencia: async () => {
    const response = await licenciasApi.get('/tipos');
    return response.data;
  }
};
