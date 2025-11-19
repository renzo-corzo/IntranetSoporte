import React, { useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';

interface UbicacionQuickAddProps {
  onUbicacionCreated: (ubicacion: any) => void;
}

const UbicacionQuickAdd: React.FC<UbicacionQuickAddProps> = ({ onUbicacionCreated }) => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    tipo: 'Oficina'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/stock/ubicaciones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const nuevaUbicacion = await response.json();
        onUbicacionCreated(nuevaUbicacion);
        setFormData({ nombre: '', descripcion: '', tipo: 'Oficina' });
        setShowForm(false);
      }
    } catch (error) {
      console.error('Error al crear ubicación:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!showForm) {
    return (
      <button
        type="button"
        onClick={() => setShowForm(true)}
        className="flex items-center text-sm text-blue-600 hover:text-blue-800"
      >
        <PlusIcon className="w-4 h-4 mr-1" />
        Nueva ubicación
      </button>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
      <h4 className="text-sm font-medium text-gray-900 mb-3">Crear Nueva Ubicación</h4>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <input
            type="text"
            placeholder="Nombre de la ubicación *"
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        <div>
          <input
            type="text"
            placeholder="Descripción (opcional)"
            value={formData.descripcion}
            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <select
            value={formData.tipo}
            onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="Oficina">Oficina</option>
            <option value="Depósito">Depósito</option>
            <option value="Rack">Rack</option>
            <option value="Armario">Armario</option>
            <option value="Escritorio">Escritorio</option>
            <option value="Sala">Sala</option>
          </select>
        </div>
        <div className="flex space-x-2">
          <button
            type="submit"
            disabled={loading || !formData.nombre.trim()}
            className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creando...' : 'Crear'}
          </button>
          <button
            type="button"
            onClick={() => setShowForm(false)}
            className="px-3 py-2 bg-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-400"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};

export default UbicacionQuickAdd;

