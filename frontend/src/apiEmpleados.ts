import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token de autenticación
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const apiEmpleados = {
  // Listar todos los empleados
  listar: async (params?: { departamento?: string; activo?: boolean }) => {
    const response = await api.get('/empleados', { params });
    return response.data;
  },

  // Obtener empleado por ID
  obtener: async (id: number) => {
    const response = await api.get(`/empleados/${id}`);
    return response.data;
  },

  // Crear nuevo empleado
  crear: async (data: { nombre: string; departamento: string; activo?: boolean }) => {
    const response = await api.post('/empleados', data);
    return response.data;
  },

  // Actualizar empleado
  actualizar: async (id: number, data: { nombre?: string; departamento?: string; activo?: boolean }) => {
    const response = await api.put(`/empleados/${id}`, data);
    return response.data;
  },

  // Eliminar empleado (soft delete)
  eliminar: async (id: number) => {
    const response = await api.delete(`/empleados/${id}`);
    return response.data;
  },

  // Obtener departamentos únicos
  obtenerDepartamentos: async () => {
    const response = await api.get('/empleados/departamentos');
    return response.data;
  }
};

export default apiEmpleados;