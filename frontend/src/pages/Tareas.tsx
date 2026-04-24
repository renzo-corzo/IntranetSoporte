import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getTareasFiltradas,
  createTarea,
  getTareaById,
  addComentario,
  updateTarea,
  deleteTarea,
  getUsuarios,
  getTareasKpis,
  getTareasTablero,
  getTareasAgenda,
  updateEstadoTarea
} from "../apiTareas";
import TareaList from "../components/TareaList";
import TareaForm from "../components/TareaForm";
import TareaDetalle from "../components/TareaDetalle";
import TareasKanbanView from "../components/TareasKanbanView";
import TareasAgendaView from "../components/TareasAgendaView";

const Tareas: React.FC = () => {
  const { token, user } = useAuth();
  const [tareas, setTareas] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [editTarea, setEditTarea] = useState<any | null>(null);
  const [showDelete, setShowDelete] = useState<any | null>(null);
  const [viewMode, setViewMode] = useState<"lista" | "kanban" | "agenda">("kanban");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [kpis, setKpis] = useState<any>(null);
  const [tableroData, setTableroData] = useState<Record<string, any[]>>({});
  const [agendaData, setAgendaData] = useState<any[]>([]);
  const [filtroEstado, setFiltroEstado] = useState<string>("");
  const [filtroFecha, setFiltroFecha] = useState<string>("");
  const [filtroPeriodo, setFiltroPeriodo] = useState<string>("");
  const [filtroPrioridad, setFiltroPrioridad] = useState<string>("");
  const [filtroResponsable, setFiltroResponsable] = useState<string>("");
  const [soloMias, setSoloMias] = useState(false);
  const [soloVencidas, setSoloVencidas] = useState(false);
  const [soloSinAsignar, setSoloSinAsignar] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  const fetchUsuarios = async () => {
    if (!token) return;
    try {
      const data = await getUsuarios(token);
      setUsuarios(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      setUsuarios([
        { id: user?.id, nombre: user?.nombre }
      ]);
    }
  };

  useEffect(() => {
    if (token && user) {
      fetchUsuarios();
    }
  }, [token, user]);

  const buildQueryParams = () => ({
    q: busqueda || undefined,
    estado: filtroEstado || undefined,
    prioridad: filtroPrioridad || undefined,
    periodo: filtroPeriodo || undefined,
    responsableId: filtroResponsable || undefined,
    vencidas: soloVencidas ? "true" : undefined,
    sinAsignar: soloSinAsignar ? "true" : undefined,
    soloMias: soloMias ? "true" : undefined,
    desde: filtroFecha || undefined,
    abiertas: undefined
  });

  const fetchTareas = async (keepDetail = true) => {
    if (!token) return;
    setLoading(true);
    try {
      const params = buildQueryParams();
      const [listData, kpiData, tablero, agenda] = await Promise.all([
        getTareasFiltradas(token, params),
        getTareasKpis(token, params),
        getTareasTablero(token, params),
        getTareasAgenda(token, params)
      ]);

      setTareas(Array.isArray(listData) ? listData : []);
      setKpis(kpiData || null);
      setTableroData(tablero || {});
      setAgendaData(Array.isArray(agenda) ? agenda : []);

      const flatTablero = Object.values(tablero || {}).flat() as any[];
      if (flatTablero.length > 0 && (!listData || listData.length === 0)) {
        setTareas(flatTablero);
      }

      if (selected && keepDetail) {
        const actualizada = (Array.isArray(listData) ? listData : []).find((t: any) => t.id === selected.id);
        if (actualizada) {
          const detalle = await getTareaById(actualizada.id, token);
          setSelected(detalle);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTareas();
  }, [token, filtroEstado, filtroFecha, filtroPeriodo, filtroPrioridad, filtroResponsable, soloMias, soloVencidas, soloSinAsignar, busqueda]);

  const handleCreate = async (form: any) => {
    if (!token || !user) return;
    await createTarea({
      ...form,
      responsableId: form.responsableId === "" ? null : Number(form.responsableId),
      intervalo: form.intervalo === "" ? null : Number(form.intervalo),
      creadaPorId: user.id
    }, token);
    setShowForm(false);
    setFeedback({ type: "success", message: "Tarea creada correctamente." });
    fetchTareas(false);
  };

  const handleSelect = async (tarea: any) => {
    setShowForm(false);
    setShowDelete(null);
    if (!token) return;
    const t = await getTareaById(tarea.id, token);
    setSelected(t);
  };

  const handleAddComentario = async (contenido: string) => {
    if (!token || !selected || !user) return;
    await addComentario(selected.id, { contenido }, token);
    const t = await getTareaById(selected.id, token);
    setSelected(t);
    fetchTareas();
  };

  const handleEdit = (tarea: any) => {
    setShowDelete(null);
    setSelected(null);
    setEditTarea(tarea);
    setShowForm(true);
  };

  const handleShowDelete = (tarea: any) => {
    setShowForm(false);
    setEditTarea(null);
    setSelected(null);
    setShowDelete(tarea);
  };

  const handleUpdate = async (form: any) => {
    if (!token || !editTarea) return;
    await updateTarea(editTarea.id, {
      ...form,
      responsableId: form.responsableId === "" ? null : Number(form.responsableId),
      intervalo: form.intervalo === "" ? null : Number(form.intervalo),
    }, token);
    setShowForm(false);
    setEditTarea(null);
    setFeedback({ type: "success", message: "Tarea actualizada correctamente." });
    fetchTareas(false);
  };

  const handleDelete = async () => {
    if (!token || !showDelete) return;
    await deleteTarea(showDelete.id, token);
    setShowDelete(null);
    setFeedback({ type: "success", message: "Tarea eliminada." });
    fetchTareas(false);
  };

  const handleToggleCheck = async (tarea: any, checked: boolean) => {
    if (!token) return;
    await updateEstadoTarea(tarea.id, { estado: checked ? "resuelta" : "pendiente" }, token);
    fetchTareas(false);
  };

  const handleUpdateEstado = async (estado: string, observacion?: string) => {
    if (!token || !selected) return;
    await updateEstadoTarea(selected.id, { estado, observacion }, token);
    setFeedback({ type: "success", message: `Tarea actualizada a estado "${estado}".` });
    const t = await getTareaById(selected.id, token);
    setSelected(t);
    fetchTareas(false);
  };

  const isOverdue = (t: any) =>
    !!t.fechaVencimiento &&
    !["hecha", "resuelta", "cancelada"].includes((t.estado || "").toLowerCase()) &&
    new Date(t.fechaVencimiento).getTime() < new Date().setHours(0, 0, 0, 0);

  const tareasFiltradas = tareas.filter(t => {
    let ok = true;
    const q = busqueda.trim().toLowerCase();
    if (q) {
      const titulo = (t.titulo || "").toLowerCase();
      const descripcion = (t.descripcion || "").toLowerCase();
      if (!titulo.includes(q) && !descripcion.includes(q)) ok = false;
    }
    if (filtroEstado && t.estado !== filtroEstado && !(filtroEstado === "resuelta" && t.estado === "hecha")) ok = false;
    if (filtroFecha && t.fechaVencimiento) {
      const fecha = new Date(t.fechaVencimiento).toISOString().slice(0, 10);
      if (fecha !== filtroFecha) ok = false;
    }
    if (filtroPeriodo && t.periodo !== filtroPeriodo) ok = false;
    if (filtroPrioridad && t.prioridad !== filtroPrioridad) ok = false;
    if (filtroResponsable && String(t.responsableId || "") !== filtroResponsable) ok = false;
    if (soloMias && t.responsableId !== user?.id) ok = false;
    if (soloVencidas && !isOverdue(t)) ok = false;
    if (soloSinAsignar && !!t.responsableId) ok = false;
    return ok;
  });

  const metricas = kpis || {
    abiertas: tareasFiltradas.filter((t) => !["hecha", "resuelta", "cancelada"].includes((t.estado || "").toLowerCase())).length,
    enCurso: tareasFiltradas.filter((t) => t.estado === "en_curso").length,
    bloqueadas: tareasFiltradas.filter((t) => t.estado === "bloqueada").length,
    criticasAbiertas: tareasFiltradas.filter((t) => !["hecha", "resuelta", "cancelada"].includes((t.estado || "").toLowerCase()) && (t.prioridad || "").toLowerCase() === "critica").length,
    vencidasAbiertas: tareasFiltradas.filter((t) => isOverdue(t)).length,
    resueltas7d: 0
  };

  return (
    <div className="p-6 relative min-h-screen bg-gray-50">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mesa Operativa IT</h1>
            <p className="text-sm text-gray-600 mt-1">
              Seguimiento de incidencias, mantenimientos y tareas internas de Sistemas
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            disabled={false}
            aria-disabled={false}
            className="relative z-20 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-blue-800/25 !bg-blue-600 px-6 py-2.5 font-semibold !text-white shadow-md shadow-blue-900/25 transition-all duration-200 hover:!bg-blue-700 hover:shadow-lg active:!bg-blue-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:!cursor-not-allowed disabled:!bg-slate-300 disabled:!text-slate-600 disabled:border-slate-300/80 disabled:shadow-none disabled:hover:!bg-slate-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nueva Tarea
          </button>
        </div>

        {feedback && (
          <div className={`mb-4 px-4 py-3 rounded-lg border ${
            feedback.type === "success"
              ? "bg-green-50 text-green-800 border-green-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}>
            <div className="flex items-center justify-between">
              <span>{feedback.message}</span>
              <button
                className="text-sm underline"
                onClick={() => setFeedback(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-4">
          <div className="bg-white border border-gray-200 rounded-xl p-3">
            <p className="text-xs text-gray-500">Abiertas</p>
            <p className="text-2xl font-semibold text-gray-900">{metricas.abiertas}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-3">
            <p className="text-xs text-gray-500">En curso</p>
            <p className="text-2xl font-semibold text-blue-700">{metricas.enCurso}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-3">
            <p className="text-xs text-gray-500">Bloqueadas</p>
            <p className="text-2xl font-semibold text-orange-700">{metricas.bloqueadas}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-3">
            <p className="text-xs text-gray-500">Críticas abiertas</p>
            <p className="text-2xl font-semibold text-red-700">{metricas.criticasAbiertas}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-3">
            <p className="text-xs text-gray-500">Vencidas abiertas</p>
            <p className="text-2xl font-semibold text-rose-700">{metricas.vencidasAbiertas}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-3">
            <p className="text-xs text-gray-500">Resueltas (7d)</p>
            <p className="text-2xl font-semibold text-green-700">{metricas.resueltas7d}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { key: "lista", label: "Vista Lista" },
            { key: "kanban", label: "Vista Tablero" },
            { key: "agenda", label: "Vista Agenda" }
          ].map((view) => (
            <button
              key={view.key}
              onClick={() => setViewMode(view.key as "lista" | "kanban" | "agenda")}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition ${
                viewMode === view.key
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            >
              {view.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-3 items-center bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por título o descripción..."
            className="border rounded px-3 py-2 min-w-[240px]"
          />
          <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} className="border rounded px-3 py-2">
            <option value="">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="en_progreso">En curso</option>
            <option value="bloqueada">Bloqueada</option>
            <option value="en_espera">En espera</option>
            <option value="hecha">Resuelta (legacy)</option>
            <option value="resuelta">Resuelta</option>
            <option value="cancelada">Cancelada</option>
          </select>
          <select value={filtroPrioridad} onChange={e => setFiltroPrioridad(e.target.value)} className="border rounded px-3 py-2">
            <option value="">Todas las prioridades</option>
            <option value="baja">Baja</option>
            <option value="media">Media</option>
            <option value="alta">Alta</option>
            <option value="critica">Crítica</option>
          </select>
          <select value={filtroResponsable} onChange={e => setFiltroResponsable(e.target.value)} className="border rounded px-3 py-2">
            <option value="">Todos los responsables</option>
            {usuarios.map((u) => (
              <option key={u.id} value={String(u.id)}>{u.nombre}</option>
            ))}
          </select>
          <input type="date" value={filtroFecha} onChange={e => setFiltroFecha(e.target.value)} className="border rounded px-3 py-2" />
          <select value={filtroPeriodo} onChange={e => setFiltroPeriodo(e.target.value)} className="border rounded px-3 py-2">
            <option value="">Todos los periodos</option>
            <option value="Diario">Diario</option>
            <option value="Semanal">Semanal</option>
            <option value="Mensual">Mensual</option>
            <option value="Anual">Anual</option>
          </select>
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={soloMias} onChange={(e) => setSoloMias(e.target.checked)} />
            Mis tareas
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={soloVencidas} onChange={(e) => setSoloVencidas(e.target.checked)} />
            Vencidas
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={soloSinAsignar} onChange={(e) => setSoloSinAsignar(e.target.checked)} />
            Sin asignar
          </label>
          {(filtroEstado || filtroFecha || filtroPeriodo || filtroPrioridad || filtroResponsable || soloMias || soloVencidas || soloSinAsignar || busqueda) && (
            <button
              onClick={() => {
                setFiltroEstado("");
                setFiltroFecha("");
                setFiltroPeriodo("");
                setFiltroPrioridad("");
                setFiltroResponsable("");
                setSoloMias(false);
                setSoloVencidas(false);
                setSoloSinAsignar(false);
                setBusqueda("");
              }}
              className="ml-2 text-sm text-blue-700 underline"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>
      {loading ? (
        <div className="text-center text-gray-500 py-8">Cargando tareas...</div>
      ) : (
        <>
          {viewMode === "lista" && (
            <TareaList
              tareas={tareasFiltradas}
              onSelect={handleSelect}
              onEdit={handleEdit}
              onDelete={handleShowDelete}
              onToggleCheck={handleToggleCheck}
            />
          )}
          {viewMode === "kanban" && (
            <TareasKanbanView
              tareas={Object.values(tableroData).flat() as any[]}
              grouped={tableroData}
              onSelect={handleSelect}
            />
          )}
          {viewMode === "agenda" && (
            <TareasAgendaView
              tareas={agendaData}
              onSelect={handleSelect}
            />
          )}
        </>
      )}
      {/* Botón flotante para nueva tarea */}
      {!showForm && (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          disabled={false}
          aria-disabled={false}
          className="fixed bottom-8 right-8 z-50 flex h-16 w-16 cursor-pointer items-center justify-center rounded-full border border-blue-800/30 !bg-blue-600 !text-white text-3xl shadow-lg shadow-blue-900/30 transition hover:!bg-blue-700 hover:shadow-xl active:!bg-blue-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:!cursor-not-allowed disabled:!bg-slate-300 disabled:!text-slate-600 disabled:border-slate-300"
          title="Nueva tarea"
        >
          +
        </button>
      )}
      {/* Modal de formulario */}
      {showForm && (
        <TareaForm
          onSubmit={editTarea ? handleUpdate : handleCreate}
          onCancel={() => { setShowForm(false); setEditTarea(null); }}
          initial={editTarea}
          usuarios={usuarios}
        />
      )}
      {/* Modal de detalle */}
      {selected && (
        <TareaDetalle
          tarea={selected}
          token={token || ""}
          onClose={() => setSelected(null)}
          onAddComentario={handleAddComentario}
          onUpdateEstado={handleUpdateEstado}
          onRefresh={async () => fetchTareas(true)}
          onFeedback={(message, type = "success") => setFeedback({ message, type })}
        />
      )}
      {showDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center max-w-sm">
            <h2 className="text-xl font-bold mb-4 text-center">¿Eliminar tarea?</h2>
            <p className="mb-6 text-center">¿Estás seguro que deseas eliminar la tarea <b>{showDelete.titulo}</b>?</p>
            <div className="flex gap-4">
              <button onClick={handleDelete} className="bg-red-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-red-700 transition shadow">Eliminar</button>
              <button onClick={() => setShowDelete(null)} className="bg-gray-200 px-6 py-2 rounded-xl font-bold hover:bg-gray-300 transition shadow">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tareas; 