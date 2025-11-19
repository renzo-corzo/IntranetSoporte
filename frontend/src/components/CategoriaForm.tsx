import React, { useState, useEffect } from 'react';
// import { XMarkIcon } from '@heroicons/react/24/outline';

interface Categoria {
  id: number;
  nombre: string;
  descripcion?: string;
  padreId?: number;
}

interface CategoriaFormProps {
  categoria?: Categoria | null;
  categorias: Categoria[];
  onSubmit: (categoria: any) => void;
  onCancel: () => void;
}

const CategoriaForm: React.FC<CategoriaFormProps> = ({
  categoria,
  categorias,
  onSubmit,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    categoriaPadreId: ''
  });

  useEffect(() => {
    if (categoria) {
      setFormData({
        nombre: categoria.nombre,
        descripcion: categoria.descripcion || '',
        categoriaPadreId: categoria.padreId?.toString() || ''
      });
    }
  }, [categoria]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      nombre: formData.nombre.trim(),
      descripcion: formData.descripcion.trim(),
      categoriaPadreId: formData.categoriaPadreId ? parseInt(formData.categoriaPadreId) : null
    };

    onSubmit(data);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Filtrar categorías para evitar referencias circulares
  const categoriasDisponibles = categorias.filter(cat => 
    !categoria || cat.id !== categoria.id
  );

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999
      }}
    >
      <div 
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '24px',
          maxWidth: '500px',
          width: '90%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          zIndex: 100000
        }}
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">
              {categoria ? 'Editar Categoría' : 'Nueva Categoría'}
            </h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <span className="emoji-icon">❌</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-2">
              Nombre *
            </label>
            <input
              type="text"
              id="nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Nombre de la categoría"
            />
          </div>

          <div>
            <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-2">
              Descripción
            </label>
            <textarea
              id="descripcion"
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Descripción opcional de la categoría"
            />
          </div>

          <div>
            <label htmlFor="categoriaPadreId" className="block text-sm font-medium text-gray-700 mb-2">
              Categoría Padre
            </label>
            <select
              id="categoriaPadreId"
              name="categoriaPadreId"
              value={formData.categoriaPadreId}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Sin categoría padre</option>
              {categoriasDisponibles.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nombre}
                </option>
              ))}
            </select>
          </div>

          <div 
            className="flex justify-end space-x-3 pt-4"
            style={{ 
              display: 'flex', 
              justifyContent: 'flex-end', 
              gap: '12px', 
              paddingTop: '16px',
              borderTop: '1px solid #e5e7eb',
              marginTop: '20px'
            }}
          >
            <button
              type="button"
              onClick={onCancel}
              style={{
                padding: '10px 20px',
                backgroundColor: '#f3f4f6',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
              onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = '#e5e7eb'}
              onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = '#f3f4f6'}
            >
              ❌ Cancelar
            </button>
            <button
              type="submit"
              style={{
                padding: '10px 20px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px'
              }}
              onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = '#2563eb'}
              onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = '#3b82f6'}
            >
              <span>{categoria ? '✏️' : '💾'}</span>
              <span>{categoria ? 'Actualizar' : 'Crear'} Categoría</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoriaForm; 