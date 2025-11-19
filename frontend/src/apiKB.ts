import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

// Configuración de axios con token
const apiClient = (token: string) => axios.create({
  baseURL: API_URL,
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

// Categorías
export const getCategorias = async (token: string) => {
  const response = await apiClient(token).get('/kb/categorias');
  return response.data;
};

export const createCategoria = async (categoria: any, token: string) => {
  const response = await apiClient(token).post('/kb/categorias', categoria);
  return response.data;
};

export const updateCategoria = async (id: number, categoria: any, token: string) => {
  const response = await apiClient(token).put(`/kb/categorias/${id}`, categoria);
  return response.data;
};

export const deleteCategoria = async (id: number, token: string) => {
  const response = await apiClient(token).delete(`/kb/categorias/${id}`);
  return response.data;
};

// Artículos
export const getArticulos = async (token: string, categoriaId?: number) => {
  const params = categoriaId ? { categoriaId } : {};
  const response = await apiClient(token).get('/kb/articulos', { params });
  return response.data;
};

export const getArticuloById = async (id: number, token: string) => {
  const response = await apiClient(token).get(`/kb/articulos/${id}`);
  return response.data;
};

export const createArticulo = async (articulo: any, token: string) => {
  const response = await apiClient(token).post('/kb/articulos', articulo);
  return response.data;
};

export const updateArticulo = async (id: number, articulo: any, token: string) => {
  const response = await apiClient(token).put(`/kb/articulos/${id}`, articulo);
  return response.data;
};

export const deleteArticulo = async (id: number, token: string) => {
  const response = await apiClient(token).delete(`/kb/articulos/${id}`);
  return response.data;
}; 