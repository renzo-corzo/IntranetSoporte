import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const API_URL = API_BASE_URL;

export const MODULOS_DISPONIBLES = [
  { key: 'cmdb', label: 'CMDB' },
  { key: 'stock', label: 'Stock' },
  { key: 'tareas', label: 'Tareas' },
  { key: 'relevamientos', label: 'Relevamientos' },
  { key: 'procedimientos', label: 'Procedimientos' },
  { key: 'kb', label: 'Base de Conocimiento' },
] as const;

export interface Empresa {
  id: string;
  nombre: string;
  descripcion?: string | null;
  activo: boolean;
  modulosHabilitados: string[];
  createdAt: string;
  updatedAt: string;
}

export const getEmpresas = async (token: string, incluirInactivas = false): Promise<Empresa[]> => {
  const response = await axios.get(`${API_URL}/empresas`, {
    headers: { Authorization: `Bearer ${token}` },
    params: incluirInactivas ? { incluirInactivas: 'true' } : undefined
  });
  return response.data;
};

export const crearEmpresa = async (
  token: string,
  data: { nombre: string; descripcion?: string; modulosHabilitados?: string[] }
): Promise<Empresa> => {
  const response = await axios.post(`${API_URL}/empresas`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const actualizarEmpresa = async (
  token: string,
  id: string,
  data: { nombre?: string; descripcion?: string; activo?: boolean; modulosHabilitados?: string[] }
): Promise<Empresa> => {
  const response = await axios.put(`${API_URL}/empresas/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};
