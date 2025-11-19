import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

export const getProcedimientos = async (token: string) => {
  const res = await axios.get(`${API_URL}/procedimientos`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const getProcedimientoById = async (id: number, token: string) => {
  const res = await axios.get(`${API_URL}/procedimientos/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const createProcedimiento = async (procedimiento: any, token: string) => {
  const res = await axios.post(`${API_URL}/procedimientos`, procedimiento, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const updateProcedimiento = async (id: number, procedimiento: any, token: string) => {
  const res = await axios.put(`${API_URL}/procedimientos/${id}`, procedimiento, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const deleteProcedimiento = async (id: number, token: string) => {
  const res = await axios.delete(`${API_URL}/procedimientos/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}; 