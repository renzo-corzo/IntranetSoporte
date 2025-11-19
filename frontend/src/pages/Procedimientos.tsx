import React, { useEffect, useState } from "react";
// import CategoriaTree from "../components/CategoriaTree";
// import ArticuloList from "../components/ArticuloList";
import ArticuloViewer from "../components/ArticuloViewer";
import CategoriaForm from "../components/CategoriaForm";
import ArticuloForm from "../components/ArticuloForm";
import {
  getCategorias,
  createCategoria,
  updateCategoria,
  deleteCategoria,
  getArticulos,
  getArticuloById,
  createArticulo,
  updateArticulo,
  deleteArticulo
} from "../apiKB";
import { useAuth } from "../context/AuthContext";

interface Categoria {
  id: number;
  nombre: string;
  descripcion?: string;
  padreId?: number;
  subcategorias?: Categoria[];
}

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

const Procedimientos: React.FC = () => {
  const { token } = useAuth();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [articulos, setArticulos] = useState<Articulo[]>([]);
  const [selectedCategoria, setSelectedCategoria] = useState<Categoria | null>(null);
  const [selectedArticulo, setSelectedArticulo] = useState<Articulo | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
  
  // Evitar warnings de variables no usadas
  console.log('Categorías expandidas:', expandedCategories, setExpandedCategories);
  
  // Estados para formularios
  const [showCategoriaForm, setShowCategoriaForm] = useState(false);
  const [showArticuloForm, setShowArticuloForm] = useState(false);
  const [editCategoria, setEditCategoria] = useState<Categoria | null>(null);
  const [editArticulo, setEditArticulo] = useState<Articulo | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [searchResults, setSearchResults] = useState<{
    categorias: Categoria[];
    articulos: Articulo[];
  } | null>(null);

  // Procesar contenido para limpiar URLs blob
  const processContent = (content: string) => {
    if (!content) return '';
    
    let processedContent = content;
    
    // Reemplazar rutas de imágenes relativas por absolutas
    processedContent = processedContent.replace(
      /<img([^>]*?)src="(?!http)([^"]*)"([^>]*?)>/gi,
      `<img$1src="http://localhost:4000/$2"$3>`
    );
    
    // Remover imágenes con URLs blob (que ya no funcionan)
    processedContent = processedContent.replace(
      /<img[^>]*src="blob:[^"]*"[^>]*>/gi,
      '[Imagen no disponible]'
    );
    
    return processedContent;
  };

  const fetchCategorias = async () => {
    try {

      const data = await getCategorias(token || "");

      setCategorias(data);
    } catch (err) {

    }
  };

  const fetchArticulos = async (categoriaId?: number) => {
    try {
      const data = await getArticulos(token || "", categoriaId);


      setArticulos(data);
    } catch (err) {

    }
  };

  const fetchArticuloById = async (id: number) => {
    try {
      const data = await getArticuloById(id, token || "");
      setSelectedArticulo(data);
    } catch (err) {

    }
  };

  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      await Promise.all([
        fetchCategorias(),
        fetchArticulos()
      ]);
      setLoading(false);
    };
    initializeData();
  }, []);

  // Handlers para categorías
  const handleSelectCategoria = (categoria: Categoria) => {
    setSelectedCategoria(categoria);
    setSelectedArticulo(null);
    fetchArticulos(categoria.id);
  };

  const handleEditCategoria = (categoria: Categoria) => {
    setEditCategoria(categoria);
    setShowCategoriaForm(true);
  };

  const handleDeleteCategoria = async (categoria: Categoria) => {
    try {
      // Primero intentar eliminación normal
      await deleteCategoria(categoria.id, token || "");
      await fetchCategorias();
      alert("Categoría eliminada exitosamente");
      if (selectedCategoria?.id === categoria.id) {
        setSelectedCategoria(null);
        fetchArticulos();
      }
    } catch (err: any) {
      console.error("Error al eliminar categoría:", err);
      const errorMessage = err.response?.data?.error || err.message || "Error desconocido";
      
      // Si la categoría tiene artículos o subcategorías, ofrecer opciones
      if (err.response?.status === 400) {
        // Determinar si son subcategorías o artículos
        const hasSubcategories = err.response?.data?.subcategorias?.length > 0;
        const hasArticles = err.response?.data?.count > 0;
        
        let confirmMessage = `${errorMessage}\n\n¿Quieres eliminar la categoría "${categoria.nombre}"`;
        let endpoint = '/clean';
        
        if (hasSubcategories && hasArticles) {
          confirmMessage += " junto con todas sus subcategorías y artículos?";
          endpoint = '/clean';
        } else if (hasSubcategories) {
          confirmMessage += " junto con todas sus subcategorías?";
          endpoint = '/clean';
        } else if (hasArticles) {
          confirmMessage += " junto con todos sus artículos?";
          endpoint = '/force';
        }
        
        confirmMessage += " Esta acción no se puede deshacer.";
        
        const forceDelete = window.confirm(confirmMessage);
        
        if (forceDelete) {
          try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
            const response = await fetch(`${API_URL}/kb/categorias/${categoria.id}${endpoint}`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (response.ok) {
              const result = await response.json();
              await fetchCategorias();
              
              let successMessage = "Categoría eliminada exitosamente.";
              if (result.deletedSubcategories > 0) {
                successMessage += ` Se eliminaron ${result.deletedSubcategories} subcategoría(s).`;
              }
              if (result.deletedArticles > 0) {
                successMessage += ` Se eliminaron ${result.deletedArticles} artículo(s).`;
              }
              
              alert(successMessage);
              if (selectedCategoria?.id === categoria.id) {
                setSelectedCategoria(null);
                fetchArticulos();
              }
            } else {
              const errorData = await response.json();
              alert(`Error: ${errorData.error}`);
            }
          } catch (forceErr) {
            alert("Error al eliminar categoría con artículos");
          }
        }
      } else {
        alert(`Error al eliminar categoría: ${errorMessage}`);
      }
    }
  };

  const handleCreateCategoria = () => {
    setEditCategoria(null);
    setShowCategoriaForm(true);
  };

  const handleSubmitCategoria = async (categoriaData: any) => {
    try {
      if (editCategoria) {
        await updateCategoria(editCategoria.id, categoriaData, token || "");
      } else {
        await createCategoria(categoriaData, token || "");
      }
      setShowCategoriaForm(false);
      setEditCategoria(null);
      await fetchCategorias();
    } catch (err) {
      alert("Error al guardar categoría");
    }
  };

  // Handlers para artículos
  const handleSelectArticulo = (articulo: Articulo) => {
    setSelectedArticulo(articulo);
  };

  const handleEditArticulo = (articulo: Articulo) => {
    setEditArticulo(articulo);
    setShowArticuloForm(true);
  };

  const handleDeleteArticulo = async (articulo: Articulo) => {
    if (!window.confirm(`¿Eliminar el artículo "${articulo.titulo}"?`)) return;
    
    try {
      await deleteArticulo(articulo.id, token || "");
      await fetchArticulos(selectedCategoria?.id);
      if (selectedArticulo?.id === articulo.id) {
        setSelectedArticulo(null);
      }
    } catch (err) {
      alert("Error al eliminar artículo");
    }
  };

  const handleCreateArticulo = () => {
    setEditArticulo(null);
    setShowArticuloForm(true);
  };

  const handleSubmitArticulo = async (articuloData: any) => {
    try {

      
      if (editArticulo) {
        await updateArticulo(editArticulo.id, articuloData, token || "");
      } else {
        await createArticulo(articuloData, token || "");
      }
      setShowArticuloForm(false);
      setEditArticulo(null);
      await fetchArticulos(selectedCategoria?.id);
      alert("Artículo guardado exitosamente!");
    } catch (err: any) {
      console.error("Error al guardar artículo:", err);
      console.error("Respuesta del servidor:", err.response?.data);
      alert(`Error al guardar artículo: ${err.response?.data?.error || err.message}`);
    }
  };

  // const handleToggleExpanded = (categoriaId: number) => {
  //   const newExpanded = new Set(expandedCategories);
  //   if (newExpanded.has(categoriaId)) {
  //     newExpanded.delete(categoriaId);
  //   } else {
  //     newExpanded.add(categoriaId);
  //   }
  //   setExpandedCategories(newExpanded);
  // };

  // const handleBackToList = () => {
  //   setSelectedArticulo(null);
  // };

  // Función de búsqueda
  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    
    if (!term.trim()) {
      setSearchResults(null);
      return;
    }

    try {
      const searchLower = term.toLowerCase();
      
      // Buscar en categorías
      const categoriasEncontradas = categorias.filter(categoria =>
        categoria.nombre.toLowerCase().includes(searchLower) ||
        (categoria.descripcion && categoria.descripcion.toLowerCase().includes(searchLower))
      );

      // Buscar en artículos
      const articulosEncontrados = articulos.filter(articulo =>
        articulo.titulo.toLowerCase().includes(searchLower) ||
        articulo.contenido.toLowerCase().includes(searchLower)
      );

      // Si no hay resultados locales, buscar en todos los artículos
      if (articulosEncontrados.length === 0) {
        const todosLosArticulos = await getArticulos(token || "");
        const articulosGlobales = todosLosArticulos.filter((articulo: any) =>
          articulo.titulo.toLowerCase().includes(searchLower) ||
          articulo.contenido.toLowerCase().includes(searchLower)
        );
        
        setSearchResults({
          categorias: categoriasEncontradas,
          articulos: articulosGlobales
        });
      } else {
        setSearchResults({
          categorias: categoriasEncontradas,
          articulos: articulosEncontrados
        });
      }
    } catch (error) {
      console.error("Error en búsqueda:", error);
    }
  };

  const clearSearch = () => {
    setSearchTerm("");
    setSearchResults(null);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-400 py-8">Cargando base de conocimientos...</div>
      </div>
    );
  }

  
  
  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Header como Zammad */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-3">
        <div className="flex items-center space-x-2 text-white">
          <span className="text-gray-400">📁</span>
          <span className="text-gray-400">→</span>
          <span className="font-medium">Procedimientos</span>
          {selectedCategoria && (
            <>
              <span className="text-gray-400">→</span>
              <span className="font-medium">{selectedCategoria.nombre}</span>
            </>
          )}
          {selectedArticulo && (
            <>
              <span className="text-gray-400">→</span>
              <span className="font-medium">{selectedArticulo.titulo}</span>
            </>
          )}
        </div>
      </div>

      {/* Barra de búsqueda como Zammad */}
      <div className="bg-gray-800 px-6 py-4 border-b border-gray-700">
        <div className="max-w-md">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-400">🔍</span>
            </div>
            <input
              type="text"
              placeholder="Buscar Procedimientos"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-600 rounded-md leading-5 bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:placeholder-gray-500 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                title="Limpiar búsqueda"
              >
                ❌
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Contenido principal - Navegación por niveles */}
      <div className="flex-1 overflow-hidden">
        {/* Resultados de búsqueda */}
        {searchResults && (
          <div className="p-6">
            <div className="max-w-6xl mx-auto">
              <div className="mb-6 flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Resultados de búsqueda: "{searchTerm}"
                  </h2>
                  <p className="text-gray-400">
                    {searchResults.categorias.length} categoría(s) y {searchResults.articulos.length} artículo(s) encontrados
                  </p>
                </div>
                <button
                  onClick={clearSearch}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  ❌ Cerrar búsqueda
                </button>
              </div>

              {/* Categorías encontradas */}
              {searchResults.categorias.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-white mb-4">📁 Categorías</h3>
                  <div className="grid grid-cols-3 gap-6">
                    {searchResults.categorias.map((categoria) => (
                      <div 
                        key={categoria.id}
                        className="bg-gray-800 border border-gray-700 rounded-lg p-6 cursor-pointer hover:bg-gray-700 transition-colors text-center"
                        onClick={() => {
                          clearSearch();
                          handleSelectCategoria(categoria);
                        }}
                      >
                        <div className="text-5xl mb-4">📁</div>
                        <h4 className="text-base font-semibold text-white mb-2">{categoria.nombre}</h4>
                        <p className="text-gray-400 text-sm">
                          {categoria.descripcion || 'Sin descripción'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Artículos encontrados */}
              {searchResults.articulos.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">📄 Artículos</h3>
                  <div className="space-y-4">
                    {searchResults.articulos.map((articulo) => (
                      <div 
                        key={articulo.id}
                        className="bg-gray-800 border border-gray-700 rounded-lg p-6 cursor-pointer hover:bg-gray-700 transition-colors"
                        onClick={() => {
                          clearSearch();
                          fetchArticuloById(articulo.id);
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold text-white mb-2">
                              📄 {articulo.titulo}
                            </h4>
                            <p className="text-gray-400 text-sm mb-2">
                              Categoría: {articulo.categoria?.nombre || 'Sin categoría'}
                            </p>
                            <p className="text-gray-300 text-sm line-clamp-2">
                              {articulo.contenido.replace(/<[^>]*>/g, '').substring(0, 150)}...
                            </p>
                          </div>
                          <div className="text-xs text-gray-500 ml-4">
                            {new Date(articulo.createdAt || (articulo as any).creadoEn).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sin resultados */}
              {searchResults.categorias.length === 0 && searchResults.articulos.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-lg font-medium text-white mb-2">No se encontraron resultados</h3>
                  <p className="text-gray-400 mb-6">
                    No hay categorías ni artículos que coincidan con "{searchTerm}"
                  </p>
                  <button
                    onClick={clearSearch}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Volver a categorías
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Nivel 1: Categorías */}
        {!selectedCategoria && !selectedArticulo && !searchResults && (
          <div className="p-6">
            <div className="max-w-6xl mx-auto">
              <div className="mb-6 flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Categorías</h2>
                  <p className="text-gray-400">Selecciona una categoría para ver sus artículos</p>
                </div>
                <button
                  onClick={handleCreateCategoria}
                  style={{
                    backgroundColor: '#10b981',
                    color: 'white',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    fontWeight: '600',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '14px',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                  }}
                  onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = '#059669'}
                  onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = '#10b981'}
                >
                  <span>➕</span>
                  <span>Nueva Categoría</span>
                </button>
              </div>
              
              <div className="grid grid-cols-3 gap-6 max-w-4xl mx-auto">
                {categorias.map((categoria) => (
                  <div 
                    key={categoria.id}
                    className="bg-gray-800 border border-gray-700 rounded-lg p-6 cursor-pointer hover:bg-gray-700 transition-colors group text-center"
                    onClick={() => handleSelectCategoria(categoria)}
                  >
                    <div className="text-5xl mb-4">📁</div>
                    <h3 className="text-base font-semibold text-white mb-2">{categoria.nombre}</h3>
                    <p className="text-gray-400 text-sm">
                      {articulos.filter(a => a.categoriaId === categoria.id).length} artículos en esta categoría
                    </p>
                    <div className="flex justify-center space-x-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditCategoria(categoria);
                        }}
                        className="px-3 py-1 hover:bg-gray-600 rounded text-gray-400 hover:text-white text-xs flex items-center space-x-1"
                        title="Editar categoría"
                      >
                        <span>✏️</span>
                        <span>Editar</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCategoria(categoria);
                        }}
                        className="px-3 py-1 hover:bg-red-600 rounded text-gray-400 hover:text-white text-xs flex items-center space-x-1"
                        title="Eliminar categoría"
                      >
                        <span>🗑️</span>
                        <span>Eliminar</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 text-center">
                <button
                  onClick={handleCreateCategoria}
                  style={{
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    fontWeight: '600',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    margin: '0 auto',
                    fontSize: '16px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                  }}
                  onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = '#2563eb'}
                  onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = '#3b82f6'}
                >
                  <span style={{ fontSize: '18px' }}>➕</span>
                  <span>Nueva Categoría</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Nivel 2: Artículos de la categoría */}
        {selectedCategoria && !selectedArticulo && (
          <div className="p-6">
            <div className="max-w-4xl mx-auto">
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">{selectedCategoria.nombre}</h2>
                    <p className="text-gray-400">{articulos.length} artículos en esta categoría</p>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setSelectedCategoria(null)}
                      className="text-gray-400 hover:text-white flex items-center space-x-2"
                    >
                      <span>←</span>
                      <span>Volver a categorías</span>
                    </button>
                    <button
                      onClick={handleCreateArticulo}
                      style={{
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        fontWeight: '500',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                      onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = '#2563eb'}
                      onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = '#3b82f6'}
                    >
                      ➕ Nuevo Artículo
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                {articulos.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📄</div>
                    <h3 className="text-lg font-medium text-white mb-2">No hay artículos</h3>
                    <p className="text-gray-400 mb-6">
                      No hay artículos en la categoría "{selectedCategoria.nombre}"
                    </p>
                    <button
                      onClick={handleCreateArticulo}
                      style={{
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        padding: '12px 24px',
                        borderRadius: '8px',
                        fontWeight: '500',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '16px'
                      }}
                      onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = '#2563eb'}
                      onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = '#3b82f6'}
                    >
                      ➕ Crear primer artículo
                    </button>
                  </div>
                ) : (
                  articulos.map((articulo) => (
                    <div
                      key={articulo.id}
                      className="bg-gray-800 border border-gray-700 rounded-lg p-6 cursor-pointer hover:bg-gray-700 transition-colors group"
                      onClick={() => handleSelectArticulo(articulo)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-white mb-2">{articulo.titulo}</h3>
                          <div
                            className="text-gray-400 text-sm mb-3"
                            dangerouslySetInnerHTML={{
                              __html: processContent(articulo.contenido).substring(0, 150) + '...'
                            }}
                          />
                          {articulo.adjuntos && articulo.adjuntos.length > 0 && (
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-500">
                                📎 {articulo.adjuntos.length} adjunto{articulo.adjuntos.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity ml-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditArticulo(articulo);
                            }}
                            className="px-3 py-1 hover:bg-gray-600 rounded text-gray-400 hover:text-white text-xs flex items-center space-x-1"
                            title="Editar artículo"
                          >
                            <span>✏️</span>
                            <span>Editar</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteArticulo(articulo);
                            }}
                            className="px-3 py-1 hover:bg-red-600 rounded text-gray-400 hover:text-white text-xs flex items-center space-x-1"
                            title="Eliminar artículo"
                          >
                            <span>🗑️</span>
                            <span>Eliminar</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Nivel 3: Visor del artículo */}
        {selectedArticulo && (
          <div className="h-full">
            <ArticuloViewer
              articulo={selectedArticulo}
              onEdit={handleEditArticulo}
              onDelete={handleDeleteArticulo}
              onBack={() => setSelectedArticulo(null)}
            />
          </div>
        )}
      </div>

      {/* Formularios modales */}
      {showCategoriaForm && (
        <CategoriaForm
          categoria={editCategoria}
          categorias={categorias}
          onSubmit={handleSubmitCategoria}
          onCancel={() => {
            setShowCategoriaForm(false);
            setEditCategoria(null);
          }}
        />
      )}

      {showArticuloForm && (
        <ArticuloForm
          articulo={editArticulo}
          categorias={categorias}
          onSubmit={handleSubmitArticulo}
          onCancel={() => {
            setShowArticuloForm(false);
            setEditArticulo(null);
          }}
        />
      )}
    </div>
  );
};

export default Procedimientos; 