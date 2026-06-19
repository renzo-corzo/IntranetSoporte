import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const API_URL = API_BASE_URL;

export interface ConfiguracionSistema {
  id: number;
  rrhhHabilitado: boolean;
  updatedAt: string;
}

export const getConfiguracion = async (token: string): Promise<ConfiguracionSistema> => {
  const response = await axios.get(`${API_URL}/configuracion`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const actualizarConfiguracion = async (
  token: string,
  data: { rrhhHabilitado: boolean }
): Promise<ConfiguracionSistema> => {
  const response = await axios.put(`${API_URL}/configuracion`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};
