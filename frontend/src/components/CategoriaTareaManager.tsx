import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import CategoriaTareaForm from './CategoriaTareaForm';

// Definir la interfaz aquí para evitar problemas de importación
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

const CategoriaTareaManager: React.FC = () => {
  const { token } = useAuth();
  const [categorias, setCategorias] = useState<CategoriaTarea[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategoria, setEditingCategoria] = useState<CategoriaTarea | null>(null);

  const fetchCategorias = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
      const response = await fetch(`${API_URL}/categorias-tarea`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      setCategorias(data);
    } catch (error) {
      console.error('Error al cargar categorías:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategorias();
  }, [token]);

  const handleSubmit = async (categoriaData: Partial<CategoriaTarea>) => {
    if (!token) return;
    
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
      const url = editingCategoria 
        ? `${API_URL}/categorias-tarea/${editingCategoria.id}`
        : `${API_URL}/categorias-tarea`;
      
      const method = editingCategoria ? 'PUT' : 'POST';
      
      await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(categoriaData)
      });
      
      setShowForm(false);
      setEditingCategoria(null);
      fetchCategorias();
    } catch (error) {
      console.error('Error al guardar categoría:', error);
      alert('Error al guardar la categoría');
    }
  };

  const handleEdit = (categoria: CategoriaTarea) => {
    setEditingCategoria(categoria);
    setShowForm(true);
  };

  const handleDelete = async (categoria: CategoriaTarea) => {
    if (!token) return;
    
    const mensaje = categoria._count?.tareas && categoria._count.tareas > 0
      ? `¿Desactivar la categoría "${categoria.nombre}"? Tiene ${categoria._count.tareas} tareas asociadas.`
      : `¿Eliminar la categoría "${categoria.nombre}"?`;
      
    if (!confirm(mensaje)) return;
    
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
      await fetch(`${API_URL}/categorias-tarea/${categoria.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      fetchCategorias();
    } catch (error) {
      console.error('Error al eliminar categoría:', error);
      alert('Error al eliminar la categoría');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingCategoria(null);
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-600">Cargando categorías...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Categorías de Tareas</h2>
          <p className="text-gray-600">Gestiona las categorías para organizar las tareas</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <span>➕</span>
          <span>Nueva Categoría</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categorias.map(categoria => (
          <div
            key={categoria.id}
            className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                  style={{ backgroundColor: categoria.color || '#3b82f6' }}
                >
                  {categoria.icono || '📋'}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{categoria.nombre}</h3>
                  <p className="text-sm text-gray-500">
                    {categoria._count?.tareas || 0} tareas
                  </p>
                </div>
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={() => handleEdit(categoria)}
                  className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                  title="Editar categoría"
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleDelete(categoria)}
                  className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                  title="Eliminar categoría"
                >
                  🗑️
                </button>
              </div>
            </div>
            
            {categoria.descripcion && (
              <p className="text-sm text-gray-600 mb-3">{categoria.descripcion}</p>
            )}
            
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Creada: {new Date(categoria.creadoEn).toLocaleDateString()}</span>
              <span className={`px-2 py-1 rounded-full ${
                categoria.activa 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {categoria.activa ? 'Activa' : 'Inactiva'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {categorias.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay categorías</h3>
          <p className="text-gray-500 mb-6">Crea tu primera categoría para organizar las tareas</p>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary"
          >
            ➕ Crear Primera Categoría
          </button>
        </div>
      )}

      {showForm && (
        <CategoriaTareaForm
          categoria={editingCategoria}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
};

export default CategoriaTareaManager;