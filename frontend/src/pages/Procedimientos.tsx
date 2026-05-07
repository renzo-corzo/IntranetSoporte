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
  categoria?: { nombre: string };
  autor?: { nombre: string };
  creadoPor?: { nombre: string };
  createdAt?: string;
  updatedAt?: string;
  creadoEn?: string;
  adjuntos?: string[];
  codigo?: string;
  version?: string;
  area?: string;
  responsable?: string;
  estado?: string;
  fechaRevision?: string;
}

const Procedimientos: React.FC = () => {
  const { token } = useAuth();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [articulos, setArticulos] = useState<Articulo[]>([]);
  const [selectedCategoria, setSelectedCategoria] = useState<Categoria | null>(null);
  const [selectedArticulo, setSelectedArticulo] = useState<Articulo | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
  
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

  // Función helper para obtener la URL base (sin /api)
  const getBaseUrl = () => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
    // Si tiene /api, lo removemos; si no, usamos la URL tal cual
    return apiUrl.replace('/api', '') || window.location.origin;
  };

  // Procesar contenido para limpiar URLs blob
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
      '[Imagen no disponible]'
    );
    
    return processedContent;
  };

  const fetchCategorias = async () => {
    try {
      const data = await getCategorias();
      setCategorias(data || []);
    } catch (err: any) {
      console.error("Error al cargar categorías:", err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        alert("Error de autenticación. Por favor, cerrá sesión y volvé a iniciar sesión.");
      }
      setCategorias([]);
    }
  };

  const fetchArticulos = async (categoriaId?: number) => {
    try {
      const data = await getArticulos(undefined, categoriaId);
      setArticulos(data || []);
    } catch (err: any) {
      console.error("Error al cargar artículos:", err);
      setArticulos([]);
    }
  };

  const fetchArticuloById = async (id: number) => {
    try {
      const data = await getArticuloById(id);
      setSelectedArticulo(data);
    } catch (err: any) {
      console.error("Error al cargar artículo:", err);
      alert(`Error al cargar artículo: ${err.response?.data?.error || err.message || "Error desconocido"}`);
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      const storedToken = localStorage.getItem('token');
      if (!token && !storedToken) {
        setLoading(false);
        return;
      }
      setLoading(true);
      await Promise.allSettled([fetchCategorias(), fetchArticulos()]);
      setLoading(false);
    };
    initializeData();
  }, [token]);

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
      await deleteCategoria(categoria.id);
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
        await updateCategoria(editCategoria.id, categoriaData);
      } else {
        await createCategoria(categoriaData);
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
      await deleteArticulo(articulo.id);
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
        await updateArticulo(editArticulo.id, articuloData);
      } else {
        await createArticulo(articuloData);
      }
      setShowArticuloForm(false);
      setEditArticulo(null);
      await fetchArticulos(selectedCategoria?.id);
    } catch (err: any) {
      console.error("Error al guardar artículo:", err);
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
        const todosLosArticulos = await getArticulos();
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
                  articulos.map((articulo) => {
                    const estadoBadge: Record<string, string> = {
                      'Vigente':  'bg-green-900 text-green-300 border-green-700',
                      'Borrador': 'bg-yellow-900 text-yellow-300 border-yellow-700',
                      'Obsoleto': 'bg-red-900 text-red-300 border-red-700',
                    };
                    const badgeCls = estadoBadge[articulo.estado || 'Borrador'] || estadoBadge['Borrador'];
                    return (
                    <div
                      key={articulo.id}
                      className="bg-gray-800 border border-gray-700 rounded-lg p-4 cursor-pointer hover:bg-gray-700 transition-colors group"
                      onClick={() => handleSelectArticulo(articulo)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          {/* Badges superiores */}
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            {articulo.codigo && (
                              <span className="font-mono text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded border border-gray-600">
                                {articulo.codigo}
                              </span>
                            )}
                            <span className={`text-xs font-medium px-2 py-0.5 rounded border ${badgeCls}`}>
                              {articulo.estado || 'Borrador'}
                            </span>
                            {articulo.version && (
                              <span className="text-xs text-gray-500">v{articulo.version}</span>
                            )}
                          </div>
                          <h3 className="text-base font-semibold text-white mb-1 truncate">{articulo.titulo}</h3>
                          {/* Info row */}
                          <div className="flex flex-wrap gap-3 text-xs text-gray-400 mt-1">
                            {articulo.area && <span>🏢 {articulo.area}</span>}
                            {articulo.responsable && <span>👤 {articulo.responsable}</span>}
                            {articulo.fechaRevision && (
                              <span>🔄 {new Date(articulo.fechaRevision).toLocaleDateString('es-AR')}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <button onClick={e => { e.stopPropagation(); handleEditArticulo(articulo); }}
                            className="px-2 py-1 hover:bg-gray-600 rounded text-gray-400 hover:text-white text-xs">✏️</button>
                          <button onClick={e => { e.stopPropagation(); handleDeleteArticulo(articulo); }}
                            className="px-2 py-1 hover:bg-red-700 rounded text-gray-400 hover:text-red-300 text-xs">🗑️</button>
                        </div>
                      </div>
                    </div>
                  )})
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