import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { createMaquinaVirtual, updateMaquinaVirtual, getServidoresFisicos, type MaquinaVirtual } from '../../services/cmdb.service';
import { useAuth } from '../../context/AuthContext';

interface Props {
  maquina?: MaquinaVirtual | null;
  onClose: () => void;
  onSuccess: () => void;
}

const MaquinaVirtualForm: React.FC<Props> = ({ maquina, onClose, onSuccess }) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [servidores, setServidores] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    nombre: '',
    ip: '',
    sistemaOperativo: '',
    rol: '',
    estado: 'PRODUCCION' as const,
    fechaAlta: new Date().toISOString().split('T')[0],
    fechaBaja: '',
    notasTecnicas: '',
    hostId: '',
    vcpu: '',
    ram: '',
    almacenamiento: '',
    hipervisor: ''
  });

  useEffect(() => {
    if (token) {
      getServidoresFisicos(token, { limit: 1000 }).then(res => {
        setServidores(res.data || []);
      });
    }
  }, [token]);

  useEffect(() => {
    if (maquina) {
      setFormData({
        nombre: maquina.nombre || '',
        ip: maquina.ip || '',
        sistemaOperativo: maquina.sistemaOperativo || '',
        rol: maquina.rol || '',
        estado: maquina.estado,
        fechaAlta: maquina.fechaAlta ? new Date(maquina.fechaAlta).toISOString().split('T')[0] : '',
        fechaBaja: maquina.fechaBaja ? new Date(maquina.fechaBaja).toISOString().split('T')[0] : '',
        notasTecnicas: maquina.notasTecnicas || '',
        hostId: maquina.hostId || '',
        vcpu: maquina.vcpu?.toString() || '',
        ram: maquina.ram || '',
        almacenamiento: maquina.almacenamiento || '',
        hipervisor: maquina.hipervisor || ''
      });
    }
  }, [maquina]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    
    setLoading(true);
    setError('');

    try {
      const dataToSend = {
        ...formData,
        hostId: formData.hostId || null,
        vcpu: formData.vcpu ? Number(formData.vcpu) : null,
        fechaBaja: formData.fechaBaja || null
      };

      if (maquina) {
        await updateMaquinaVirtual(maquina.id, dataToSend, token);
      } else {
        await createMaquinaVirtual(dataToSend, token);
      }
      
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al guardar máquina virtual');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">
            {maquina ? 'Editar Máquina Virtual' : 'Nueva Máquina Virtual'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Información Básica</h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
              <input
                type="text"
                required
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">IP</label>
              <input
                type="text"
                value={formData.ip}
                onChange={(e) => setFormData({ ...formData, ip: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
              <input
                type="text"
                value={formData.rol}
                onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                placeholder="Ej: DC, SQL, Zabbix, Proxy"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sistema Operativo</label>
              <input
                type="text"
                value={formData.sistemaOperativo}
                onChange={(e) => setFormData({ ...formData, sistemaOperativo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Host (Servidor Físico)</label>
              <select
                value={formData.hostId}
                onChange={(e) => setFormData({ ...formData, hostId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sin host asignado</option>
                {servidores.map(s => (
                  <option key={s.id} value={s.id}>{s.nombre}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <select
                value={formData.estado}
                onChange={(e) => setFormData({ ...formData, estado: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="PRODUCCION">Producción</option>
                <option value="TEST">Test</option>
                <option value="FUERA_DE_SERVICIO">Fuera de Servicio</option>
                <option value="MANTENIMIENTO">Mantenimiento</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Recursos</h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">vCPU</label>
              <input
                type="number"
                value={formData.vcpu}
                onChange={(e) => setFormData({ ...formData, vcpu: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">RAM</label>
              <input
                type="text"
                value={formData.ram}
                onChange={(e) => setFormData({ ...formData, ram: e.target.value })}
                placeholder="Ej: 8 GB"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Almacenamiento</label>
              <input
                type="text"
                value={formData.almacenamiento}
                onChange={(e) => setFormData({ ...formData, almacenamiento: e.target.value })}
                placeholder="Ej: 100 GB"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hipervisor</label>
              <input
                type="text"
                value={formData.hipervisor}
                onChange={(e) => setFormData({ ...formData, hipervisor: e.target.value })}
                placeholder="Ej: VMware, Hyper-V"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notas Técnicas</label>
              <textarea
                value={formData.notasTecnicas}
                onChange={(e) => setFormData({ ...formData, notasTecnicas: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Guardando...' : maquina ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MaquinaVirtualForm;

