import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

export const getLinks = async (token: string) => {
  const res = await axios.get(`${API_URL}/links`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const createLink = async (link: any, token: string) => {
  const res = await axios.post(`${API_URL}/links`, link, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const updateLink = async (id: number, link: any, token: string) => {
  const res = await axios.put(`${API_URL}/links/${id}`, link, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const deleteLink = async (id: number, token: string) => {
  const res = await axios.delete(`${API_URL}/links/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}; 