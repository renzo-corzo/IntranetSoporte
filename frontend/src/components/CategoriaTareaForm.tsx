import React, { useState } from 'react';

interface CategoriaTarea {
  id: number;
  nombre: string;
  descripcion?: string;
  color?: string;
  icono?: string;
  activa: boolean;
  creadoEn: string;
  _count?: {
    tareas: number;
  };
}

interface CategoriaTareaFormProps {
  categoria?: CategoriaTarea | null;
  onSubmit: (categoria: Partial<CategoriaTarea>) => void;
  onCancel: () => void;
}

const CategoriaTareaForm: React.FC<CategoriaTareaFormProps> = ({
  categoria,
  onSubmit,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    nombre: categoria?.nombre || '',
    descripcion: categoria?.descripcion || '',
    color: categoria?.color || '#3b82f6',
    icono: categoria?.icono || '📋'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const iconos = ['📋', '🔧', '💻', '📊', '🏢', '🚀', '⚡', '🎯', '📝', '🔍', '💡', '🛠️'];

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-lg">
        <form onSubmit={handleSubmit}>
          <div className="modal-header">
            <h2 className="text-xl font-bold text-gray-900">
              {categoria ? '✏️ Editar Categoría' : '➕ Nueva Categoría'}
            </h2>
            <button 
              type="button" 
              onClick={onCancel} 
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="modal-body">
            <div className="space-y-4">
              <div>
                <label className="form-label">
                  📝 Nombre *
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Ej: Mantenimiento, Desarrollo, Soporte..."
                  required
                />
              </div>

              <div>
                <label className="form-label">
                  📄 Descripción
                </label>
                <textarea
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleChange}
                  className="form-input"
                  rows={3}
                  placeholder="Descripción opcional de la categoría..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">
                    🎨 Color
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      name="color"
                      value={formData.color}
                      onChange={handleChange}
                      className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      name="color"
                      value={formData.color}
                      onChange={handleChange}
                      className="form-input flex-1"
                      placeholder="#3b82f6"
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">
                    😀 Ícono
                  </label>
                  <div className="grid grid-cols-6 gap-2 mb-2">
                    {iconos.map(icono => (
                      <button
                        key={icono}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, icono }))}
                        className={`p-2 text-xl rounded border transition-colors ${
                          formData.icono === icono 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {icono}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    name="icono"
                    value={formData.icono}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="O escribe tu propio emoji"
                  />
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                    style={{ backgroundColor: formData.color }}
                  >
                    {formData.icono}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      {formData.nombre || 'Nombre de la categoría'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {formData.descripcion || 'Descripción de la categoría'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              onClick={onCancel}
              className="btn-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary"
            >
              {categoria ? 'Actualizar' : 'Crear'} Categoría
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoriaTareaForm;