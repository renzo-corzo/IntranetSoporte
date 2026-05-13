import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';
import type { Tarea, KpisTareas, Usuario } from '../components/tareas/types';
import TareasKpis from '../components/tareas/TareasKpis';
import TareasKanban from '../components/tareas/TareasKanban';
import TareasLista from '../components/tareas/TareasLista';
import TareaDetalle from '../components/tareas/TareaDetalle';
import TareaFormModal from '../components/tareas/TareaFormModal';

type Vista = 'kanban' | 'lista';

const Tareas: React.FC = () => {
  const { token, user } = useAuth();
  const apiUrl = API_BASE_URL;

  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [kpis, setKpis] = useState<KpisTareas | null>(null);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [vista, setVista] = useState<Vista>('kanban');
  const [selected, setSelected] = useState<Tarea | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editTarea, setEditTarea] = useState<Tarea | null>(null);
  const [estadoFormInicial, setEstadoFormInicial] = useState<string>('pendiente');

  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroPrioridad, setFiltroPrioridad] = useState('');
  const [filtroResponsable, setFiltroResponsable] = useState('');
  const [soloMias, setSoloMias] = useState(false);
  const [soloVencidas, setSoloVencidas] = useState(false);

  const authHeaders = { Authorization: `Bearer ${token}` };

  const cargarUsuarios = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${apiUrl}/usuarios`, { headers: authHeaders });
      if (res.ok) setUsuarios(await res.json());
    } catch (e) { console.error(e); }
  }, [token]);

  const cargarDatos = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (busqueda) params.append('q', busqueda);
      if (filtroEstado) params.append('estado', filtroEstado);
      if (filtroPrioridad) params.append('prioridad', filtroPrioridad);
      if (filtroResponsable) params.append('responsableId', filtroResponsable);
      if (soloMias) params.append('soloMias', 'true');
      if (soloVencidas) params.append('vencidas', 'true');

      const qs = params.toString() ? `?${params.toString()}` : '';

      const [tareasRes, kpisRes] = await Promise.all([
        fetch(`${apiUrl}/tareas${qs}`, { headers: authHeaders }),
        fetch(`${apiUrl}/tareas/kpis`, { headers: authHeaders }),
      ]);

      if (tareasRes.ok) setTareas(await tareasRes.json());
      if (kpisRes.ok) setKpis(await kpisRes.json());

      // Refrescar detalle si hay una tarea seleccionada
      if (selected) {
        const detRes = await fetch(`${apiUrl}/tareas/${selected.id}`, { headers: authHeaders });
        if (detRes.ok) setSelected(await detRes.json());
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [token, busqueda, filtroEstado, filtroPrioridad, filtroResponsable, soloMias, soloVencidas]);

  useEffect(() => { cargarUsuarios(); }, [cargarUsuarios]);
  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  const handleSelect = async (tarea: Tarea) => {
    if (selected?.id === tarea.id) { setSelected(null); return; }
    // Cargar detalle completo con comentarios
    try {
      const res = await fetch(`${apiUrl}/tareas/${tarea.id}`, { headers: authHeaders });
      if (res.ok) setSelected(await res.json());
      else setSelected(tarea);
    } catch { setSelected(tarea); }
  };

  const handleNuevaTarea = (estado = 'pendiente') => {
    setEstadoFormInicial(estado);
    setEditTarea(null);
    setShowForm(true);
  };

  const handleEdit = (tarea: Tarea) => {
    setEditTarea(tarea);
    setShowForm(true);
  };

  const hayFiltros = busqueda || filtroEstado || filtroPrioridad || filtroResponsable || soloMias || soloVencidas;

  const filterCls = "px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-700";

  return (
    <div className="pb-6 space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Mesa operativa IT</h1>
          <p className="text-xs text-slate-500 mt-0.5">Infraestructura · Caja de Abogados</p>
        </div>

        <div className="flex gap-2 items-center flex-wrap">
          {/* Selector de vista */}
          <div className="flex bg-slate-100 border border-slate-200 rounded-lg overflow-hidden">
            {(['kanban', 'lista'] as Vista[]).map(v => (
              <button key={v} onClick={() => setVista(v)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  vista === v ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                } ${v === 'kanban' ? 'border-r border-slate-200' : ''}`}
              >
                {v === 'kanban' ? 'Kanban' : 'Lista'}
              </button>
            ))}
          </div>

          <button onClick={() => handleNuevaTarea()} className="btn-primary btn-sm">
            + Nueva tarea
          </button>
        </div>
      </div>

      {/* KPIs */}
      <TareasKpis kpis={kpis} loading={loading && !kpis} />

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap items-center">
        <input
          type="text"
          placeholder="Buscar tareas..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          className={`${filterCls} w-44`}
        />
        <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} className={filterCls}>
          <option value="">Todos los estados</option>
          {['pendiente','en_curso','bloqueada','en_espera','resuelta','cancelada'].map(e => (
            <option key={e} value={e}>{e.replace('_',' ')}</option>
          ))}
        </select>
        <select value={filtroPrioridad} onChange={e => setFiltroPrioridad(e.target.value)} className={filterCls}>
          <option value="">Todas las prioridades</option>
          {['baja','media','alta','critica'].map(p => (
            <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
          ))}
        </select>
        <select value={filtroResponsable} onChange={e => setFiltroResponsable(e.target.value)} className={filterCls}>
          <option value="">Todos los responsables</option>
          {usuarios.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
        </select>

        <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
          <input type="checkbox" checked={soloMias} onChange={e => setSoloMias(e.target.checked)} className="cursor-pointer" />
          Mis tareas
        </label>
        <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
          <input type="checkbox" checked={soloVencidas} onChange={e => setSoloVencidas(e.target.checked)} className="cursor-pointer" />
          Vencidas
        </label>

        {hayFiltros && (
          <button
            onClick={() => { setBusqueda(''); setFiltroEstado(''); setFiltroPrioridad(''); setFiltroResponsable(''); setSoloMias(false); setSoloVencidas(false); }}
            className="px-2.5 py-1.5 text-xs text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Contenido principal */}
      <div className="flex gap-4 items-start">
        <div className="flex-1 min-w-0">
          {loading && tareas.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              Cargando tareas...
            </div>
          ) : vista === 'kanban' ? (
            <TareasKanban
              tareas={tareas}
              selectedId={selected?.id}
              onSelect={handleSelect}
              onNuevaTarea={handleNuevaTarea}
            />
          ) : (
            <TareasLista
              tareas={tareas}
              selectedId={selected?.id}
              onSelect={handleSelect}
            />
          )}
        </div>

        {selected && (
          <TareaDetalle
            tarea={selected}
            token={token || ''}
            currentUser={{ id: user?.id || 0, nombre: user?.nombre || '' }}
            usuarios={usuarios}
            onClose={() => setSelected(null)}
            onUpdate={cargarDatos}
            onEdit={handleEdit}
            apiUrl={apiUrl}
          />
        )}
      </div>

      {/* Modal nueva/editar tarea */}
      {showForm && (
        <TareaFormModal
          tarea={editTarea}
          token={token || ''}
          usuarios={usuarios}
          estadoInicial={estadoFormInicial}
          onClose={() => { setShowForm(false); setEditTarea(null); }}
          onSaved={cargarDatos}
          apiUrl={apiUrl}
        />
      )}
    </div>
  );
};

export default Tareas;
