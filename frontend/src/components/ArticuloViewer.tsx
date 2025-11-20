import React from 'react';

interface ArticuloViewerProps {
  articulo: {
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
  } | null;
  onEdit: (articulo: any) => void;
  onDelete: (articulo: any) => void;
  onBack: () => void;
}

const ArticuloViewer: React.FC<ArticuloViewerProps> = ({
  articulo,
  onEdit,
  onDelete,
  onBack
}) => {
  // Función helper para obtener la URL base (sin /api)
  const getBaseUrl = () => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
    // Si tiene /api, lo removemos; si no, usamos la URL tal cual
    return apiUrl.replace('/api', '') || window.location.origin;
  };

  // Procesar el contenido para limpiar URLs blob y convertir rutas relativas
  const processContent = (content: string) => {
    if (!content) return '';
    
    let processedContent = content;
    const baseUrl = getBaseUrl();
    
    // Reemplazar rutas de imágenes relativas por absolutas
    processedContent = processedContent.replace(
      /<img([^>]*?)src="(?!http)([^"]*)"([^>]*?)>/gi,
      `<img$1src="${baseUrl}/$2"$3>`
    );
    
    // Remover imágenes con URLs blob (que ya no funcionan)
    processedContent = processedContent.replace(
      /<img[^>]*src="blob:[^"]*"[^>]*>/gi,
      '<div style="padding: 20px; background: #374151; border: 2px dashed #6b7280; border-radius: 8px; text-align: center; color: #9ca3af; margin: 10px 0;"><p>🖼️ Imagen no disponible</p><p style="font-size: 12px;">Esta imagen debe ser subida nuevamente</p></div>'
    );
    
    return processedContent;
  };

  if (!articulo) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-900">
        <div className="text-center text-gray-400">
          <div className="text-6xl mb-4">📄</div>
          <h3 className="text-lg font-medium mb-2">Selecciona un artículo</h3>
          <p className="text-sm">
            Haz clic en un artículo de la lista para ver su contenido
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header del artículo */}
      <div className="p-6 border-b border-gray-700 bg-gray-800">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <button
                onClick={onBack}
                className="text-gray-400 hover:text-white flex items-center space-x-2"
              >
                <span>←</span>
                <span>Volver</span>
              </button>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              {articulo.titulo}
            </h1>
            <div className="flex items-center space-x-4 text-sm text-gray-300">
              {articulo.categoria && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-600 text-white">
                  📁 {articulo.categoria.nombre}
                </span>
              )}
              {articulo.autor && (
                <span>👤 {articulo.autor.nombre}</span>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onEdit(articulo)}
              className="p-2 text-blue-400 hover:bg-gray-700 rounded-lg transition-colors"
              title="Editar artículo"
            >
              ✏️
            </button>
            <button
              onClick={() => onDelete(articulo)}
              className="p-2 text-red-400 hover:bg-gray-700 rounded-lg transition-colors"
              title="Eliminar artículo"
            >
              🗑️
            </button>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-xs text-gray-400">
          <div>
            <span>Creado: {new Date(articulo.createdAt).toLocaleDateString('es-ES')}</span>
            {articulo.updatedAt !== articulo.createdAt && (
              <span className="ml-4">
                Actualizado: {new Date(articulo.updatedAt).toLocaleDateString('es-ES')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Contenido del artículo */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {/* Contenido principal */}
          <div 
            className="text-gray-200 leading-relaxed prose prose-invert prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: processContent(articulo.contenido) }}
          />
          
          {/* Adjuntos */}
          {articulo.adjuntos && articulo.adjuntos.length > 0 && (
            <div className="mt-8 pt-6 border-t border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">
                📎 Archivos adjuntos ({articulo.adjuntos.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {articulo.adjuntos.map((adjunto, index) => {
                  const isImage = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(adjunto);
                  // Construir URL completa si es una ruta relativa
                  const baseUrl = getBaseUrl();
                  const imageUrl = adjunto.startsWith('http') ? adjunto : `${baseUrl}/${adjunto}`;
                  
                  return (
                    <div key={index} className="border border-gray-600 rounded-lg overflow-hidden bg-gray-800">
                      {isImage ? (
                        <div className="aspect-video bg-gray-700 flex items-center justify-center">
                          <img
                            src={imageUrl}
                            alt={`Adjunto ${index + 1}`}
                            className="max-w-full max-h-full object-contain"
                            onError={(e) => {
                              console.log('Error cargando imagen:', imageUrl);
                              e.currentTarget.style.display = 'none';
                              const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                              if (nextElement) {
                                nextElement.style.display = 'flex';
                              }
                            }}
                            onLoad={() => {
                              console.log('Imagen cargada correctamente:', imageUrl);
                            }}
                          />
                          <div 
                            className="hidden items-center justify-center text-gray-400 text-sm"
                            style={{ display: 'none' }}
                          >
                            🖼️ Imagen no disponible
                            <br />
                            <small>{adjunto}</small>
                          </div>
                        </div>
                      ) : (
                        <div className="aspect-video bg-gray-700 flex items-center justify-center">
                          <div className="text-center text-gray-400">
                            <div className="text-3xl mb-2">📄</div>
                            <div className="text-sm">Archivo adjunto</div>
                            <div className="text-xs mt-1 opacity-60">{adjunto}</div>
                          </div>
                        </div>
                      )}
                      <div className="p-3 bg-gray-800 flex justify-between items-center">
                        <a
                          href={imageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 text-sm font-medium truncate"
                        >
                          Ver archivo
                        </a>
                        <button
                          onClick={() => {
                            if (confirm('¿Eliminar este archivo adjunto?')) {
                              // TODO: Implementar eliminación
                              console.log('Eliminar adjunto:', adjunto);
                            }
                          }}
                          className="text-red-400 hover:text-red-300 text-sm p-1 ml-2"
                          title="Eliminar adjunto"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArticuloViewer; 