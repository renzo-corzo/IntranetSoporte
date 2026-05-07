import React, { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../config/api';

interface ArticuloFormProps {
  articulo?: {
    id?: number;
    titulo: string;
    contenido: string;
    categoriaId: number;
    adjuntos?: string[];
    codigo?: string;
    version?: string;
    area?: string;
    responsable?: string;
    estado?: string;
    fechaRevision?: string;
  } | null;
  categorias: Array<{ id: number; nombre: string }>;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const ESTADOS = ['Borrador', 'Vigente', 'Obsoleto'];

const PLANTILLA_CONTENIDO = `<h2>1. Objetivo</h2>
<p>Describir el objetivo del procedimiento.</p>

<h2>2. Alcance</h2>
<p>Definir el alcance y a quién aplica este procedimiento.</p>

<h2>3. Responsables</h2>
<ul>
<li><strong>Responsable principal:</strong> [nombre/rol]</li>
<li><strong>Revisado por:</strong> [nombre/rol]</li>
</ul>

<h2>4. Procedimiento</h2>
<ol>
<li><strong>Paso 1:</strong> Descripción del primer paso.<br><code>C:\\Ruta\\al\\recurso\\o\\comando</code></li>
<li><strong>Paso 2:</strong> Descripción del segundo paso.</li>
<li><strong>Paso 3:</strong> Descripción del tercer paso.</li>
</ol>

<div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:12px 16px;border-radius:4px;margin:12px 0;">
⚠️ <strong>Advertencia:</strong> Texto de advertencia importante para el operador.
</div>

<div style="background:#eff6ff;border-left:4px solid #3b82f6;padding:12px 16px;border-radius:4px;margin:12px 0;">
ℹ️ <strong>Nota:</strong> Información adicional o aclaración relevante.
</div>

<h2>5. Checklist de verificación</h2>
<ul>
<li>☐ Paso 1 completado y verificado</li>
<li>☐ Paso 2 completado y verificado</li>
<li>☐ Verificación final realizada</li>
<li>☐ Documentación actualizada</li>
</ul>

<h2>6. Referencias</h2>
<ul>
<li>[Referencia 1]</li>
<li>[Manual o documento relacionado]</li>
</ul>`;

const ArticuloForm: React.FC<ArticuloFormProps> = ({ articulo, categorias, onSubmit, onCancel }) => {
  const [titulo, setTitulo] = useState(articulo?.titulo || '');
  const [categoriaId, setCategoriaId] = useState(articulo?.categoriaId || '');
  const [contenido, setContenido] = useState(articulo?.contenido || '');
  const [adjuntos, setAdjuntos] = useState<string[]>(articulo?.adjuntos || []);
  const [codigo, setCodigo] = useState(articulo?.codigo || '');
  const [version, setVersion] = useState(articulo?.version || '1.0');
  const [area, setArea] = useState(articulo?.area || '');
  const [responsable, setResponsable] = useState(articulo?.responsable || '');
  const [estado, setEstado] = useState(articulo?.estado || 'Borrador');
  const [fechaRevision, setFechaRevision] = useState(
    articulo?.fechaRevision ? articulo.fechaRevision.split('T')[0] : ''
  );
  const [uploading, setUploading] = useState(false);
  const [generandoCodigo, setGenerandoCodigo] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current) editorRef.current.innerHTML = contenido;
  }, []);

  const handleEditorChange = () => {
    if (editorRef.current) setContenido(editorRef.current.innerHTML);
  };

  const aplicarPlantilla = () => {
    if (contenido.trim() && !window.confirm('¿Reemplazar el contenido actual con la plantilla estándar?')) return;
    if (editorRef.current) editorRef.current.innerHTML = PLANTILLA_CONTENIDO;
    setContenido(PLANTILLA_CONTENIDO);
  };

  const generarCodigo = async () => {
    if (!area.trim()) { alert('Ingresá el área primero para generar el código.'); return; }
    setGenerandoCodigo(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/kb/articulos/next-codigo?area=${encodeURIComponent(area)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setCodigo(data.codigo);
    } catch { alert('Error al generar código'); }
    finally { setGenerandoCodigo(false); }
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/upload/file`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      if (!response.ok) throw new Error('Error al subir archivo');
      const data = await response.json();
      return data.filePath;
    } catch { alert('Error al subir archivo'); return null; }
    finally { setUploading(false); }
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    e.preventDefault();
    for (const item of Array.from(e.clipboardData.items)) {
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        if (!file) continue;
        const filePath = await uploadFile(file);
        if (!filePath) continue;
        const baseUrl = API_BASE_URL.replace('/api', '');
        const img = document.createElement('img');
        img.src = `${baseUrl}/${filePath}`;
        img.style.cssText = 'max-width:100%;height:auto;margin:10px 0;border-radius:8px;';
        const sel = window.getSelection();
        if (sel?.rangeCount) {
          const range = sel.getRangeAt(0);
          range.deleteContents();
          range.insertNode(img);
          range.collapse(false);
          if (editorRef.current) setContenido(editorRef.current.innerHTML);
        }
        setAdjuntos(prev => [...prev, filePath]);
      } else if (item.type === 'text/plain') {
        item.getAsString(text => document.execCommand('insertText', false, text));
      }
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    for (const file of Array.from(e.dataTransfer.files)) {
      if (!file.type.startsWith('image/')) continue;
      const filePath = await uploadFile(file);
      if (!filePath) continue;
      const baseUrl = API_BASE_URL.replace('/api', '');
      const img = document.createElement('img');
      img.src = `${baseUrl}/${filePath}`;
      img.style.cssText = 'max-width:100%;height:auto;margin:10px 0;border-radius:8px;';
      const sel = window.getSelection();
      if (sel?.rangeCount) {
        const range = sel.getRangeAt(0);
        range.deleteContents();
        range.insertNode(img);
        range.collapse(false);
        if (editorRef.current) setContenido(editorRef.current.innerHTML);
      }
      setAdjuntos(prev => [...prev, filePath]);
    }
  };

  const formatText = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !categoriaId) {
      alert('Por favor completá título y categoría');
      return;
    }
    onSubmit({
      id: articulo?.id,
      titulo: titulo.trim(),
      contenido: contenido.trim(),
      categoriaId: parseInt(categoriaId.toString()),
      adjuntos,
      codigo: codigo.trim() || null,
      version: version.trim() || '1.0',
      area: area.trim() || null,
      responsable: responsable.trim() || null,
      estado,
      fechaRevision: fechaRevision || null
    });
  };

  const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm';
  const labelCls = 'block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1';

  return (
    <div style={{ position:'fixed',inset:0,backgroundColor:'rgba(0,0,0,0.7)',display:'flex',justifyContent:'center',alignItems:'center',zIndex:1000 }}>
      <div style={{ backgroundColor:'white',borderRadius:'10px',padding:'24px',width:'92%',maxWidth:'860px',maxHeight:'92vh',overflow:'auto',boxShadow:'0 25px 50px -12px rgba(0,0,0,0.4)' }}>
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-semibold text-gray-800">
            {articulo ? 'Editar Procedimiento' : 'Nuevo Procedimiento'}
          </h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Metadata header */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Metadatos del procedimiento</span>
              <button type="button" onClick={aplicarPlantilla}
                className="text-xs bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700 transition font-medium">
                📋 Usar plantilla estándar
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className={labelCls}>Código</label>
                <div className="flex gap-1">
                  <input value={codigo} onChange={e => setCodigo(e.target.value)}
                    className={inputCls} placeholder="PRO-INF-001" />
                  <button type="button" onClick={generarCodigo} disabled={generandoCodigo}
                    title="Generar código automático"
                    className="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-xs font-bold disabled:opacity-50">
                    {generandoCodigo ? '…' : '⚡'}
                  </button>
                </div>
              </div>
              <div>
                <label className={labelCls}>Versión</label>
                <input value={version} onChange={e => setVersion(e.target.value)}
                  className={inputCls} placeholder="1.0" />
              </div>
              <div>
                <label className={labelCls}>Estado</label>
                <select value={estado} onChange={e => setEstado(e.target.value)} className={inputCls}>
                  {ESTADOS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Fecha de revisión</label>
                <input type="date" value={fechaRevision} onChange={e => setFechaRevision(e.target.value)}
                  className={inputCls} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Área</label>
                <input value={area} onChange={e => setArea(e.target.value)}
                  className={inputCls} placeholder="Infraestructura, Redes, RRHH..." />
              </div>
              <div>
                <label className={labelCls}>Responsable</label>
                <input value={responsable} onChange={e => setResponsable(e.target.value)}
                  className={inputCls} placeholder="Nombre del responsable" />
              </div>
            </div>
          </div>

          {/* Título y categoría */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Título *</label>
              <input type="text" value={titulo} onChange={e => setTitulo(e.target.value)}
                className={inputCls} placeholder="Título del procedimiento" required />
            </div>
            <div>
              <label className={labelCls}>Categoría *</label>
              <select value={categoriaId} onChange={e => setCategoriaId(e.target.value)}
                className={inputCls} required>
                <option value="">Seleccionar categoría</option>
                {categorias.map(cat => <option key={cat.id} value={cat.id}>{cat.nombre}</option>)}
              </select>
            </div>
          </div>

          {/* Barra de herramientas */}
          <div>
            <label className={labelCls}>Contenido *</label>
            <div className="border border-gray-300 rounded-t-md p-2 bg-gray-50 flex flex-wrap gap-1">
              {[['bold','B'],['italic','I'],['underline','U']].map(([cmd, lbl]) => (
                <button key={cmd} type="button" onClick={() => formatText(cmd)}
                  className="px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 text-sm font-medium">{lbl}</button>
              ))}
              <div className="border-l border-gray-300 mx-1" />
              <button type="button" onClick={() => formatText('insertUnorderedList')}
                className="px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 text-sm">≡ Lista</button>
              <button type="button" onClick={() => formatText('insertOrderedList')}
                className="px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 text-sm">1. Numerada</button>
              <div className="border-l border-gray-300 mx-1" />
              <button type="button" onClick={() => {
                const sel = window.getSelection();
                if (sel?.toString()) {
                  document.execCommand('insertHTML', false, `<code style="background:#1e293b;color:#e2e8f0;padding:2px 6px;border-radius:4px;font-family:monospace;font-size:13px;">${sel.toString()}</code>`);
                  editorRef.current?.focus();
                }
              }} className="px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 text-sm font-mono">{'<>'} Código</button>
            </div>
            <div ref={editorRef} contentEditable onInput={handleEditorChange}
              onPaste={handlePaste} onDrop={handleDrop} onDragOver={e => e.preventDefault()}
              className="w-full min-h-[320px] px-4 py-3 border border-gray-300 border-t-0 rounded-b-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ fontFamily:'Arial,sans-serif',fontSize:'14px',lineHeight:'1.7' }}
            />
            <p className="text-xs text-gray-400 mt-1">Podés pegar imágenes con Ctrl+V o arrastrarlas.</p>
          </div>

          {/* Adjuntos actuales */}
          {adjuntos.length > 0 && (
            <div>
              <label className={labelCls}>📎 Archivos adjuntos ({adjuntos.length})</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {adjuntos.map((adj, i) => (
                  <div key={i} className="flex items-center gap-1 bg-gray-100 rounded px-2 py-1 text-xs">
                    <span className="truncate max-w-[180px]">{adj.split('/').pop()}</span>
                    <button type="button" onClick={() => setAdjuntos(prev => prev.filter((_,j)=>j!==i))}
                      className="text-red-400 hover:text-red-600 ml-1">×</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 sticky bottom-0 bg-white pb-1">
            <button type="button" onClick={onCancel}
              className="px-5 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-200 text-sm font-medium">
              Cancelar
            </button>
            <button type="submit" disabled={uploading}
              className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium disabled:opacity-50">
              {uploading ? 'Subiendo...' : articulo ? 'Actualizar' : 'Crear procedimiento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ArticuloForm;
