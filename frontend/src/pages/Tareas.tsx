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

  const inputStyle: React.CSSProperties = {
    fontSize: 12, padding: '6px 10px',
    border: '0.5px solid rgba(0,0,0,0.15)', borderRadius: 6,
    background: 'white', fontFamily: 'inherit',
  };

  return (
    <div style={{ padding: '0 0 24px', fontFamily: 'Inter, sans-serif' }}>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 16, flexWrap: 'wrap', gap: 10,
      }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>
            Mesa operativa IT
          </h1>
          <p style={{ fontSize: 12, color: '#888', margin: '2px 0 0' }}>
            Infraestructura · Caja de Abogados
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Selector de vista */}
          <div style={{
            display: 'flex', background: '#f3f4f6',
            border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 7, overflow: 'hidden',
          }}>
            {(['kanban', 'lista'] as Vista[]).map(v => (
              <button key={v} onClick={() => setVista(v)} style={{
                padding: '5px 12px', fontSize: 12, fontWeight: 500,
                background: vista === v ? 'white' : 'transparent',
                color: vista === v ? '#185FA5' : '#666',
                border: 'none', cursor: 'pointer',
                borderRight: v === 'kanban' ? '0.5px solid rgba(0,0,0,0.1)' : 'none',
                fontFamily: 'inherit',
              }}>
                {v === 'kanban' ? 'Kanban' : 'Lista'}
              </button>
            ))}
          </div>

          <button
            onClick={() => handleNuevaTarea()}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', fontSize: 13, fontWeight: 600,
              background: '#185FA5', color: 'white',
              border: 'none', borderRadius: 7, cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> Nueva tarea
          </button>
        </div>
      </div>

      {/* KPIs */}
      <TareasKpis kpis={kpis} loading={loading && !kpis} />

      {/* Filtros */}
      <div style={{
        display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center',
      }}>
        <input
          type="text"
          placeholder="Buscar tareas..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          style={{ ...inputStyle, width: 200 }}
        />
        <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} style={inputStyle}>
          <option value="">Todos los estados</option>
          {['pendiente','en_curso','bloqueada','en_espera','resuelta','cancelada'].map(e => (
            <option key={e} value={e}>{e.replace('_',' ')}</option>
          ))}
        </select>
        <select value={filtroPrioridad} onChange={e => setFiltroPrioridad(e.target.value)} style={inputStyle}>
          <option value="">Todas las prioridades</option>
          {['baja','media','alta','critica'].map(p => (
            <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
          ))}
        </select>
        <select value={filtroResponsable} onChange={e => setFiltroResponsable(e.target.value)} style={inputStyle}>
          <option value="">Todos los responsables</option>
          {usuarios.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
        </select>

        <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#555', cursor: 'pointer' }}>
          <input type="checkbox" checked={soloMias} onChange={e => setSoloMias(e.target.checked)} style={{ cursor: 'pointer' }} />
          Mis tareas
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#555', cursor: 'pointer' }}>
          <input type="checkbox" checked={soloVencidas} onChange={e => setSoloVencidas(e.target.checked)} style={{ cursor: 'pointer' }} />
          Vencidas
        </label>

        {hayFiltros && (
          <button
            onClick={() => {
              setBusqueda(''); setFiltroEstado(''); setFiltroPrioridad('');
              setFiltroResponsable(''); setSoloMias(false); setSoloVencidas(false);
            }}
            style={{
              padding: '5px 10px', fontSize: 11, color: '#888',
              background: 'none', border: '0.5px solid rgba(0,0,0,0.15)',
              borderRadius: 6, cursor: 'pointer',
            }}
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Contenido principal */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {loading && tareas.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: '#aaa', fontSize: 14 }}>
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
