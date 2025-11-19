import React, { useEffect, useState } from "react";
import { getUsuarios, getRoles, createUsuario, updateUsuario, deleteUsuario } from "../apiUsuarios";
import { useAuth } from "../context/AuthContext";
import UsuarioForm from "../components/UsuarioForm";

const Usuarios: React.FC = () => {
  const { token } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [filtroRol, setFiltroRol] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchUsuarios = async () => {
    if (!token) return;
    setLoading(true);
    const data = await getUsuarios(token);
    setUsuarios(data);
    setLoading(false);
  };
  const fetchRoles = async () => {
    if (!token) return;
    const data = await getRoles(token);
    setRoles(data);
  };
  useEffect(() => { fetchUsuarios(); fetchRoles(); }, [token]);

  const handleCreateOrEdit = async (form: any) => {
    if (!token) return;
    if (editUser) {
      await updateUsuario(editUser.id, form, token);
    } else {
      await createUsuario(form, token);
    }
    setShowForm(false);
    setEditUser(null);
    fetchUsuarios();
  };
  const handleDelete = async (id: number) => {
    if (!token) return;
    if (!window.confirm("¿Eliminar usuario?")) return;
    await deleteUsuario(id, token);
    fetchUsuarios();
  };

  const usuariosFiltrados = usuarios.filter(u =>
    (!filtroRol || u.rolId === Number(filtroRol)) &&
    (!busqueda || u.nombre.toLowerCase().includes(busqueda.toLowerCase()) || u.username.toLowerCase().includes(busqueda.toLowerCase()) || (u.email || "").toLowerCase().includes(busqueda.toLowerCase()))
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Usuarios</h1>
          <p className="text-gray-600 mt-1">Administra usuarios y permisos del sistema</p>
        </div>
        <button 
          onClick={() => { setEditUser(null); setShowForm(true); }} 
          className="btn-primary"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Nuevo Usuario
        </button>
      </div>

      {/* Filtros */}
      <div className="card">
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Filtrar por rol</label>
              <select 
                value={filtroRol} 
                onChange={e => setFiltroRol(e.target.value)} 
                className="form-select"
              >
                <option value="">Todos los roles</option>
                {roles.map(r => (
                  <option key={r.id} value={r.id}>{r.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Buscar usuario</label>
              <input 
                type="text" 
                placeholder="Nombre, usuario o email..." 
                value={busqueda} 
                onChange={e => setBusqueda(e.target.value)} 
                className="form-input"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de usuarios */}
      <div className="table-modern">
        <div className="table-header">
          <h3 className="text-lg font-semibold text-gray-900">
            Usuarios ({usuariosFiltrados.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-cell font-semibold text-gray-900 text-left">Usuario</th>
                <th className="table-cell font-semibold text-gray-900 text-left">Nombre Completo</th>
                <th className="table-cell font-semibold text-gray-900 text-left">Email</th>
                <th className="table-cell font-semibold text-gray-900 text-left">Rol</th>
                <th className="table-cell font-semibold text-gray-900 text-center">Estado</th>
                <th className="table-cell font-semibold text-gray-900 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="table-cell text-center py-12">
                    <div className="flex items-center justify-center space-x-2">
                      <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="text-gray-500">Cargando usuarios...</span>
                    </div>
                  </td>
                </tr>
              ) : usuariosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="table-cell text-center py-12">
                    <div className="text-gray-500">
                      <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <p>No se encontraron usuarios</p>
                    </div>
                  </td>
                </tr>
              ) : (
                usuariosFiltrados.map(u => (
                  <tr key={u.id} className="table-row">
                    <td className="table-cell">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-xs">{u.nombre?.charAt(0)}</span>
                        </div>
                        <span className="font-mono text-sm">{u.username}</span>
                      </div>
                    </td>
                    <td className="table-cell font-medium">{u.nombre}</td>
                    <td className="table-cell text-gray-600">{u.email || '-'}</td>
                    <td className="table-cell">
                      <span className="badge badge-info">{u.rol?.nombre}</span>
                    </td>
                    <td className="table-cell text-center">
                      <span className={`badge ${u.activo ? 'badge-success' : 'badge-danger'}`}>
                        {u.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="table-cell text-center">
                      <div className="flex justify-center space-x-2">
                        <button 
                          onClick={() => { setEditUser(u); setShowForm(true); }} 
                          className="btn-secondary btn-sm"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button 
                          onClick={() => handleDelete(u.id)} 
                          className="btn-danger btn-sm"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de formulario */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="text-xl font-bold text-gray-900">
                {editUser ? "Editar Usuario" : "Nuevo Usuario"}
              </h2>
              <button 
                onClick={() => { setShowForm(false); setEditUser(null); }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <UsuarioForm
                onSubmit={handleCreateOrEdit}
                onCancel={() => { setShowForm(false); setEditUser(null); }}
                roles={roles}
                initial={editUser}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Usuarios; 