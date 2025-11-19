import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001/api';

const api = axios.create({
  baseURL: API_URL,
});

// Interceptor para agregar el token de autenticación
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interfaces TypeScript
export interface Interface {
  id: number;
  name: string;
  description?: string;
}

export interface InterfaceStats {
  bytes_sent: number;
  bytes_rcvd: number;
  bytes_total: number;
  bytes_sent_formatted: string;
  bytes_rcvd_formatted: string;
  bytes_total_formatted: string;
  bps_sent: number;
  bps_rcvd: number;
  bps_total: number;
  bps_sent_formatted: string;
  bps_rcvd_formatted: string;
  bps_total_formatted: string;
  packets_sent?: number;
  packets_rcvd?: number;
  flows?: number;
}

export interface TopHost {
  ip: string;
  name?: string;
  bytes_sent: number;
  bytes_rcvd: number;
  bytes_total: number;
  bytes_sent_formatted: string;
  bytes_rcvd_formatted: string;
  bytes_total_formatted: string;
  bps_sent: number;
  bps_rcvd: number;
  bps_total: number;
  bps_sent_formatted: string;
  bps_rcvd_formatted: string;
  bps_total_formatted: string;
  packets_sent?: number;
  packets_rcvd?: number;
}

export interface TopApplication {
  application: string;
  bytes: number;
  bytes_formatted: string;
  bps: number;
  bps_formatted: string;
  percentage?: number;
}

export interface TopCountry {
  country: string;
  bytes: number;
  bytes_formatted: string;
  bps: number;
  bps_formatted: string;
  percentage?: number;
}

// Obtener interfaces disponibles
export const getInterfaces = async (): Promise<Interface[]> => {
  const response = await api.get('/trafico/interfaces');
  return response.data;
};

// Obtener estadísticas de una interfaz
export const getInterfaceStats = async (ifid: number = 0): Promise<InterfaceStats> => {
  const response = await api.get(`/trafico/interfaces/${ifid}/stats`);
  return response.data;
};

// Obtener top hosts por tráfico
export const getTopHosts = async (params?: {
  ifid?: number;
  mode?: 'bytes' | 'packets' | 'flows';
  limit?: number;
}): Promise<TopHost[]> => {
  const response = await api.get('/trafico/top/hosts', { params });
  return response.data;
};

// Obtener hosts activos
export const getActiveHosts = async (ifid?: number): Promise<any[]> => {
  const response = await api.get('/trafico/hosts/active', { params: { ifid } });
  return response.data;
};

// Obtener estadísticas de un host específico
export const getHostStats = async (hostIp: string, vlanId?: number): Promise<any> => {
  const response = await api.get(`/trafico/hosts/${hostIp}/stats`, { params: { vlan: vlanId } });
  return response.data;
};

// Obtener top aplicaciones
export const getTopApplications = async (params?: {
  ifid?: number;
  limit?: number;
}): Promise<TopApplication[]> => {
  const response = await api.get('/trafico/top/applications', { params });
  return response.data;
};

// Obtener top países
export const getTopCountries = async (params?: {
  ifid?: number;
  limit?: number;
}): Promise<TopCountry[]> => {
  const response = await api.get('/trafico/top/countries', { params });
  return response.data;
};

