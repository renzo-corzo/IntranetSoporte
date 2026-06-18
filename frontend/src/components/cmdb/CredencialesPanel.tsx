import React, { useEffect, useState } from 'react';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  ClipboardDocumentIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import {
  getCredenciales,
  createCredencial,
  updateCredencial,
  deleteCredencial,
  revelarCredencial,
  type Credencial,
  type TipoEquipoCredencial
} from '../../services/cmdb.service';
import { useAuth } from '../../context/AuthContext';

interface Props {
  tipoEquipo: TipoEquipoCredencial;
  equipoId: string;
  canManage: boolean;
}

const REVEAL_TIMEOUT_MS = 10000;

const CredencialesPanel: React.FC<Props> = ({ tipoEquipo, equipoId, canManage }) => {
  const { token } = useAuth();
  const [credenciales, setCredenciales] = useState<Credencial[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editCredencial, setEditCredencial] = useState<Credencial | null>(null);
  const [formData, setFormData] = useState({ nombre: '', usuario: '', password: '', notas: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [revealedId, setRevealedId] = useState<string | null>(null);
  const [revealedPassword, setRevealedPassword] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    cargarCredenciales();
  }, [tipoEquipo, equipoId]);

  const cargarCredenciales = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await getCredenciales(tipoEquipo, equipoId, token);
      setCredenciales(data);
    } catch (err) {
      console.error('Error al cargar credenciales:', err);
    } finally {
      setLoading(false);
    }
  };

  const abrirNueva = () => {
    setEditCredencial(null);
    setFormData({ nombre: '', usuario: '', password: '', notas: '' });
    setError('');
    setShowForm(true);
  };

  const abrirEditar = (cred: Credencial) => {
    setEditCredencial(cred);
    setFormData({ nombre: cred.nombre, usuario: cred.usuario || '', password: '', notas: cred.notas || '' });
    setError('');
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setError('');

    if (!formData.nombre.trim()) {
      setError('El nombre es obligatorio');
      return;
    }
    if (!editCredencial && !formData.password.trim()) {
      setError('La contraseña es obligatoria');
      return;
    }

    setSaving(true);
    try {
      if (editCredencial) {
        await updateCredencial(editCredencial.id, {
          nombre: formData.nombre,
          usuario: formData.usuario || undefined,
          password: formData.password || undefined,
          notas: formData.notas || undefined
        }, token);
      } else {
        await createCredencial({
          nombre: formData.nombre,
          usuario: formData.usuario || undefined,
          password: formData.password,
          notas: formData.notas || undefined,
          tipoEquipo,
          equipoId
        }, token);
      }
      setShowForm(false);
      cargarCredenciales();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al guardar la credencial');
    } finally {
      setSaving(false);
    }
  };

  const handleEliminar = async (id: string) => {
    if (!token || !window.confirm('¿Eliminar esta credencial? Esta acción no se puede deshacer.')) return;
    try {
      await deleteCredencial(id, token);
      cargarCredenciales();
    } catch (err) {
      alert('Error al eliminar la credencial');
    }
  };

  const toggleRevelar = async (cred: Credencial) => {
    if (revealedId === cred.id) {
      setRevealedId(null);
      setRevealedPassword('');
      return;
    }
    if (!token) return;
    try {
      const { password } = await revelarCredencial(cred.id, token);
      setRevealedId(cred.id);
      setRevealedPassword(password);
      setTimeout(() => {
        setRevealedId(curr => (curr === cred.id ? null : curr));
      }, REVEAL_TIMEOUT_MS);
    } catch {
      alert('Error al revelar la contraseña');
    }
  };

  const copiar = async (cred: Credencial) => {
    if (!token) return;
    try {
      const { password } = await revelarCredencial(cred.id, token);
      await navigator.clipboard.writeText(password);
      setCopiedId(cred.id);
      setTimeout(() => setCopiedId(curr => (curr === cred.id ? null : curr)), 2000);
    } catch {
      alert('Error al copiar la contraseña');
    }
  };

  if (loading) {
    return <div className="text-sm text-gray-500 py-4">Cargando credenciales...</div>;
  }

  return (
    <div className="space-y-3">
      {credenciales.length === 0 && !showForm && (
        <p className="text-sm text-gray-500 py-2">No hay credenciales guardadas para este registro.</p>
      )}

      <div className="space-y-2">
        {credenciales.map(cred => (
          <div key={cred.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900 text-sm">{cred.nombre}</p>
                {cred.usuario && <p className="text-xs text-gray-500">Usuario: {cred.usuario}</p>}
                <div className="flex items-center gap-2 mt-1.5">
                  <code className="text-sm bg-white border border-gray-200 rounded px-2 py-1 font-mono">
                    {revealedId === cred.id ? revealedPassword : '••••••••'}
                  </code>
                  {canManage && (
                    <>
                      <button
                        onClick={() => toggleRevelar(cred)}
                        title={revealedId === cred.id ? 'Ocultar' : 'Revelar'}
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

      {canManage && !showForm && (
        <button
          onClick={abrirNueva}
          className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          <PlusIcon className="w-4 h-4" /> Agregar credencial
        </button>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
          {error && <div className="text-sm text-red-600">{error}</div>}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Nombre / etiqueta *</label>
            <input
              type="text"
              value={formData.nombre}
              onChange={e => setFormData({ ...formData, nombre: e.target.value })}
              placeholder="Ej: Admin local, Usuario SA, WiFi Visitas"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Usuario</label>
              <input
                type="text"
                value={formData.usuario}
                onChange={e => setFormData({ ...formData, usuario: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Contraseña {editCredencial ? '(dejar vacío para no cambiar)' : '*'}
              </label>
              <input
                type="text"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Notas</label>
            <textarea
              value={formData.notas}
              onChange={e => setFormData({ ...formData, notas: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Guardando...' : editCredencial ? 'Actualizar' : 'Guardar'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default CredencialesPanel;
