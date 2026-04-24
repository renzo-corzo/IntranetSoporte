import axios from 'axios';
import { buildApiUrl } from '../config/api';

const API_URL = buildApiUrl('/documentos');

// Configurar axios con interceptores
const documentosApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token de autenticación
documentosApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar errores
documentosApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const documentosService = {
  // Obtener documentos de un empleado
  getDocumentosEmpleado: async (empleadoId: string) => {
    const response = await documentosApi.get(`/empleado/${empleadoId}`);
    return response.data;
  },

  // Subir documento
  uploadDocumento: async (empleadoId: string, file: File, tipoArchivo?: string) => {
    const formData = new FormData();
    formData.append('archivo', file);
    if (tipoArchivo) formData.append('tipoArchivo', tipoArchivo);

    const response = await documentosApi.post(`/empleado/${empleadoId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Descargar documento
  downloadDocumento: async (id: string) => {
    const response = await documentosApi.get(`/${id}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Eliminar documento
  deleteDocumento: async (id: string) => {
    const response = await documentosApi.delete(`/${id}`);
    return response.data;
  },

  // Obtener tipos de documento
  getTiposDocumento: async () => {
    const response = await documentosApi.get('/tipos');
    return response.data;
  }
};
