import axios from 'axios';

// Asegura baseURL por defecto en desarrollo
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export interface Vacacion {
  id: number;
  solicitanteId: number;
  fechaInicio: string;
  fechaFin: string;
  diasSolicitados: number;
  comentario?: string | null;
  estado: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA' | 'CANCELADA';
  creadoEn: string;
  actualizadoEn: string;
}

export async function crearSolicitud(data: {
  fechaInicio: string;
  fechaFin: string;
  comentario?: string;
}): Promise<Vacacion> {
  const res = await api.post('/vacaciones', data);
  return res.data;
}

export async function listarMias(params?: { page?: number; limit?: number }): Promise<{ total: number; page: number; limit: number; data: Vacacion[] }>{
  const res = await api.get('/vacaciones/mias', { params });
  return res.data;
}

export async function cancelarSolicitud(id: number): Promise<Vacacion> {
  const res = await api.post(`/vacaciones/${id}/cancelar`);
  return res.data;
}

// Admin
export async function listarTodas(params?: {
  estado?: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA' | 'CANCELADA';
  usuarioId?: number;
  desde?: string;
  hasta?: string;
  page?: number;
  limit?: number;
}): Promise<{ total: number; page: number; limit: number; data: (Vacacion & { solicitante?: any; decididoPor?: any })[] }>{
  const res = await api.get('/vacaciones', { params });
  return res.data;
}

export async function aprobarSolicitud(id: number, comentarioDecision?: string): Promise<Vacacion> {
  const res = await api.post(`/vacaciones/${id}/aprobar`, { comentarioDecision });
  return res.data;
}

export async function rechazarSolicitud(id: number, comentarioDecision?: string): Promise<Vacacion> {
  const res = await api.post(`/vacaciones/${id}/rechazar`, { comentarioDecision });
  return res.data;
}

// RRHH - Gestión completa
export async function crearSolicitudAdmin(data: {
  solicitanteId?: number;
  empleadoId?: number;
  fechaInicio: string;
  fechaFin: string;
  comentario?: string;
  estado?: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';
  ignorarSolapamientos?: boolean;
}): Promise<Vacacion> {
  const res = await api.post('/vacaciones/admin', data);
  return res.data;
}

export async function actualizarSolicitud(id: number, data: {
  solicitanteId?: number;
  empleadoId?: number;
  fechaInicio?: string;
  fechaFin?: string;
  comentario?: string;
  estado?: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';
}): Promise<Vacacion> {
  const res = await api.patch(`/vacaciones/${id}`, data);
  return res.data;
}

export async function eliminarSolicitud(id: number): Promise<{ message: string }> {
  const res = await api.delete(`/vacaciones/${id}`);
  return res.data;
}

// Export agrupado para compatibilidad con import { apiVacaciones }
export const apiVacaciones = {
  crearSolicitud,
  listarMias,
  cancelarSolicitud,
  listarTodas,
  aprobarSolicitud,
  rechazarSolicitud,
  crearSolicitudAdmin,
  actualizarSolicitud,
  eliminarSolicitud,
};


