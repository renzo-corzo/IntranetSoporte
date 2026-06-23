import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const API_URL = API_BASE_URL;

// ===== TIPOS =====
export interface ServidorFisico {
  id: string;
  nombre: string;
  ip?: string;
  rol?: string;
  ubicacion?: string;
  serie?: string;
  garantia?: string;
  estado: 'PRODUCCION' | 'TEST' | 'FUERA_DE_SERVICIO' | 'MANTENIMIENTO';
  fechaAlta: string;
  fechaBaja?: string;
  notasTecnicas?: string;
  procesador?: string;
  ram?: string;
  almacenamiento?: string;
  sistemaOperativo?: string;
  fabricante?: string;
  modelo?: string;
  createdAt: string;
  updatedAt: string;
  maquinasVirtuales?: any[];
  servicios?: any[];
  _count?: {
    maquinasVirtuales: number;
    servicios: number;
  };
}

export interface MaquinaVirtual {
  id: string;
  nombre: string;
  ip?: string;
  sistemaOperativo?: string;
  rol?: string;
  estado: 'PRODUCCION' | 'TEST' | 'FUERA_DE_SERVICIO' | 'MANTENIMIENTO';
  fechaAlta: string;
  fechaBaja?: string;
  notasTecnicas?: string;
  hostId?: string;
  vcpu?: number;
  ram?: string;
  almacenamiento?: string;
  hipervisor?: string;
  createdAt: string;
  updatedAt: string;
  host?: ServidorFisico;
  servicios?: any[];
  _count?: {
    servicios: number;
  };
}

export interface EquipoRed {
  id: string;
  nombre: string;
  tipo: 'MIKROTIK' | 'PFSENSE' | 'SWITCH' | 'ACCESS_POINT' | 'ROUTER' | 'FIREWALL' | 'OTRO';
  ip?: string;
  ubicacion?: string;
  serie?: string;
  fabricante?: string;
  modelo?: string;
  estado: 'PRODUCCION' | 'TEST' | 'FUERA_DE_SERVICIO' | 'MANTENIMIENTO';
  fechaAlta: string;
  fechaBaja?: string;
  notasTecnicas?: string;
  firmware?: string;
  puertos?: number;
  createdAt: string;
  updatedAt: string;
}

export interface EquipoUsuario {
  id: string;
  nombre: string;
  tipo: 'PC' | 'NOTEBOOK' | 'IMPRESORA' | 'MONITOR' | 'TECLADO' | 'MOUSE' | 'OTRO';
  ip?: string;
  ubicacion?: string;
  serie?: string;
  fabricante?: string;
  modelo?: string;
  estado: 'PRODUCCION' | 'TEST' | 'FUERA_DE_SERVICIO' | 'MANTENIMIENTO';
  fechaAlta: string;
  fechaBaja?: string;
  notasTecnicas?: string;
  sistemaOperativo?: string;
  usuarioId?: string;
  area?: string;
  createdAt: string;
  updatedAt: string;
  usuario?: {
    id: string;
    nombre: string;
    apellido: string;
  };
}

export interface Servicio {
  id: string;
  nombre: string;
  tipo: 'SQL' | 'IIS' | 'ZABBIX' | 'PROXY' | 'NTOPNG' | 'DC' | 'DNS' | 'DHCP' | 'FILE_SERVER' | 'WEB_SERVER' | 'MAIL_SERVER' | 'BACKUP_SERVER' | 'VEEAM' | 'VMWARE' | 'HYPER_V' | 'WIFI' | 'OTRO';
  version?: string;
  puerto?: number;
  ssid?: string;
  estado: 'PRODUCCION' | 'TEST' | 'FUERA_DE_SERVICIO' | 'MANTENIMIENTO';
  fechaAlta: string;
  fechaBaja?: string;
  notasTecnicas?: string;
  tipoEquipo?: 'SERVIDOR_FISICO' | 'MAQUINA_VIRTUAL';
  servidorFisicoId?: string;
  maquinaVirtualId?: string;
  createdAt: string;
  updatedAt: string;
  servidorFisico?: ServidorFisico;
  maquinaVirtual?: MaquinaVirtual;
}

// Credenciales
export type TipoEquipoCredencial = 'SERVIDOR_FISICO' | 'MAQUINA_VIRTUAL' | 'EQUIPO_RED' | 'EQUIPO_USUARIO' | 'SERVICIO' | 'EMAIL' | 'ACCESO_REMOTO' | 'OTRO';

export interface Credencial {
  id: string;
  nombre: string;
  usuario?: string;
  url?: string;
  notas?: string;
  tipoEquipo: TipoEquipoCredencial;
  creadoEn: string;
  actualizadoEn: string;
  creadoPor?: { id: number; nombre: string };
}

// ===== SERVICIOS API =====

// Servidores Físicos
export const getServidoresFisicos = async (token: string, params?: any) => {
  const response = await axios.get(`${API_URL}/servidores-fisicos`, {
    headers: { Authorization: `Bearer ${token}` },
    params
  });
  return response.data;
};

