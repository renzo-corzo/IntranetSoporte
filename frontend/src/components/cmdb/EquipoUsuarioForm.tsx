import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { createEquipoUsuario, updateEquipoUsuario, type EquipoUsuario } from '../../services/cmdb.service';
import { empleadosService } from '../../services/empleados.service';
import { useAuth } from '../../context/AuthContext';

interface Props {
  equipo?: EquipoUsuario | null;
  onClose: () => void;
  onSuccess: () => void;
}

const EquipoUsuarioForm: React.FC<Props> = ({ equipo, onClose, onSuccess }) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [empleados, setEmpleados] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    nombre: '',
    tipo: 'PC' as EquipoUsuario['tipo'],
    ip: '',
    ubicacion: '',
    serie: '',
    fabricante: '',
    modelo: '',
    estado: 'PRODUCCION' as const,
    fechaAlta: new Date().toISOString().split('T')[0],
    fechaBaja: '',
    notasTecnicas: '',
    sistemaOperativo: '',
    usuarioId: '',
    area: ''
  });

  useEffect(() => {
    if (token) {
      empleadosService.getEmpleados({ estado: 'ACTIVO' }).then(res => {
        setEmpleados(res.data || []);
      });
    }
  }, [token]);

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
        sistemaOperativo: equipo.sistemaOperativo || '',
        usuarioId: equipo.usuarioId || '',
        area: equipo.area || ''
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
        usuarioId: formData.usuarioId || null,
        fechaBaja: formData.fechaBaja || null
      };

      if (equipo) {
        await updateEquipoUsuario(equipo.id, dataToSend, token);
      } else {
        await createEquipoUsuario(dataToSend, token);
      }
      
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al guardar equipo de usuario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">
            {equipo ? 'Editar Equipo de Usuario' : 'Nuevo Equipo de Usuario'}
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
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value as EquipoUsuario['tipo'] })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="PC">PC</option>
                <option value="NOTEBOOK">Notebook</option>
                <option value="IMPRESORA">Impresora</option>
                <option value="MONITOR">Monitor</option>
                <option value="TECLADO">Teclado</option>
                <option value="MOUSE">Mouse</option>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Usuario Asignado</label>
              <select
                value={formData.usuarioId}
                onChange={(e) => setFormData({ ...formData, usuarioId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sin asignar</option>
                {empleados.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.nombre} {emp.apellido} - {emp.departamento}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Área</label>
              <input
                type="text"
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Sistema Operativo</label>
              <input
                type="text"
                value={formData.sistemaOperativo}
                onChange={(e) => setFormData({ ...formData, sistemaOperativo: e.target.value })}
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

export default EquipoUsuarioForm;

