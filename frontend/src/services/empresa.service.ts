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
  zabbixUrl?: string | null;
  zabbixUsuario?: string | null;
  zabbixConfigurado: boolean;
  createdAt: string;
  updatedAt: string;
}

interface EmpresaInput {
  nombre?: string;
  descripcion?: string;
  activo?: boolean;
  modulosHabilitados?: string[];
  zabbixUrl?: string;
  zabbixUsuario?: string;
  zabbixPassword?: string;
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
  data: { nombre: string } & EmpresaInput
): Promise<Empresa> => {
  const response = await axios.post(`${API_URL}/empresas`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const actualizarEmpresa = async (
  token: string,
  id: string,
  data: EmpresaInput
): Promise<Empresa> => {
  const response = await axios.put(`${API_URL}/empresas/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const probarConexionZabbix = async (
  token: string,
  data: { url: string; usuario: string; password: string }
): Promise<{ success: true }> => {
  const response = await axios.post(`${API_URL}/empresas/zabbix-test`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};
