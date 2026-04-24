import axios from "axios";
import { API_BASE_URL } from "./config/api";

const API_URL = API_BASE_URL;

const authHeader = (token: string) => ({
  headers: { Authorization: `Bearer ${token}` }
});

export const getTareas = async (token: string) => {
  const res = await axios.get(`${API_URL}/tareas`, authHeader(token));
  return res.data;
};

export const getTareasFiltradas = async (token: string, params: Record<string, any>) => {
  const res = await axios.get(`${API_URL}/tareas`, {
    ...authHeader(token),
    params
  });
  return res.data;
};

export const getTareaById = async (id: number, token: string) => {
  const res = await axios.get(`${API_URL}/tareas/${id}`, authHeader(token));
  return res.data;
};

export const getTareasKpis = async (token: string, params?: Record<string, any>) => {
  const res = await axios.get(`${API_URL}/tareas/kpis`, {
    ...authHeader(token),
    params
  });
  return res.data;
};

export const getTareasTablero = async (token: string, params?: Record<string, any>) => {
  const res = await axios.get(`${API_URL}/tareas/tablero`, {
    ...authHeader(token),
    params
  });
  return res.data;
};

export const getTareasAgenda = async (token: string, params?: Record<string, any>) => {
  const res = await axios.get(`${API_URL}/tareas/agenda`, {
    ...authHeader(token),
    params
  });
  return res.data;
};

export const createTarea = async (tarea: any, token: string) => {
  const res = await axios.post(`${API_URL}/tareas`, tarea, authHeader(token));
  return res.data;
};

export const updateTarea = async (id: number, tarea: any, token: string) => {
  const res = await axios.put(`${API_URL}/tareas/${id}`, tarea, authHeader(token));
  return res.data;
};

export const updateEstadoTarea = async (
  id: number,
  payload: { estado: string; observacion?: string },
  token: string
) => {
  const res = await axios.patch(`${API_URL}/tareas/${id}/estado`, payload, authHeader(token));
  return res.data;
};

export const asignarResponsableTarea = async (
  id: number,
  payload: { responsableId: number | null },
  token: string
) => {
  const res = await axios.patch(`${API_URL}/tareas/${id}/asignacion`, payload, authHeader(token));
  return res.data;
};

export const cerrarTarea = async (id: number, payload: { observacion?: string }, token: string) => {
  const res = await axios.post(`${API_URL}/tareas/${id}/cerrar`, payload, authHeader(token));
  return res.data;
};

export const reabrirTarea = async (
  id: number,
  payload: { estadoDestino?: "pendiente" | "en_curso" },
  token: string
) => {
  const res = await axios.post(`${API_URL}/tareas/${id}/reabrir`, payload, authHeader(token));
  return res.data;
};

export const deleteTarea = async (id: number, token: string) => {
  const res = await axios.delete(`${API_URL}/tareas/${id}`, authHeader(token));
  return res.data;
};

export const addComentario = async (id: number, comentario: any, token: string) => {
  const res = await axios.post(`${API_URL}/tareas/${id}/comentarios`, comentario, authHeader(token));
  return res.data;
};

export const getComentariosTarea = async (id: number, token: string) => {
  const res = await axios.get(`${API_URL}/tareas/${id}/comentarios`, authHeader(token));
  return res.data;
};

export const completarTarea = async (
  id: number,
  payload: { observacion?: string },
  token: string
) => {
  const res = await axios.post(`${API_URL}/tareas/${id}/completar`, payload, authHeader(token));
  return res.data;
};

export const getUsuarios = async (token: string) => {
  const res = await axios.get(`${API_URL}/usuarios`, authHeader(token));
  return res.data;
}; 