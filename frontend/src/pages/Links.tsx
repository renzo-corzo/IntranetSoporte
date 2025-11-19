import React, { useEffect, useState } from "react";
import { getLinks, createLink, updateLink, deleteLink } from "../apiLinks";
import { useAuth } from "../context/AuthContext";

const Links: React.FC = () => {
  const { token, user } = useAuth();
  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editLink, setEditLink] = useState<any>(null);
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const isAdmin = user?.rol === "admin";

  // Filtrar enlaces según búsqueda
  const filteredLinks = links.filter(link =>
    link.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    link.url.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const fetchLinks = async () => {
    if (!token) return;
    setLoading(true);
    const data = await getLinks(token);
    setLinks(data);
    setLoading(false);
  };
  useEffect(() => { fetchLinks(); }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!label.trim() || !url.trim()) return setError("Todos los campos son obligatorios");
    try {
      if (editLink) {
        await updateLink(editLink.id, { label, url }, token!);
      } else {
        await createLink({ label, url }, token!);
      }
      setShowForm(false);
      setEditLink(null);
      setLabel("");
      setUrl("");
      fetchLinks();
    } catch (err: any) {
      setError(err?.response?.data?.error || "Error al guardar link");
    }
  };
  const handleEdit = (link: any) => {
    setEditLink(link);
    setLabel(link.label);
    setUrl(link.url);
    setShowForm(true);
  };
  const handleDelete = async (id: number) => {
    if (!token) return;
    if (!window.confirm("¿Eliminar link?")) return;
    await deleteLink(id, token);
    fetchLinks();
  };
  return (
    <div className="p-6 min-h-screen bg-gray-50">
      {/* Header moderno */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">🔗 Enlaces Útiles</h1>
            <p className="text-gray-600">Accesos rápidos a sistemas institucionales</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Buscador */}
            <div className="relative flex-1 min-w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Buscar enlaces..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
            {isAdmin && (
              <button
                onClick={() => { setEditLink(null); setLabel(""); setUrl(""); setShowForm(true); }}
                className="btn-primary whitespace-nowrap"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Nuevo Enlace
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="card">
        {loading ? (
          <div className="card-body text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Cargando enlaces...</p>
          </div>
        ) : filteredLinks.length === 0 && searchTerm ? (
          <div className="card-body text-center py-12">
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No se encontraron enlaces</h3>
            <p className="text-gray-600 mb-4">Tu búsqueda "{searchTerm}" no coincide con ningún enlace</p>
            <button
              onClick={() => setSearchTerm("")}
              className="btn-secondary"
            >
              Limpiar búsqueda
            </button>
          </div>
        ) : links.length === 0 ? (
          <div className="card-body text-center py-12">
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay enlaces registrados</h3>
            <p className="text-gray-600 mb-4">Comienza agregando tu primer enlace útil</p>
            {isAdmin && (
              <button
                onClick={() => { setEditLink(null); setLabel(""); setUrl(""); setShowForm(true); }}
                className="btn-primary"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Crear primer enlace
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full table-fixed">
              <colgroup>
                <col style={{width: '35%'}} />
                <col style={{width: '45%'}} />
                {isAdmin && <col style={{width: '20%'}} />}
              </colgroup>
              <thead>
                <tr className="table-header">
                  <th className="table-cell">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      <span>Nombre</span>
                    </div>
                  </th>
                  <th className="table-cell">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      <span>URL</span>
                    </div>
                  </th>
                  {isAdmin && (
                    <th className="table-cell text-center">
                      <div className="flex items-center justify-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="hidden sm:inline">Acciones</span>
                      </div>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredLinks.map(link => (
                  <tr key={link.id} className="table-row group">
                    <td className="table-cell">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold mr-3 text-sm">
                          {link.label.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-gray-900 truncate">{link.label}</div>
                          <div className="text-xs text-gray-500">Enlace institucional</div>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 space-y-2 sm:space-y-0">
                        <a 
                          href={link.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="inline-flex items-center px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-800 rounded-md transition-colors border border-blue-200 hover:border-blue-300 text-sm"
                          title={`Abrir: ${link.url}`}
                        >
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          <span className="font-medium">Abrir</span>
                        </a>
                        <div className="text-xs text-gray-500 truncate" title={link.url}>
                          {link.url}
                        </div>
                      </div>
                    </td>
                    {isAdmin && (
                      <td className="table-cell text-center">
                        <div className="flex gap-1 justify-center">
                          <button 
                            onClick={() => handleEdit(link)} 
                            className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                            title="Editar"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button 
                            onClick={() => handleDelete(link.id)} 
                            className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                            title="Eliminar"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* Modal de formulario moderno */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content max-w-md">
            <form onSubmit={handleSubmit}>
              <div className="modal-header">
                <h2 className="text-xl font-bold text-gray-900">
                  {editLink ? "✏️ Editar Enlace" : "🔗 Nuevo Enlace"}
                </h2>
                <button 
                  type="button" 
                  onClick={() => { setShowForm(false); setEditLink(null); setLabel(""); setUrl(""); }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="modal-body space-y-4">
                <div>
                  <label className="form-label">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    Nombre del enlace *
                  </label>
                  <input 
                    type="text" 
                    placeholder="Ej: Sistema de Expedientes" 
                    value={label} 
                    onChange={e => setLabel(e.target.value)} 
                    className="form-input" 
                    required
                  />
                </div>

                <div>
                  <label className="form-label">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    URL completa *
                  </label>
                  <input 
                    type="url" 
                    placeholder="https://ejemplo.com" 
                    value={url} 
                    onChange={e => setUrl(e.target.value)} 
                    className="form-input" 
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">Incluye http:// o https://</p>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center">
                    <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-red-700 text-sm">{error}</span>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  onClick={() => { setShowForm(false); setEditLink(null); setLabel(""); setUrl(""); }}
                  className="btn-secondary"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {editLink ? "Guardar cambios" : "Crear enlace"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Links; 