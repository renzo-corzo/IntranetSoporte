import React, { useEffect, useState } from "react";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  KeyIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";
import {
  getAccesos,
  crearAcceso,
  actualizarAcceso,
  deleteCredencial,
  revelarCredencial,
  type Credencial,
  type TipoEquipoCredencial,
} from "../services/cmdb.service";
import { useAuth } from "../context/AuthContext";

const REVEAL_TIMEOUT_MS = 10000;

const CATEGORIAS: { value: TipoEquipoCredencial | ""; label: string }[] = [
  { value: "", label: "Todos" },
  { value: "EMAIL", label: "Email" },
  { value: "ACCESO_REMOTO", label: "Acceso remoto" },
  { value: "OTRO", label: "Otro" },
];

const CATEGORIAS_FORM: { value: TipoEquipoCredencial; label: string }[] = [
  { value: "EMAIL", label: "Email" },
  { value: "ACCESO_REMOTO", label: "Acceso remoto (RDP/VPN/SSH)" },
  { value: "OTRO", label: "Otro" },
];

const CATEGORIA_LABEL: Record<string, string> = {
  EMAIL: "Email",
  ACCESO_REMOTO: "Acceso remoto",
  OTRO: "Otro",
};

const Accesos: React.FC = () => {
  const { token, user } = useAuth();
  const canManage = (user?.permisos || []).includes("cmdb:manage") || user?.rol === "admin";

  const [credenciales, setCredenciales] = useState<Credencial[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoria, setCategoria] = useState<TipoEquipoCredencial | "">("");
  const [buscar, setBuscar] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editCredencial, setEditCredencial] = useState<Credencial | null>(null);
  const [formData, setFormData] = useState({
    nombre: "",
    tipoEquipo: "EMAIL" as TipoEquipoCredencial,
    usuario: "",
    password: "",
    url: "",
    notas: "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [revealedId, setRevealedId] = useState<string | null>(null);
  const [revealedPassword, setRevealedPassword] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    cargar();
  }, [categoria]);

  const cargar = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await getAccesos(token, { tipoEquipo: categoria || undefined, buscar: buscar || undefined });
      setCredenciales(data);
    } catch (err) {
      console.error("Error al cargar accesos:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleBuscarSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    cargar();
  };

  const abrirNuevo = () => {
    setEditCredencial(null);
    setFormData({ nombre: "", tipoEquipo: "EMAIL", usuario: "", password: "", url: "", notas: "" });
    setError("");
    setShowForm(true);
  };

  const abrirEditar = (cred: Credencial) => {
    setEditCredencial(cred);
    setFormData({
      nombre: cred.nombre,
      tipoEquipo: cred.tipoEquipo,
      usuario: cred.usuario || "",
      password: "",
      url: cred.url || "",
      notas: cred.notas || "",
    });
    setError("");
    setShowForm(true);
  };

  const cerrarForm = () => {
    setShowForm(false);
    setEditCredencial(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setError("");

    if (!formData.nombre.trim()) {
      setError("El nombre es obligatorio");
      return;
    }
    if (!editCredencial && !formData.password.trim()) {
      setError("La contraseña es obligatoria");
      return;
    }

    setSaving(true);
    try {
      if (editCredencial) {
        await actualizarAcceso(
          editCredencial.id,
          {
            nombre: formData.nombre,
            usuario: formData.usuario || undefined,
            password: formData.password || undefined,
            url: formData.url || undefined,
            notas: formData.notas || undefined,
          },
          token
        );
      } else {
        await crearAcceso(
          {
            nombre: formData.nombre,
            tipoEquipo: formData.tipoEquipo,
            usuario: formData.usuario || undefined,
            password: formData.password,
            url: formData.url || undefined,
            notas: formData.notas || undefined,
          },
          token
        );
      }
      cerrarForm();
      cargar();
    } catch (err: any) {
      setError(err.response?.data?.error || "Error al guardar el acceso");
    } finally {
      setSaving(false);
    }
  };

  const handleEliminar = async (id: string) => {
    if (!token || !window.confirm("¿Eliminar este acceso? Esta acción no se puede deshacer.")) return;
    try {
      await deleteCredencial(id, token);
      cargar();
    } catch {
      alert("Error al eliminar el acceso");
    }
  };

  const toggleRevelar = async (cred: Credencial) => {
    if (revealedId === cred.id) {
      setRevealedId(null);
      setRevealedPassword("");
      return;
    }
    if (!token) return;
    try {
      const { password } = await revelarCredencial(cred.id, token);
      setRevealedId(cred.id);
      setRevealedPassword(password);
      setTimeout(() => {
        setRevealedId((curr) => (curr === cred.id ? null : curr));
      }, REVEAL_TIMEOUT_MS);
    } catch {
      alert("Error al revelar la contraseña");
    }
  };

  const copiar = async (cred: Credencial) => {
    if (!token) return;
    try {
      const { password } = await revelarCredencial(cred.id, token);
      await navigator.clipboard.writeText(password);
      setCopiedId(cred.id);
      setTimeout(() => setCopiedId((curr) => (curr === cred.id ? null : curr)), 2000);
    } catch {
      alert("Error al copiar la contraseña");
    }
  };

  return (
    <div>
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <KeyIcon className="w-7 h-7 text-blue-600" /> Accesos
            </h1>
            <p className="text-gray-600">Cuentas de mail, accesos remotos y otras credenciales guardadas de forma cifrada</p>
          </div>
          {canManage && (
            <button onClick={abrirNuevo} className="btn-primary whitespace-nowrap">
              <PlusIcon className="w-4 h-4 mr-2" />
              Nuevo acceso
            </button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="flex gap-1.5">
            {CATEGORIAS.map((c) => (
              <button
                key={c.value}
                onClick={() => setCategoria(c.value)}
                className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                  categoria === c.value
                    ? "bg-blue-600 text-white border-blue-600 font-medium"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
          <form onSubmit={handleBuscarSubmit} className="flex-1 max-w-xs">
            <input
              type="text"
              placeholder="Buscar por nombre o usuario..."
              value={buscar}
              onChange={(e) => setBuscar(e.target.value)}
              className="form-input"
            />
          </form>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="card-body text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Cargando accesos...</p>
          </div>
        ) : credenciales.length === 0 ? (
          <div className="card-body text-center py-12">
            <KeyIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay accesos guardados</h3>
            <p className="text-gray-600 mb-4">Guardá cuentas de mail, accesos remotos u otras credenciales acá.</p>
          </div>
        ) : (
          <div className="card-body space-y-2">
            {credenciales.map((cred) => (
              <div key={cred.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-gray-900">{cred.nombre}</p>
                      <span className="px-2 py-0.5 text-xs rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        {CATEGORIA_LABEL[cred.tipoEquipo] || cred.tipoEquipo}
                      </span>
                    </div>
                    {cred.usuario && <p className="text-xs text-gray-500 mt-1">Usuario: {cred.usuario}</p>}
                    <div className="flex items-center gap-2 mt-1.5">
                      <code className="text-sm bg-white border border-gray-200 rounded px-2 py-1 font-mono">
                        {revealedId === cred.id ? revealedPassword : "••••••••"}
                      </code>
                      {canManage && (
                        <>
                          <button
                            onClick={() => toggleRevelar(cred)}
                            title={revealedId === cred.id ? "Ocultar" : "Revelar"}
                            className="text-gray-400 hover:text-gray-700"
                          >
                            {revealedId === cred.id ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => copiar(cred)}
                            title="Copiar contraseña"
                            className="text-gray-400 hover:text-gray-700"
                          >
                            {copiedId === cred.id ? (
                              <CheckIcon className="w-4 h-4 text-green-600" />
                            ) : (
                              <ClipboardDocumentIcon className="w-4 h-4" />
                            )}
                          </button>
                        </>
                      )}
                    </div>
                    {cred.url && (
                      <a
                        href={cred.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 mt-1.5"
                      >
                        <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" /> {cred.url}
                      </a>
                    )}
                    {cred.notas && <p className="text-xs text-gray-500 mt-1.5">{cred.notas}</p>}
                    <p className="text-xs text-gray-400 mt-1">
                      {cred.creadoPor?.nombre && `Agregado por ${cred.creadoPor.nombre} · `}
                      {new Date(cred.creadoEn).toLocaleDateString()}
                    </p>
                  </div>
                  {canManage && (
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => abrirEditar(cred)} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleEliminar(cred.id)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content max-w-md">
            <form onSubmit={handleSubmit}>
              <div className="modal-header">
                <h2 className="text-xl font-bold text-gray-900">{editCredencial ? "Editar acceso" : "Nuevo acceso"}</h2>
                <button type="button" onClick={cerrarForm} className="text-gray-400 hover:text-gray-600">
                  ✕
                </button>
              </div>

              <div className="modal-body space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>
                )}

                <div>
                  <label className="form-label">Nombre / etiqueta *</label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Ej: Gmail soporte, VPN cliente X"
                    className="form-input"
                    autoFocus
                  />
                </div>

                {!editCredencial && (
                  <div>
                    <label className="form-label">Categoría *</label>
                    <select
                      value={formData.tipoEquipo}
                      onChange={(e) => setFormData({ ...formData, tipoEquipo: e.target.value as TipoEquipoCredencial })}
                      className="form-input"
                    >
                      {CATEGORIAS_FORM.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">Usuario</label>
                    <input
                      type="text"
                      value={formData.usuario}
                      onChange={(e) => setFormData({ ...formData, usuario: e.target.value })}
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label className="form-label">
                      Contraseña {editCredencial ? "(vacío = no cambiar)" : "*"}
                    </label>
                    <input
                      type="text"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="form-input font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">URL</label>
                  <input
                    type="text"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    placeholder="https://mail.google.com"
                    className="form-input"
                  />
                </div>

                <div>
                  <label className="form-label">Notas</label>
                  <textarea
                    value={formData.notas}
                    onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                    rows={2}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={cerrarForm} className="btn-secondary">
                  Cancelar
                </button>
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? "Guardando..." : editCredencial ? "Guardar cambios" : "Crear acceso"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Accesos;
