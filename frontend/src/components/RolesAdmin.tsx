import React, { useEffect, useState } from "react";
import { getRoles, createRol, updateRol, deleteRol, getRolePermissions, updateRolePermissions, getPermissionsCatalog } from "../apiUsuarios";
import { useAuth } from "../context/AuthContext";

const RolesAdmin: React.FC = () => {
  const { token } = useAuth();
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editRol, setEditRol] = useState<any>(null);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [error, setError] = useState("");
  // Estado permisos por rol
  const [showPermModal, setShowPermModal] = useState(false);
  const [permLoading, setPermLoading] = useState(false);
  const [savingPerms, setSavingPerms] = useState(false);
  const [permError, setPermError] = useState("");
  const [selectedRol, setSelectedRol] = useState<any>(null);
  const [catalogo, setCatalogo] = useState<Record<string, string[]>>({});
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());

  const fetchRoles = async () => {
    if (!token) return;
    setLoading(true);
    const data = await getRoles(token);
    setRoles(data);
    setLoading(false);
  };
  useEffect(() => { fetchRoles(); }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!nombre.trim()) return setError("El nombre es obligatorio");
    try {
      if (editRol) {
        await updateRol(editRol.id, { nombre, descripcion }, token!);
      } else {
        await createRol({ nombre, descripcion }, token!);
      }
      setShowForm(false);
      setEditRol(null);
      setNombre("");
      setDescripcion("");
      fetchRoles();
    } catch (err: any) {
      setError(err?.response?.data?.error || "Error al guardar rol");
    }
  };
  const handleEdit = (rol: any) => {
    setEditRol(rol);
    setNombre(rol.nombre);
    setDescripcion(rol.descripcion || "");
    setShowForm(true);
  };
  const handleDelete = async (id: number) => {
    if (!token) return;
    if (!window.confirm("¿Eliminar rol?")) return;
    await deleteRol(id, token);
    fetchRoles();
  };

  const abrirPermisos = async (rol: any) => {
    if (!token) return;
    setSelectedRol(rol);
    setPermError("");
    setPermLoading(true);
    try {
      const [permActuales, cat] = await Promise.all([
        getRolePermissions(rol.id, token),
        getPermissionsCatalog(token)
      ]);
      setCatalogo(cat || {});
      setSeleccionados(new Set((permActuales?.permisos || []).map((p: string) => p)));
      setShowPermModal(true);
    } catch (e: any) {
      setPermError(e?.response?.data?.error || "Error al cargar permisos");
    } finally {
      setPermLoading(false);
    }
  };

  const togglePermiso = (perm: string) => {
    setSeleccionados(prev => {
      const next = new Set(prev);
      if (next.has(perm)) next.delete(perm); else next.add(perm);
      return next;
    });
  };

  const guardarPermisos = async () => {
    if (!token || !selectedRol) return;
    setPermError("");
    setSavingPerms(true);
    try {
      await updateRolePermissions(selectedRol.id, Array.from(seleccionados), token);
      setShowPermModal(false);
    } catch (e: any) {
      setPermError(e?.response?.data?.error || "Error al guardar permisos");
    } finally {
      setSavingPerms(false);
    }
  };
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-blue-900">Administración de Roles</h2>
        <button onClick={() => { setEditRol(null); setNombre(""); setDescripcion(""); setShowForm(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-700 transition shadow">+ Nuevo rol</button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-300 rounded-lg bg-white shadow-xl">
          <thead className="bg-blue-50 border-b-2 border-blue-200">
            <tr>
              <th className="px-3 py-2 text-xs font-bold text-blue-900">Nombre</th>
              <th className="px-3 py-2 text-xs font-bold text-blue-900">Descripción</th>
              <th className="px-3 py-2 text-xs font-bold text-blue-900">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={3} className="text-center py-8 text-gray-400">Cargando...</td></tr> : roles.map(r => (
              <tr key={r.id} className="border-b hover:bg-blue-50 transition">
                <td className="px-3 py-2 text-sm font-mono">{r.nombre}</td>
                <td className="px-3 py-2 text-sm">{r.descripcion || '-'}</td>
                <td className="px-3 py-2 text-center flex gap-2 justify-center">
                  <button onClick={() => handleEdit(r)} className="bg-blue-100 hover:bg-blue-200 text-blue-700 p-2 rounded-full transition shadow-md" title="Editar rol">✏️</button>
                  <button onClick={() => abrirPermisos(r)} className="bg-emerald-100 hover:bg-emerald-200 text-emerald-700 p-2 rounded-full transition shadow-md" title="Asignar permisos">⚙️</button>
                  <button onClick={() => handleDelete(r.id)} className="bg-red-100 hover:bg-red-200 text-red-700 p-2 rounded-full transition shadow-md" title="Eliminar rol">🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Modal de formulario de rol */}
      {showForm && (
        <div className="fixed inset-0 flex items-center justify-center z-[1000] bg-black bg-opacity-60">
          <div className="bg-white rounded-2xl shadow-2xl border-4 border-blue-400 p-8 w-full max-w-md animate-float-modal relative">
            <button className="absolute top-4 right-4 text-gray-400 hover:text-red-600 text-2xl font-bold" onClick={() => { setShowForm(false); setEditRol(null); setNombre(""); setDescripcion(""); }}>✕</button>
            <h2 className="text-2xl font-extrabold text-blue-800 mb-2 text-center">{editRol ? "Editar rol" : "Nuevo rol"}</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <input type="text" placeholder="Nombre del rol" value={nombre} onChange={e => setNombre(e.target.value)} className="border rounded px-3 py-2" />
              <textarea placeholder="Descripción" value={descripcion} onChange={e => setDescripcion(e.target.value)} className="border rounded px-3 py-2" />
              {error && <div className="text-red-600 text-sm text-center">{error}</div>}
              <div className="flex gap-4 justify-center">
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-700 transition shadow">{editRol ? "Guardar" : "Crear"}</button>
                <button type="button" className="bg-gray-200 text-gray-700 px-4 py-2 rounded-xl font-bold hover:bg-gray-300 transition shadow" onClick={() => { setShowForm(false); setEditRol(null); setNombre(""); setDescripcion(""); }}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPermModal && (
        <div className="fixed inset-0 flex items-center justify-center z-[1100] bg-black bg-opacity-60">
          <div className="bg-white rounded-2xl shadow-2xl border-4 border-emerald-400 p-6 w-full max-w-3xl relative">
            <button className="absolute top-4 right-4 text-gray-400 hover:text-red-600 text-2xl font-bold" onClick={() => { setShowPermModal(false); }}>
              ✕
            </button>
            <h2 className="text-2xl font-extrabold text-emerald-800 mb-4 text-center">Asignar permisos: {selectedRol?.nombre}</h2>
            {permError && <div className="mb-3 text-center text-red-600 text-sm">{permError}</div>}
            <div className="max-h-[60vh] overflow-auto space-y-4">
              {permLoading ? (
                <div className="text-center text-gray-500 py-10">Cargando...</div>
              ) : (
                Object.entries(catalogo).map(([categoria, perms]) => (
                  <div key={categoria} className="border rounded-lg p-4">
                    <div className="font-semibold text-emerald-700 mb-2">{categoria.toUpperCase()}</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {perms.map((perm) => (
                        <label key={perm} className="flex items-center gap-2">
                          <input type="checkbox" checked={seleccionados.has(perm)} onChange={() => togglePermiso(perm)} />
                          <span className="text-sm">{perm}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="mt-6 flex justify-center gap-3">
              <button onClick={() => setShowPermModal(false)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-xl font-bold hover:bg-gray-300 transition shadow">Cancelar</button>
              <button onClick={() => { if (!savingPerms) guardarPermisos(); }} className={`text-white px-4 py-2 rounded-xl font-bold transition shadow ${savingPerms ? 'bg-blue-600/70 cursor-wait' : 'bg-blue-600 hover:bg-blue-700'}`}>{savingPerms ? "Guardando..." : "Guardar cambios"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RolesAdmin; 