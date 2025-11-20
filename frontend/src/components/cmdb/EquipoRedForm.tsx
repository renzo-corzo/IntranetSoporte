import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { createEquipoRed, updateEquipoRed, type EquipoRed } from '../../services/cmdb.service';
import { useAuth } from '../../context/AuthContext';

interface Props {
  equipo?: EquipoRed | null;
  onClose: () => void;
  onSuccess: () => void;
}

const EquipoRedForm: React.FC<Props> = ({ equipo, onClose, onSuccess }) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    nombre: '',
    tipo: 'SWITCH' as EquipoRed['tipo'],
    ip: '',
    ubicacion: '',
    serie: '',
    fabricante: '',
    modelo: '',
    estado: 'PRODUCCION' as const,
    fechaAlta: new Date().toISOString().split('T')[0],
    fechaBaja: '',
    notasTecnicas: '',
    firmware: '',
    puertos: ''
  });

  useEffect(() => {
    if (equipo) {
      setFormData({
        nombre: equipo.nombre || '',
        tipo: equipo.tipo,
        ip: equipo.ip || '',
        ubicacion: equipo.ubicacion || '',
        serie: equipo.serie || '',
        fabricante: equipo.fabricante || '',
        modelo: equipo.modelo || '',
        estado: equipo.estado,
        fechaAlta: equipo.fechaAlta ? new Date(equipo.fechaAlta).toISOString().split('T')[0] : '',
        fechaBaja: equipo.fechaBaja ? new Date(equipo.fechaBaja).toISOString().split('T')[0] : '',
        notasTecnicas: equipo.notasTecnicas || '',
        firmware: equipo.firmware || '',
        puertos: equipo.puertos?.toString() || ''
      });
    }
  }, [equipo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    
    setLoading(true);
    setError('');

    try {
      const dataToSend = {
        ...formData,
        puertos: formData.puertos ? Number(formData.puertos) : null,
        fechaBaja: formData.fechaBaja || null
      };

      if (equipo) {
        await updateEquipoRed(equipo.id, dataToSend, token);
      } else {
        await createEquipoRed(dataToSend, token);
      }
      
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al guardar equipo de red');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">
            {equipo ? 'Editar Equipo de Red' : 'Nuevo Equipo de Red'}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
              <select
                required
                value={formData.tipo}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value as EquipoRed['tipo'] })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="MIKROTIK">MikroTik</option>
                <option value="PFSENSE">pfSense</option>
                <option value="SWITCH">Switch</option>
                <option value="ACCESS_POINT">Access Point</option>
                <option value="ROUTER">Router</option>
                <option value="FIREWALL">Firewall</option>
                <option value="OTRO">Otro</option>
              </select>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación</label>
              <input
                type="text"
                value={formData.ubicacion}
                onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Serie</label>
              <input
                type="text"
                value={formData.serie}
                onChange={(e) => setFormData({ ...formData, serie: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
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
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Especificaciones</h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fabricante</label>
              <input
                type="text"
                value={formData.fabricante}
                onChange={(e) => setFormData({ ...formData, fabricante: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Modelo</label>
              <input
                type="text"
                value={formData.modelo}
                onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Firmware</label>
              <input
                type="text"
                value={formData.firmware}
                onChange={(e) => setFormData({ ...formData, firmware: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Puertos</label>
              <input
                type="number"
                value={formData.puertos}
                onChange={(e) => setFormData({ ...formData, puertos: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Alta</label>
              <input
                type="date"
                value={formData.fechaAlta}
                onChange={(e) => setFormData({ ...formData, fechaAlta: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Baja</label>
              <input
                type="date"
                value={formData.fechaBaja}
                onChange={(e) => setFormData({ ...formData, fechaBaja: e.target.value })}
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
              {loading ? 'Guardando...' : equipo ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EquipoRedForm;

