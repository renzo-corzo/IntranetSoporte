import axios from 'axios';
import { API_BASE_URL } from './config/api';

const API_URL = API_BASE_URL;

// Configuración de axios con token
const apiClient = (token: string) => axios.create({
  baseURL: API_URL,
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

export interface CategoriaTarea {
  id: number;
  nombre: string;
  descripcion?: string;
  color?: string;
  icono?: string;
  activa: boolean;
  creadoEn: string;
  _count?: {
    tareas: number;
  };
}

// Obtener todas las categorías de tareas
export const getCategoriasTarea = async (token: string): Promise<CategoriaTarea[]> => {
  const response = await apiClient(token).get('/categorias-tarea');
  return response.data;
};

// Obtener categoría por ID
export const getCategoriaTareaById = async (id: number, token: string): Promise<CategoriaTarea> => {
  const response = await apiClient(token).get(`/categorias-tarea/${id}`);
  return response.data;
};

// Crear nueva categoría
export const createCategoriaTarea = async (categoria: Partial<CategoriaTarea>, token: string): Promise<CategoriaTarea> => {
  const response = await apiClient(token).post('/categorias-tarea', categoria);
  return response.data;
};

// Actualizar categoría
export const updateCategoriaTarea = async (id: number, categoria: Partial<CategoriaTarea>, token: string): Promise<CategoriaTarea> => {
  const response = await apiClient(token).put(`/categorias-tarea/${id}`, categoria);
  return response.data;
};

// Eliminar categoría
export const deleteCategoriaTarea = async (id: number, token: string): Promise<void> => {
  await apiClient(token).delete(`/categorias-tarea/${id}`);
};

export default {
  getCategoriasTarea,
  getCategoriaTareaById,
  createCategoriaTarea,
  updateCategoriaTarea,
  deleteCategoriaTarea
};