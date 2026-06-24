import React, { useEffect, useState } from "react";
import { PlusIcon, PencilIcon, XMarkIcon, BuildingOfficeIcon } from "@heroicons/react/24/outline";
import { useAuth } from "../context/AuthContext";
import { useEmpresa } from "../context/EmpresaContext";
import { getEmpresas, crearEmpresa, actualizarEmpresa, MODULOS_DISPONIBLES, type Empresa } from "../services/empresa.service";

const EmpresaForm: React.FC<{
  empresa: Empresa | null;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ empresa, onClose, onSuccess }) => {
  const { token } = useAuth();
  const [nombre, setNombre] = useState(empresa?.nombre || "");
  const [descripcion, setDescripcion] = useState(empresa?.descripcion || "");
  const [activo, setActivo] = useState(empresa?.activo ?? true);
  const [modulos, setModulos] = useState<string[]>(
    empresa?.modulosHabilitados ?? MODULOS_DISPONIBLES.map((m) => m.key)
  );
  const [zabbixGrupo, setZabbixGrupo] = useState(empresa?.zabbixGrupo || "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const toggleModulo = (key: string) => {
    setModulos((prev) => (prev.includes(key) ? prev.filter((m) => m !== key) : [...prev, key]));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      if (empresa) {
        await actualizarEmpresa(token, empresa.id, { nombre, descripcion, activo, modulosHabilitados: modulos, zabbixGrupo });
      } else {
        await crearEmpresa(token, { nombre, descripcion, modulosHabilitados: modulos, zabbixGrupo });
      }
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || "Error al guardar el cliente");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">{empresa ? "Editar cliente" : "Nuevo cliente"}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">{error}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <input
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Módulos habilitados</label>
            <div className="grid grid-cols-2 gap-2">
              {MODULOS_DISPONIBLES.map((m) => (
                <label key={m.key} className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={modulos.includes(m.key)}
                    onChange={() => toggleModulo(m.key)}
                  />
                  {m.label}
                </label>
              ))}
            </div>
          </div>
          <div className="border-t border-gray-200 pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Grupo de hosts en Zabbix</label>
            <p className="text-xs text-gray-500 mb-2">
              Nombre exacto del Host Group en Zabbix que identifica a este cliente. Las credenciales de Zabbix son únicas para toda la instalación (se configuran en Admin → Configuración).
            </p>
            <input
              type="text"
              placeholder="ej: Cliente ACME"
              value={zabbixGrupo}
              onChange={(e) => setZabbixGrupo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          {empresa && (
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} />
              Cliente activo
            </label>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Empresas: React.FC = () => {
  const { loading, refrescarEmpresas } = useEmpresa();
  const [todasEmpresas, setTodasEmpresas] = useState<Empresa[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [empresaEdit, setEmpresaEdit] = useState<Empresa | null>(null);
  const { token } = useAuth();

  const cargarTodas = async () => {
    if (!token) return;
    const lista = await getEmpresas(token, true);
    setTodasEmpresas(lista);
  };

  useEffect(() => {
    cargarTodas();
  }, [token]);

  const handleSuccess = async () => {
    setShowForm(false);
    setEmpresaEdit(null);
    await Promise.all([cargarTodas(), refrescarEmpresas()]);
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Clientes</h2>
          <p className="text-gray-600 text-sm">Empresas que administra tu equipo de IT</p>
        </div>
        <button
          onClick={() => { setEmpresaEdit(null); setShowForm(true); }}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Nuevo cliente</span>
        </button>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Módulos</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {todasEmpresas.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  <BuildingOfficeIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>Todavía no hay clientes configurados</p>
                </td>
              </tr>
            ) : (
              todasEmpresas.map((empresa) => (
                <tr key={empresa.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{empresa.nombre}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{empresa.descripcion || "-"}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {empresa.modulosHabilitados?.length ?? 0}/{MODULOS_DISPONIBLES.length}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${empresa.activo ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
                      {empresa.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => { setEmpresaEdit(empresa); setShowForm(true); }}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <EmpresaForm
          empresa={empresaEdit}
          onClose={() => { setShowForm(false); setEmpresaEdit(null); }}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
};

export default Empresas;
