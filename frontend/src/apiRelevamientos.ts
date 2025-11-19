import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

export const getRelevamientos = async (token: string) => {
  const res = await axios.get(`${API_URL}/relevamientos`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const getRelevamientoById = async (id: number, token: string) => {
  const res = await axios.get(`${API_URL}/relevamientos/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const createRelevamiento = async (data: any, token: string) => {
  const res = await axios.post(`${API_URL}/relevamientos`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const updateRelevamiento = async (id: number, data: any, token: string) => {
  const res = await axios.put(`${API_URL}/relevamientos/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const deleteRelevamiento = async (id: number, token: string) => {
  const res = await axios.delete(`${API_URL}/relevamientos/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}; 