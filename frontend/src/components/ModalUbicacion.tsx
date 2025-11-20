import React, { useState } from 'react';
import { XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';
import { crearUbicacion, type UbicacionStock } from '../apiStock';

interface ModalUbicacionProps {
  isOpen: boolean;
  onClose: () => void;
  onUbicacionCreated: (ubicacion: UbicacionStock) => void;
}

const ModalUbicacion: React.FC<ModalUbicacionProps> = ({
  isOpen,
  onClose,
  onUbicacionCreated
}) => {
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    tipo: 'Oficina',
    tipoPersonalizado: ''
  });
  const [mostrarTipoPersonalizado, setMostrarTipoPersonalizado] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const tiposUbicacion = [
    'Oficina',
    'Depósito',
    'Rack',
    'Armario',
    'Escritorio',
    'Sala',
    'Almacén',
    'Bodega',
    'Otro'
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'tipo') {
      const mostrarPersonalizado = value === 'Otro';
      setMostrarTipoPersonalizado(mostrarPersonalizado);
      setFormData(prev => ({
        ...prev,
        [name]: value,
        tipoPersonalizado: mostrarPersonalizado ? prev.tipoPersonalizado : ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nombre.trim()) {
      setError('El nombre es obligatorio');
      return;
    }

    if (formData.tipo === 'Otro' && !formData.tipoPersonalizado.trim()) {
      setError('Debe ingresar un tipo personalizado');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const tipoFinal = formData.tipo === 'Otro' ? formData.tipoPersonalizado : formData.tipo;
      const nuevaUbicacion = await crearUbicacion({
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        tipo: tipoFinal
      });
      onUbicacionCreated(nuevaUbicacion);
      // Reset form
      setFormData({
        nombre: '',
        descripcion: '',
        tipo: 'Oficina',
        tipoPersonalizado: ''
      });
      setMostrarTipoPersonalizado(false);
      onClose();
    } catch (error: any) {
      console.error('Error al crear ubicación:', error);
      setError(error.response?.data?.error || 'Error al crear la ubicación');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-xl font-semibold text-gray-900">
            Nueva Ubicación
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre *
            </label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Ej: Oficina Contabilidad, Depósito Principal..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo *
            </label>
            <select
              name="tipo"
              value={formData.tipo}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {tiposUbicacion.map(tipo => (
                <option key={tipo} value={tipo}>{tipo}</option>
              ))}
            </select>
            {mostrarTipoPersonalizado && (
              <div className="mt-2">
                <input
                  type="text"
                  name="tipoPersonalizado"
                  value={formData.tipoPersonalizado}
                  onChange={handleChange}
                  placeholder="Ingrese el tipo personalizado"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required={mostrarTipoPersonalizado}
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción
            </label>
            <textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              rows={3}
              placeholder="Descripción adicional de la ubicación (opcional)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 sticky bottom-0 bg-white pb-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !formData.nombre.trim() || (formData.tipo === 'Otro' && !formData.tipoPersonalizado.trim())}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? 'Creando...' : 'Crear Ubicación'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalUbicacion;

