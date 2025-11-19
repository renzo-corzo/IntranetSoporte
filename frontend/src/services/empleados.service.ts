import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL + '/empleados' || 'http://localhost:4001/api/empleados';

// Configurar axios con interceptores
const empleadosApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token de autenticación
empleadosApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar errores
empleadosApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const empleadosService = {
  // Obtener todos los empleados
  getEmpleados: async (filters?: {
    departamento?: string;
    estado?: string;
    search?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters?.departamento) params.append('departamento', filters.departamento);
    if (filters?.estado) params.append('estado', filters.estado);
    if (filters?.search) params.append('search', filters.search);

    const response = await empleadosApi.get(`?${params.toString()}`);
    return { data: response.data };
  },

  // Obtener empleado por ID
  getEmpleadoById: async (id: string) => {
    const response = await empleadosApi.get(`/${id}`);
    return response.data;
  },

  // Crear empleado
  createEmpleado: async (empleadoData: {
    nombre: string;
    apellido: string;
    dni: string;
    email: string;
    departamento: string;
    fechaIngreso: string;
    diasDisponibles?: number;
    diasBase2023?: number | null;
  }) => {
    const response = await empleadosApi.post('/', empleadoData);
    return response.data;
  },

  // Actualizar empleado
  updateEmpleado: async (id: string, empleadoData: {
    nombre?: string;
    apellido?: string;
    dni?: string;
    email?: string;
    departamento?: string;
    estado?: string;
    fechaIngreso?: string;
    diasDisponibles?: number;
    diasBase2023?: number | null;
  }) => {
    const response = await empleadosApi.put(`/${id}`, empleadoData);
    return response.data;
  },

  // Eliminar empleado
  deleteEmpleado: async (id: string) => {
    const response = await empleadosApi.delete(`/${id}`);
    return response.data;
  },

  // Obtener departamentos
  getDepartamentos: async () => {
    const response = await empleadosApi.get('/departamentos');
    return { data: response.data };
  },

  // Obtener estadísticas
  getEstadisticas: async () => {
    const response = await empleadosApi.get('/estadisticas');
    return response.data;
  },

  // Calcular días sugeridos según convenio
  calcularDiasSugeridos: async (id: string, diasBase2023?: number) => {
    const params = new URLSearchParams();
    if (diasBase2023 !== undefined) {
      params.append('diasBase2023', diasBase2023.toString());
    }
    const response = await empleadosApi.get(`/${id}/calcular-dias?${params.toString()}`);
    return response.data;
  }
};
