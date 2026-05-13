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
      <div className="text-center text-slate-400 py-16">Cargando base de conocimientos...</div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Breadcrumb + Búsqueda */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <nav className="flex items-center gap-1.5 text-sm">
          <button
            className="font-semibold text-slate-800 hover:text-blue-600 transition-colors"
            onClick={() => { setSelectedCategoria(null); setSelectedArticulo(null); setSearchResults(null); setSearchTerm(''); fetchArticulos(); }}
          >
            Procedimientos
          </button>
          {selectedCategoria && (
            <>
              <span className="text-slate-400">›</span>
              <button
                className="text-slate-500 hover:text-blue-600 transition-colors"
                onClick={() => { setSelectedArticulo(null); }}
              >
                {selectedCategoria.nombre}
              </button>
            </>
          )}
          {selectedArticulo && (
            <>
              <span className="text-slate-400">›</span>
              <span className="text-slate-600 truncate max-w-xs">{selectedArticulo.titulo}</span>
            </>
          )}
        </nav>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Buscar procedimientos..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="form-input pl-9 py-2 text-sm w-64"
          />
          {searchTerm && (
            <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-sm">✕</button>
          )}
        </div>
      </div>

      {/* Resultados de búsqueda */}
      {searchResults && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Resultados para "{searchTerm}"</h2>
              <p className="text-sm text-slate-500">{searchResults.categorias.length} categoría(s) · {searchResults.articulos.length} artículo(s)</p>
            </div>
            <button onClick={clearSearch} className="btn-secondary btn-sm">✕ Cerrar</button>
          </div>

          {searchResults.categorias.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">📁 Categorías</p>
              <div className="grid grid-cols-3 gap-4">
                {searchResults.categorias.map((categoria) => (
                  <div key={categoria.id}
                    className="card card-body cursor-pointer hover:shadow-md hover:border-blue-200 transition-all text-center"
                    onClick={() => { clearSearch(); handleSelectCategoria(categoria); }}>
                    <div className="text-4xl mb-3">📁</div>
                    <h4 className="text-sm font-semibold text-slate-800">{categoria.nombre}</h4>
                    <p className="text-xs text-slate-500 mt-1">{categoria.descripcion || 'Sin descripción'}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {searchResults.articulos.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">📄 Artículos</p>
              <div className="space-y-2">
                {searchResults.articulos.map((articulo) => (
                  <div key={articulo.id}
                    className="card card-body cursor-pointer hover:shadow-md hover:border-blue-200 transition-all"
                    onClick={() => { clearSearch(); fetchArticuloById(articulo.id); }}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-slate-800 mb-0.5 truncate">📄 {articulo.titulo}</h4>
                        <p className="text-xs text-slate-500">Categoría: {articulo.categoria?.nombre || 'Sin categoría'}</p>
                        <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                          {articulo.contenido.replace(/<[^>]*>/g, '').substring(0, 150)}...
                        </p>
                      </div>
                      <span className="text-xs text-slate-400 flex-shrink-0">
                        {new Date(articulo.createdAt || (articulo as any).creadoEn).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {searchResults.categorias.length === 0 && searchResults.articulos.length === 0 && (
            <div className="text-center py-16">
              <div className="text-5xl mb-3">🔍</div>
              <h3 className="font-semibold text-slate-800 mb-1">Sin resultados</h3>
              <p className="text-sm text-slate-500 mb-4">No hay coincidencias para "{searchTerm}"</p>
              <button onClick={clearSearch} className="btn-primary btn-sm">Volver a categorías</button>
            </div>
          )}
        </div>
      )}

      {/* Nivel 1: Categorías */}
      {!selectedCategoria && !selectedArticulo && !searchResults && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Categorías</h2>
              <p className="text-sm text-slate-500">Seleccioná una categoría para ver sus artículos</p>
            </div>
            <button onClick={handleCreateCategoria} className="btn-success btn-sm">
              ＋ Nueva Categoría
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {categorias.map((categoria) => (
              <div key={categoria.id}
                className="card card-body cursor-pointer hover:shadow-md hover:border-blue-200 transition-all group text-center"
                onClick={() => handleSelectCategoria(categoria)}>
                <div className="text-4xl mb-3">📁</div>
                <h3 className="text-sm font-semibold text-slate-800 mb-1">{categoria.nombre}</h3>
                <p className="text-xs text-slate-500">{articulos.filter(a => a.categoriaId === categoria.id).length} artículos</p>
                <div className="flex justify-center gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={(e) => { e.stopPropagation(); handleEditCategoria(categoria); }}
                    className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded transition-colors">✏️ Editar</button>
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteCategoria(categoria); }}
                    className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded transition-colors">🗑️ Eliminar</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Nivel 2: Artículos */}
      {selectedCategoria && !selectedArticulo && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-800">{selectedCategoria.nombre}</h2>
              <p className="text-sm text-slate-500">{articulos.length} artículos en esta categoría</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setSelectedCategoria(null)} className="btn-secondary btn-sm">← Volver</button>
              <button onClick={handleCreateArticulo} className="btn-primary btn-sm">＋ Nuevo Artículo</button>
            </div>
          </div>

          {articulos.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-3">📄</div>
              <h3 className="font-semibold text-slate-800 mb-1">Sin artículos</h3>
              <p className="text-sm text-slate-500 mb-4">No hay artículos en "{selectedCategoria.nombre}"</p>
              <button onClick={handleCreateArticulo} className="btn-primary btn-sm">＋ Crear artículo</button>
            </div>
          ) : (
            <div className="space-y-2">
              {articulos.map((articulo) => {
                const estadoBadge: Record<string, string> = {
                  'Vigente':  'badge-success',
                  'Borrador': 'badge-warning',
                  'Obsoleto': 'badge-danger',
                };
                const badgeCls = estadoBadge[articulo.estado || 'Borrador'] || 'badge-warning';
                return (
                  <div key={articulo.id}
                    className="card card-body cursor-pointer hover:shadow-md hover:border-blue-200 transition-all group"
                    onClick={() => handleSelectArticulo(articulo)}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          {articulo.codigo && (
                            <span className="font-mono text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                              {articulo.codigo}
                            </span>
                          )}
                          <span className={`badge ${badgeCls}`}>{articulo.estado || 'Borrador'}</span>
                          {articulo.version && <span className="text-xs text-slate-400">v{articulo.version}</span>}
                        </div>
                        <h3 className="text-sm font-semibold text-slate-800 truncate">{articulo.titulo}</h3>
                        <div className="flex flex-wrap gap-3 text-xs text-slate-500 mt-1">
                          {articulo.area && <span>🏢 {articulo.area}</span>}
                          {articulo.responsable && <span>👤 {articulo.responsable}</span>}
                          {articulo.fechaRevision && (
                            <span>🔄 {new Date(articulo.fechaRevision).toLocaleDateString('es-AR')}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button onClick={e => { e.stopPropagation(); handleEditArticulo(articulo); }}
                          className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded">✏️</button>
                        <button onClick={e => { e.stopPropagation(); handleDeleteArticulo(articulo); }}
                          className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded">🗑️</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Nivel 3: Visor de artículo */}
      {selectedArticulo && (
        <ArticuloViewer
          articulo={selectedArticulo}
          onEdit={handleEditArticulo}
          onDelete={handleDeleteArticulo}
          onBack={() => setSelectedArticulo(null)}
        />
      )}

      {/* Modales */}
      {showCategoriaForm && (
        <CategoriaForm
          categoria={editCategoria}
          categorias={categorias}
          onSubmit={handleSubmitCategoria}
          onCancel={() => { setShowCategoriaForm(false); setEditCategoria(null); }}
        />
      )}
      {showArticuloForm && (
        <ArticuloForm
          articulo={editArticulo}
          categorias={categorias}
          onSubmit={handleSubmitArticulo}
          onCancel={() => { setShowArticuloForm(false); setEditArticulo(null); }}
        />
      )}
    </div>
  );
};

export default Procedimientos; 