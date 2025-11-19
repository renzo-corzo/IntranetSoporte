import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4001/api";

export const getUsuarios = async (token: string) => {
  const res = await axios.get(`${API_URL}/usuarios`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const getUsuarioById = async (id: number, token: string) => {
  const res = await axios.get(`${API_URL}/usuarios/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const createUsuario = async (usuario: any, token: string) => {
  const res = await axios.post(`${API_URL}/usuarios`, usuario, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const updateUsuario = async (id: number, usuario: any, token: string) => {
  const res = await axios.put(`${API_URL}/usuarios/${id}`, usuario, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const deleteUsuario = async (id: number, token: string) => {
  const res = await axios.delete(`${API_URL}/usuarios/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const getRoles = async (token: string) => {
  const res = await axios.get(`${API_URL}/usuarios/roles`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const getRolePermissions = async (id: number, token: string) => {
  const res = await axios.get(`${API_URL}/usuarios/roles/${id}/permisos`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data as { id: number; nombre: string; permisos: string[] };
};

export const updateRolePermissions = async (id: number, permisos: string[], token: string) => {
  const res = await axios.put(
    `${API_URL}/usuarios/roles/${id}/permisos`,
    { permisos },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data as { id: number; nombre: string; permisos: string[] };
};

export const getPermissionsCatalog = async (token: string) => {
  const res = await axios.get(`${API_URL}/usuarios/roles/permisos/catalogo`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data as Record<string, string[]>;
};

export const createRol = async (rol: any, token: string) => {
  const res = await axios.post(`${API_URL}/usuarios/roles`, rol, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const updateRol = async (id: number, rol: any, token: string) => {
  const res = await axios.put(`${API_URL}/usuarios/roles/${id}`, rol, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const deleteRol = async (id: number, token: string) => {
  const res = await axios.delete(`${API_URL}/usuarios/roles/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

// Exportación para compatibilidad con VacacionesRRHH
export const apiUsuarios = {
  listar: async () => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No token found');
    
    const res = await axios.get(`${API_URL}/usuarios`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },
  listarConDepartamento: async () => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No token found');

    const res = await axios.get(`${API_URL}/usuarios/con-departamento`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  }
}; 