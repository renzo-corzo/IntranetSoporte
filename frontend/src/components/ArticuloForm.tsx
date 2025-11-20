import React, { useState, useEffect, useRef } from 'react';
// import { PaperClipIcon } from '@heroicons/react/24/outline';

interface ArticuloFormProps {
  articulo?: {
    id?: number;
    titulo: string;
    contenido: string;
    categoriaId: number;
    adjuntos?: string[];
  } | null;
  categorias: Array<{
    id: number;
    nombre: string;
  }>;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const ArticuloForm: React.FC<ArticuloFormProps> = ({
  articulo,
  categorias,
  onSubmit,
  onCancel
}) => {
  const [titulo, setTitulo] = useState(articulo?.titulo || '');
  const [categoriaId, setCategoriaId] = useState(articulo?.categoriaId || '');
  const [contenido, setContenido] = useState(articulo?.contenido || '');
  const [adjuntos, setAdjuntos] = useState<string[]>(articulo?.adjuntos || []);
  const [uploading, setUploading] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  // Función para subir archivo al servidor
  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:4000/api"}/upload/file`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Error al subir archivo');
      }

      const data = await response.json();
      return data.filePath; // Retorna la ruta del archivo
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error al subir archivo');
      return null;
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = contenido;
    }
  }, []);

  const handleEditorChange = () => {
    if (editorRef.current) {
      setContenido(editorRef.current.innerHTML);
    }
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    e.preventDefault();
    const items = e.clipboardData.items;
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        if (file) {
          // Subir archivo al servidor
          const filePath = await uploadFile(file);
          if (filePath) {
            // Crear imagen para insertar en el contenido
            const img = document.createElement('img');
            img.src = `${import.meta.env.VITE_API_URL?.replace('/api', '') || "http://localhost:4000"}/${filePath}`;
            img.style.maxWidth = '100%';
            img.style.height = 'auto';
            img.style.margin = '10px 0';
            img.style.borderRadius = '8px';
            img.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
            
            // Insertar la imagen en el cursor actual
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
              const range = selection.getRangeAt(0);
              range.deleteContents();
              range.insertNode(img);
              range.collapse(false);
              
              // Actualizar el contenido
              if (editorRef.current) {
                setContenido(editorRef.current.innerHTML);
              }
            }
            
            // Agregar la ruta del archivo a adjuntos
            setAdjuntos(prev => [...prev, filePath]);
          }
        }
      } else if (item.type === 'text/plain') {
        item.getAsString((text) => {
          document.execCommand('insertText', false, text);
        });
      }
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        // Subir archivo al servidor
        const filePath = await uploadFile(file);
        if (filePath) {
          // Crear imagen para insertar en el contenido
          const img = document.createElement('img');
          img.src = `${import.meta.env.VITE_API_URL?.replace('/api', '') || "http://localhost:4000"}/${filePath}`;
          img.style.maxWidth = '100%';
          img.style.height = 'auto';
          img.style.margin = '10px 0';
          img.style.borderRadius = '8px';
          img.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
          
          // Insertar la imagen en el cursor actual
          const selection = window.getSelection();
          if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            range.deleteContents();
            range.insertNode(img);
            range.collapse(false);
            
            // Actualizar el contenido
            if (editorRef.current) {
              setContenido(editorRef.current.innerHTML);
            }
          }
          
          // Agregar la ruta del archivo a adjuntos
          setAdjuntos(prev => [...prev, filePath]);
        }
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!titulo.trim() || !categoriaId) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    onSubmit({
      id: articulo?.id,
      titulo: titulo.trim(),
      contenido: contenido.trim(),
      categoriaId: parseInt(categoriaId.toString()),
      adjuntos
    });
  };

  const insertImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const url = URL.createObjectURL(file);
        const img = document.createElement('img');
        img.src = url;
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
        img.style.margin = '10px 0';
        
        // Insertar la imagen en el cursor actual
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          range.deleteContents();
          range.insertNode(img);
          range.collapse(false);
        }
        
        // Agregar la URL a adjuntos
        setAdjuntos(prev => [...prev, url]);
      }
    };
    input.click();
  };

  const formatText = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '24px',
        width: '90%',
        maxWidth: '800px',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
      }}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">
            {articulo ? 'Editar Artículo' : 'Nuevo Artículo'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ❌
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Campos básicos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                TÍTULO *
              </label>
              <input
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Título del artículo"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CATEGORÍA *
              </label>
              <select
                value={categoriaId}
                onChange={(e) => setCategoriaId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Seleccionar categoría</option>
                {categorias.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Barra de herramientas del editor */}
          <div className="border border-gray-300 rounded-t-md p-2 bg-gray-50">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => formatText('bold')}
                className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100"
                title="Negrita"
              >
                <strong>B</strong>
              </button>
              <button
                type="button"
                onClick={() => formatText('italic')}
                className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100"
                title="Cursiva"
              >
                <em>I</em>
              </button>
              <button
                type="button"
                onClick={() => formatText('underline')}
                className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100"
                title="Subrayado"
              >
                <u>U</u>
              </button>
              <div className="border-l border-gray-300 mx-2"></div>
              <button
                type="button"
                onClick={() => formatText('insertUnorderedList')}
                className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100"
                title="Lista"
              >
                📋
              </button>
              <button
                type="button"
                onClick={() => formatText('insertOrderedList')}
                className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100"
                title="Lista numerada"
              >
                1️⃣
              </button>
              <div className="border-l border-gray-300 mx-2"></div>
              <button
                type="button"
                onClick={insertImage}
                className="px-3 py-1 bg-blue-500 text-white border border-blue-500 rounded hover:bg-blue-600"
                title="Insertar imagen"
              >
                📷 Insertar imagen
              </button>
            </div>
          </div>

          {/* Editor de contenido */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CONTENIDO *
            </label>
                         <div
               ref={editorRef}
               contentEditable
               onInput={handleEditorChange}
               onPaste={handlePaste}
               onDrop={handleDrop}
               onDragOver={(e) => e.preventDefault()}
               className="w-full min-h-[300px] px-4 py-3 border border-gray-300 rounded-b-md focus:outline-none focus:ring-2 focus:ring-blue-500"
               style={{
                 fontFamily: 'Arial, sans-serif',
                 fontSize: '14px',
                 lineHeight: '1.6'
               }}
             />
            <p className="text-xs text-gray-500 mt-2">
              💡 Puedes pegar imágenes directamente con Ctrl+V o arrastrarlas aquí
            </p>
          </div>

          {/* Adjuntos actuales */}
          {adjuntos.length > 0 && (
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                📎 ARCHIVOS ADJUNTOS ({adjuntos.length})
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {adjuntos.map((adjunto, index) => {
                  const isImage = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(adjunto);
                  const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || window.location.origin;
                  const imageUrl = adjunto.startsWith('http') ? adjunto : `${baseUrl}/${adjunto}`;
                  
                  return (
                    <div key={index} className="border border-gray-300 rounded-lg overflow-hidden bg-white">
                      {isImage ? (
                        <div className="aspect-video bg-gray-100 flex items-center justify-center">
                          <img
                            src={imageUrl}
                            alt={`Adjunto ${index + 1}`}
                            className="max-w-full max-h-full object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                              if (nextElement) {
                                nextElement.style.display = 'flex';
                              }
                            }}
                          />
                          <div 
                            className="hidden items-center justify-center text-gray-500 text-sm"
                            style={{ display: 'none' }}
                          >
                            🖼️ Imagen no disponible
                          </div>
                        </div>
                      ) : (
                        <div className="aspect-video bg-gray-100 flex items-center justify-center">
                          <div className="text-center text-gray-500">
                            <div className="text-3xl mb-2">📄</div>
                            <div className="text-sm">Archivo adjunto</div>
                          </div>
                        </div>
                      )}
                      <div className="p-3 bg-white flex justify-between items-center">
                        <a
                          href={imageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium truncate"
                        >
                          Ver archivo
                        </a>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm('¿Eliminar este archivo adjunto?')) {
                              setAdjuntos(prev => prev.filter((_, i) => i !== index));
                            }
                          }}
                          className="text-red-600 hover:text-red-800 text-sm p-1 ml-2"
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

          {/* Botones */}
          <div 
            className="flex justify-end space-x-3 pt-4 border-t border-gray-200"
            style={{ 
              position: 'sticky',
              bottom: 0,
              backgroundColor: 'white',
              padding: '16px 0',
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
                borderRadius: '6px',
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
              disabled={uploading}
              style={{
                padding: '10px 20px',
                backgroundColor: uploading ? '#9ca3af' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: uploading ? 'not-allowed' : 'pointer',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                opacity: uploading ? 0.6 : 1
              }}
              onMouseEnter={(e) => {
                if (!uploading) (e.target as HTMLElement).style.backgroundColor = '#2563eb';
              }}
              onMouseLeave={(e) => {
                if (!uploading) (e.target as HTMLElement).style.backgroundColor = '#3b82f6';
              }}
            >
              <span>{uploading ? '⏳' : (articulo ? '✏️' : '💾')}</span>
              <span>
                {uploading ? 'Subiendo...' : (articulo ? 'Actualizar' : 'Guardar') + ' Artículo'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ArticuloForm; 