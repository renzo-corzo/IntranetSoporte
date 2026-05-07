import React, { useEffect, useRef, useState } from 'react';

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
  actualizadoEn?: string;
  adjuntos?: string[];
  codigo?: string;
  version?: string;
  area?: string;
  responsable?: string;
  estado?: string;
  fechaRevision?: string;
}

interface ArticuloViewerProps {
  articulo: Articulo | null;
  onEdit: (articulo: any) => void;
  onDelete: (articulo: any) => void;
  onBack: () => void;
}

const ESTADO_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  'Vigente':  { bg: 'bg-green-900',  text: 'text-green-200',  dot: 'bg-green-400' },
  'Borrador': { bg: 'bg-yellow-900', text: 'text-yellow-200', dot: 'bg-yellow-400' },
  'Obsoleto': { bg: 'bg-red-900',    text: 'text-red-200',    dot: 'bg-red-400' },
};

function getBaseUrl() {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
  return apiUrl.replace('/api', '') || window.location.origin;
}

function processContent(content: string): string {
  if (!content) return '';
  const baseUrl = getBaseUrl();
  return content
    .replace(/<img([^>]*?)src="(?!http)([^"]*)"([^>]*?)>/gi, `<img$1src="${baseUrl}/$2"$3>`)
    .replace(/<img[^>]*src="blob:[^"]*"[^>]*>/gi,
      '<div style="padding:16px;background:#374151;border:2px dashed #6b7280;border-radius:8px;text-align:center;color:#9ca3af;margin:10px 0;">🖼️ Imagen no disponible</div>');
}

interface Section { id: string; title: string; level: number }

function extractSections(html: string): Section[] {
  const matches = [...html.matchAll(/<h([23])[^>]*>(.*?)<\/h[23]>/gi)];
  return matches.map((m, i) => ({
    id: `section-${i}`,
    title: m[2].replace(/<[^>]+>/g, ''),
    level: parseInt(m[1])
  }));
}

function injectSectionIds(html: string): string {
  let idx = 0;
  return html.replace(/<h([23])([^>]*)>(.*?)<\/h[23]>/gi, (_, level, attrs, content) =>
    `<h${level}${attrs} id="section-${idx++}">${content}</h${level}>`
  );
}

