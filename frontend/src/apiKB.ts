import axios from 'axios';
import { API_BASE_URL } from './config/api';

const API_URL = API_BASE_URL;

// Configuración de axios con interceptor para token automático
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para agregar el token de autenticación automáticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Token inválido o expirado
      console.error('Error de autenticación:', error.response?.data);
      // Opcional: redirigir al login
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Categorías
export const getCategorias = async (token?: string) => {
  try {
    const response = await api.get('/kb/categorias');
    return response.data;
  } catch (error: any) {
    console.error('Error en getCategorias:', error);
    throw error;
  }
};

export const createCategoria = async (categoria: any, token?: string) => {
  const response = await api.post('/kb/categorias', categoria);
  return response.data;
};

export const updateCategoria = async (id: number, categoria: any, token?: string) => {
  const response = await api.put(`/kb/categorias/${id}`, categoria);
  return response.data;
};

export const deleteCategoria = async (id: number, token?: string) => {
  const response = await api.delete(`/kb/categorias/${id}`);
  return response.data;
};

// Artículos
export const getArticulos = async (token?: string, categoriaId?: number) => {
  try {
    const params = categoriaId ? { categoriaId } : {};
    const response = await api.get('/kb/articulos', { params });
    return response.data;
  } catch (error: any) {
    console.error('Error en getArticulos:', error);
    throw error;
  }
};

export const getArticuloById = async (id: number, token?: string) => {
  try {
    const response = await api.get(`/kb/articulos/${id}`);
    return response.data;
  } catch (error: any) {
    console.error('Error en getArticuloById:', error);
    throw error;
  }
};

export const createArticulo = async (articulo: any, token?: string) => {
  const response = await api.post('/kb/articulos', articulo);
  return response.data;
};

export const updateArticulo = async (id: number, articulo: any, token?: string) => {
  const response = await api.put(`/kb/articulos/${id}`, articulo);
  return response.data;
};

export const deleteArticulo = async (id: number, token?: string) => {
  const response = await api.delete(`/kb/articulos/${id}`);
  return response.data;
}; 