import React from 'react';
import { DocumentTextIcon, CalendarIcon, UserIcon } from '@heroicons/react/24/outline';

interface Articulo {
  id: number;
  titulo: string;
  contenido: string;
  categoriaId: number;
  categoria?: {
    nombre: string;
  };
  autor?: {
    nombre: string;
  };
  createdAt: string;
  updatedAt: string;
  adjuntos?: string[];
}

interface ArticuloListProps {
  articulos: Articulo[];
  selectedArticuloId?: number;
  onSelectArticulo: (articulo: Articulo) => void;
  onEditArticulo: (articulo: Articulo) => void;
  onDeleteArticulo: (articulo: Articulo) => void;
  onNewArticulo: () => void;
  categoriaActual?: {
    id: number;
    nombre: string;
  };
}

const ArticuloList: React.FC<ArticuloListProps> = ({
  articulos,
  selectedArticuloId,
  onSelectArticulo,
  onEditArticulo,
  onDeleteArticulo,
  onNewArticulo,
  categoriaActual
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const truncateContent = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            {categoriaActual ? `Artículos - ${categoriaActual.nombre}` : 'Todos los Artículos'}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {articulos.length} artículo{articulos.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={onNewArticulo}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <span className="emoji-icon">➕</span>
          <span>Nuevo Artículo</span>
        </button>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {articulos.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <DocumentTextIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">No hay artículos</p>
            <p className="text-sm">
              {categoriaActual 
                ? `No hay artículos en la categoría "${categoriaActual.nombre}"`
                : 'Crea el primer artículo para comenzar'
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {articulos.map((articulo) => (
              <div
                key={articulo.id}
                className={`
                  p-4 cursor-pointer transition-colors hover:bg-gray-50
                  ${selectedArticuloId === articulo.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''}
                `}
                onClick={() => onSelectArticulo(articulo)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <DocumentTextIcon className="w-5 h-5 text-blue-600" />
                      <h4 className="font-semibold text-gray-900 text-lg">{articulo.titulo}</h4>
                      {articulo.adjuntos && articulo.adjuntos.length > 0 && (
                        <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                          {articulo.adjuntos.length} adjunto{articulo.adjuntos.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {truncateContent(articulo.contenido)}
                    </p>
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      {articulo.categoria && (
                        <span className="bg-gray-100 px-2 py-1 rounded">
                          {articulo.categoria.nombre}
                        </span>
                      )}
                      <div className="flex items-center space-x-1">
                        <CalendarIcon className="w-3 h-3" />
                        <span>{formatDate(articulo.createdAt)}</span>
                      </div>
                      {articulo.autor && (
                        <div className="flex items-center space-x-1">
                          <UserIcon className="w-3 h-3" />
                          <span>{articulo.autor.nombre}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1 ml-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditArticulo(articulo);
                      }}
                      className="p-1 hover:bg-blue-100 rounded text-blue-600"
                      title="Editar artículo"
                    >
                      <span className="emoji-icon">✏️</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteArticulo(articulo);
                      }}
                      className="p-1 hover:bg-red-100 rounded text-red-600"
                      title="Eliminar artículo"
                    >
                      <span className="emoji-icon">🗑️</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ArticuloList; 