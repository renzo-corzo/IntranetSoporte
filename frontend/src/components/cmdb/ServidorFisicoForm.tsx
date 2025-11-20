import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { createServidorFisico, updateServidorFisico, type ServidorFisico } from '../../services/cmdb.service';
import { useAuth } from '../../context/AuthContext';

interface Props {
  servidor?: ServidorFisico | null;
  onClose: () => void;
  onSuccess: () => void;
}

const ServidorFisicoForm: React.FC<Props> = ({ servidor, onClose, onSuccess }) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    nombre: '',
    ip: '',
    rol: '',
    ubicacion: '',
    serie: '',
    garantia: '',
    estado: 'PRODUCCION' as const,
    fechaAlta: new Date().toISOString().split('T')[0],
    fechaBaja: '',
    notasTecnicas: '',
    procesador: '',
    ram: '',
    almacenamiento: '',
    sistemaOperativo: '',
    fabricante: '',
    modelo: ''
  });

  useEffect(() => {
    if (servidor) {
      setFormData({
        nombre: servidor.nombre || '',
        ip: servidor.ip || '',
        rol: servidor.rol || '',
        ubicacion: servidor.ubicacion || '',
        serie: servidor.serie || '',
        garantia: servidor.garantia ? new Date(servidor.garantia).toISOString().split('T')[0] : '',
        estado: servidor.estado,
        fechaAlta: servidor.fechaAlta ? new Date(servidor.fechaAlta).toISOString().split('T')[0] : '',
        fechaBaja: servidor.fechaBaja ? new Date(servidor.fechaBaja).toISOString().split('T')[0] : '',
        notasTecnicas: servidor.notasTecnicas || '',
        procesador: servidor.procesador || '',
        ram: servidor.ram || '',
        almacenamiento: servidor.almacenamiento || '',
        sistemaOperativo: servidor.sistemaOperativo || '',
        fabricante: servidor.fabricante || '',
        modelo: servidor.modelo || ''
      });
    }
  }, [servidor]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    
    setLoading(true);
    setError('');

    try {
      const dataToSend = {
        ...formData,
        garantia: formData.garantia || null,
        fechaBaja: formData.fechaBaja || null
      };

      if (servidor) {
        await updateServidorFisico(servidor.id, dataToSend, token);
      } else {
        await createServidorFisico(dataToSend, token);
      }
      
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al guardar servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">
            {servidor ? 'Editar Servidor Físico' : 'Nuevo Servidor Físico'}
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
            {/* Información Básica */}
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
                placeholder="Ej: Servidor Web, Base de Datos, etc."
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

            {/* Especificaciones Técnicas */}
            <div className="md:col-span-2 mt-4">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Especificaciones Técnicas</h3>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Procesador</label>
              <input
                type="text"
                value={formData.procesador}
                onChange={(e) => setFormData({ ...formData, procesador: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">RAM</label>
              <input
                type="text"
                value={formData.ram}
                onChange={(e) => setFormData({ ...formData, ram: e.target.value })}
                placeholder="Ej: 32 GB"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Almacenamiento</label>
              <input
                type="text"
                value={formData.almacenamiento}
                onChange={(e) => setFormData({ ...formData, almacenamiento: e.target.value })}
                placeholder="Ej: 1 TB SSD"
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

            {/* Fechas */}
            <div className="md:col-span-2 mt-4">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Fechas</h3>
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Garantía (Vencimiento)</label>
              <input
                type="date"
                value={formData.garantia}
                onChange={(e) => setFormData({ ...formData, garantia: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Notas */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notas Técnicas</label>
              <textarea
                value={formData.notasTecnicas}
                onChange={(e) => setFormData({ ...formData, notasTecnicas: e.target.value })}
                rows={4}
                placeholder="Ej: No apagar, tiene backup en Veeam, etc."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Guardando...' : servidor ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ServidorFisicoForm;