const ArticuloViewer: React.FC<ArticuloViewerProps> = ({ articulo, onEdit, onDelete, onBack }) => {
  const [activeSection, setActiveSection] = useState<string>('');
  const contentRef = useRef<HTMLDivElement>(null);

  const sections = articulo ? extractSections(articulo.contenido) : [];
  const processedHtml = articulo ? injectSectionIds(processContent(articulo.contenido)) : '';

  useEffect(() => {
    if (!contentRef.current) return;
    const observer = new IntersectionObserver(entries => {
      for (const e of entries) {
        if (e.isIntersecting) setActiveSection(e.target.id);
      }
    }, { rootMargin: '-20% 0px -70% 0px' });
    contentRef.current.querySelectorAll('h2[id], h3[id]').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [processedHtml]);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (!articulo) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-900">
        <div className="text-center text-gray-400">
          <div className="text-6xl mb-4">📄</div>
          <h3 className="text-lg font-medium mb-2">Seleccioná un artículo</h3>
          <p className="text-sm">Hacé clic en un artículo de la lista para ver su contenido</p>
        </div>
      </div>
    );
  }

  const estadoStyle = ESTADO_STYLES[articulo.estado || 'Borrador'] || ESTADO_STYLES['Borrador'];
  const fechaCreacion = articulo.createdAt || articulo.creadoEn;
  const fechaActualizacion = articulo.updatedAt || articulo.actualizadoEn;
  const autorNombre = articulo.autor?.nombre || articulo.creadoPor?.nombre;
  const baseUrl = getBaseUrl();

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header */}
      <div className="p-5 border-b border-gray-700 bg-gray-800">
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <button onClick={onBack} className="text-gray-400 hover:text-white flex items-center gap-2 text-sm mb-3">
              ← Volver
            </button>

            {/* Badges de metadata */}
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {articulo.codigo && (
                <span className="font-mono text-xs bg-gray-700 text-gray-200 px-2 py-0.5 rounded border border-gray-600">
                  {articulo.codigo}
                </span>
              )}
              {articulo.version && (
                <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded">v{articulo.version}</span>
              )}
              <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded ${estadoStyle.bg} ${estadoStyle.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${estadoStyle.dot}`} />
                {articulo.estado || 'Borrador'}
              </span>
              {articulo.categoria && (
                <span className="text-xs bg-blue-800 text-blue-200 px-2 py-0.5 rounded">
                  📁 {articulo.categoria.nombre}
                </span>
              )}
            </div>

            <h1 className="text-xl font-bold text-white leading-tight">{articulo.titulo}</h1>

            {/* Info row */}
            <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-400">
              {articulo.area && <span>🏢 {articulo.area}</span>}
              {articulo.responsable && <span>👤 {articulo.responsable}</span>}
              {autorNombre && <span>✍️ {autorNombre}</span>}
              {fechaCreacion && <span>📅 {new Date(fechaCreacion).toLocaleDateString('es-AR')}</span>}
              {articulo.fechaRevision && (
                <span>🔄 Revisión: {new Date(articulo.fechaRevision).toLocaleDateString('es-AR')}</span>
              )}
              {fechaActualizacion && fechaActualizacion !== fechaCreacion && (
                <span>✏️ Act: {new Date(fechaActualizacion).toLocaleDateString('es-AR')}</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 ml-4 shrink-0">
            <button onClick={() => onEdit(articulo)}
              className="p-2 text-blue-400 hover:bg-gray-700 rounded-lg transition" title="Editar">✏️</button>
            <button onClick={() => onDelete(articulo)}
              className="p-2 text-red-400 hover:bg-gray-700 rounded-lg transition" title="Eliminar">🗑️</button>
          </div>
        </div>
      </div>

      {/* Body: contenido + sidebar */}
      <div className="flex-1 flex overflow-hidden">

        {/* Contenido principal */}
        <div className="flex-1 overflow-auto p-6" ref={contentRef}>
          <div
            className="text-gray-200 leading-relaxed prose prose-invert prose-sm max-w-none
              [&_h2]:text-white [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-6 [&_h2]:mb-3 [&_h2]:border-b [&_h2]:border-gray-700 [&_h2]:pb-1
              [&_h3]:text-gray-100 [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2
              [&_code]:bg-slate-800 [&_code]:text-emerald-300 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:font-mono [&_code]:text-sm
              [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-1
              [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1
              [&_li]:text-gray-300"
            dangerouslySetInnerHTML={{ __html: processedHtml }}
          />

          {/* Adjuntos */}
          {articulo.adjuntos && articulo.adjuntos.length > 0 && (
            <div className="mt-8 pt-6 border-t border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">
                📎 Archivos adjuntos ({articulo.adjuntos.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {articulo.adjuntos.map((adj, i) => {
                  const isImage = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(adj);
                  const url = adj.startsWith('http') ? adj : `${baseUrl}/${adj}`;
                  return (
                    <div key={i} className="border border-gray-600 rounded-lg overflow-hidden bg-gray-800">
                      {isImage ? (
                        <div className="aspect-video bg-gray-700 flex items-center justify-center">
                          <img src={url} alt={`Adjunto ${i+1}`} className="max-w-full max-h-full object-contain"
                            onError={e => { e.currentTarget.style.display='none'; }} />
                        </div>
                      ) : (
                        <div className="aspect-video bg-gray-700 flex items-center justify-center">
                          <div className="text-center text-gray-400"><div className="text-3xl mb-2">📄</div></div>
                        </div>
                      )}
                      <div className="p-3 flex justify-between items-center">
                        <a href={url} target="_blank" rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 text-sm truncate">Ver archivo</a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar de navegación */}
        {sections.length > 1 && (
          <div className="w-52 shrink-0 border-l border-gray-700 bg-gray-850 overflow-y-auto p-4 hidden lg:block"
            style={{ backgroundColor: '#111827' }}>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">En este artículo</p>
            <nav className="space-y-1">
              {sections.map(s => (
                <button key={s.id} onClick={() => scrollToSection(s.id)}
                  className={`w-full text-left text-xs py-1 px-2 rounded transition-colors truncate
                    ${s.level === 3 ? 'pl-4' : ''}
                    ${activeSection === s.id
                      ? 'text-blue-400 bg-blue-900/30 font-medium'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'}`}>
                  {s.title}
                </button>
              ))}
            </nav>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArticuloViewer;
