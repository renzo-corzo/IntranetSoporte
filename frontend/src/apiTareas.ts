import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

export const getTareas = async (token: string) => {
  const res = await axios.get(`${API_URL}/tareas`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const getTareaById = async (id: number, token: string) => {
  const res = await axios.get(`${API_URL}/tareas/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const createTarea = async (tarea: any, token: string) => {
  const res = await axios.post(`${API_URL}/tareas`, tarea, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const updateTarea = async (id: number, tarea: any, token: string) => {
  const res = await axios.put(`${API_URL}/tareas/${id}`, tarea, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const deleteTarea = async (id: number, token: string) => {
  const res = await axios.delete(`${API_URL}/tareas/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const addComentario = async (id: number, comentario: any, token: string) => {
  const res = await axios.post(`${API_URL}/tareas/${id}/comentarios`, comentario, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}; 