export const getServidorFisico = async (id: string, token: string) => {
  const response = await axios.get(`${API_URL}/servidores-fisicos/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const createServidorFisico = async (data: Partial<ServidorFisico>, token: string) => {
  const response = await axios.post(`${API_URL}/servidores-fisicos`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const updateServidorFisico = async (id: string, data: Partial<ServidorFisico>, token: string) => {
  const response = await axios.put(`${API_URL}/servidores-fisicos/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const deleteServidorFisico = async (id: string, token: string) => {
  const response = await axios.delete(`${API_URL}/servidores-fisicos/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// Máquinas Virtuales
export const getMaquinasVirtuales = async (token: string, params?: any) => {
  const response = await axios.get(`${API_URL}/maquinas-virtuales`, {
    headers: { Authorization: `Bearer ${token}` },
    params
  });
  return response.data;
};

export const getMaquinaVirtual = async (id: string, token: string) => {
  const response = await axios.get(`${API_URL}/maquinas-virtuales/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const createMaquinaVirtual = async (data: Partial<MaquinaVirtual>, token: string) => {
  const response = await axios.post(`${API_URL}/maquinas-virtuales`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const updateMaquinaVirtual = async (id: string, data: Partial<MaquinaVirtual>, token: string) => {
  const response = await axios.put(`${API_URL}/maquinas-virtuales/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const deleteMaquinaVirtual = async (id: string, token: string) => {
  const response = await axios.delete(`${API_URL}/maquinas-virtuales/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// Equipos de Red
export const getEquiposRed = async (token: string, params?: any) => {
  const response = await axios.get(`${API_URL}/equipos-red`, {
    headers: { Authorization: `Bearer ${token}` },
    params
  });
  return response.data;
};

export const getEquipoRed = async (id: string, token: string) => {
  const response = await axios.get(`${API_URL}/equipos-red/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const createEquipoRed = async (data: Partial<EquipoRed>, token: string) => {
  const response = await axios.post(`${API_URL}/equipos-red`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const updateEquipoRed = async (id: string, data: Partial<EquipoRed>, token: string) => {
  const response = await axios.put(`${API_URL}/equipos-red/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const deleteEquipoRed = async (id: string, token: string) => {
  const response = await axios.delete(`${API_URL}/equipos-red/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// Equipos de Usuario
export const getEquiposUsuario = async (token: string, params?: any) => {
  const response = await axios.get(`${API_URL}/equipos-usuario`, {
    headers: { Authorization: `Bearer ${token}` },
    params
  });
  return response.data;
};

export const getEquipoUsuario = async (id: string, token: string) => {
  const response = await axios.get(`${API_URL}/equipos-usuario/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const createEquipoUsuario = async (data: Partial<EquipoUsuario>, token: string) => {
  const response = await axios.post(`${API_URL}/equipos-usuario`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const updateEquipoUsuario = async (id: string, data: Partial<EquipoUsuario>, token: string) => {
  const response = await axios.put(`${API_URL}/equipos-usuario/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const deleteEquipoUsuario = async (id: string, token: string) => {
  const response = await axios.delete(`${API_URL}/equipos-usuario/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// Servicios
export const getServicios = async (token: string, params?: any) => {
  const response = await axios.get(`${API_URL}/servicios`, {
    headers: { Authorization: `Bearer ${token}` },
    params
  });
  return response.data;
};

export const getServicio = async (id: string, token: string) => {
  const response = await axios.get(`${API_URL}/servicios/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const createServicio = async (data: Partial<Servicio>, token: string) => {
  const response = await axios.post(`${API_URL}/servicios`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const updateServicio = async (id: string, data: Partial<Servicio>, token: string) => {
  const response = await axios.put(`${API_URL}/servicios/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const deleteServicio = async (id: string, token: string) => {
  const response = await axios.delete(`${API_URL}/servicios/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// Credenciales
export const getCredenciales = async (tipoEquipo: TipoEquipoCredencial, equipoId: string, token: string) => {
  const response = await axios.get(`${API_URL}/credenciales`, {
    headers: { Authorization: `Bearer ${token}` },
    params: { tipoEquipo, equipoId }
  });
  return response.data as Credencial[];
};

export const createCredencial = async (
  data: { nombre: string; usuario?: string; password: string; notas?: string; tipoEquipo: TipoEquipoCredencial; equipoId: string },
  token: string
) => {
  const response = await axios.post(`${API_URL}/credenciales`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data as Credencial;
};

export const updateCredencial = async (
  id: string,
  data: { nombre: string; usuario?: string; password?: string; notas?: string },
  token: string
) => {
  const response = await axios.put(`${API_URL}/credenciales/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data as Credencial;
};

export const deleteCredencial = async (id: string, token: string) => {
  const response = await axios.delete(`${API_URL}/credenciales/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const revelarCredencial = async (id: string, token: string) => {
  const response = await axios.post(`${API_URL}/credenciales/${id}/revelar`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data as { password: string };
};

// Accesos (bóveda standalone: credenciales sin equipo del CMDB asociado)
export const getAccesos = async (
  token: string,
  params?: { tipoEquipo?: TipoEquipoCredencial; buscar?: string }
) => {
  const response = await axios.get(`${API_URL}/credenciales`, {
    headers: { Authorization: `Bearer ${token}` },
    params
  });
  return response.data as Credencial[];
};

export const crearAcceso = async (
  data: { nombre: string; tipoEquipo: TipoEquipoCredencial; usuario?: string; password: string; url?: string; notas?: string },
  token: string
) => {
  const response = await axios.post(`${API_URL}/credenciales`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data as Credencial;
};

export const actualizarAcceso = async (
  id: string,
  data: { nombre?: string; usuario?: string; password?: string; url?: string; notas?: string },
  token: string
) => {
  const response = await axios.put(`${API_URL}/credenciales/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data as Credencial;
};

