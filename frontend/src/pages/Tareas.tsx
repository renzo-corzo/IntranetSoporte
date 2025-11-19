import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getTareas, createTarea, getTareaById, addComentario, updateTarea, deleteTarea } from "../apiTareas";
import TareaList from "../components/TareaList";
import TareaForm from "../components/TareaForm";
import TareaDetalle from "../components/TareaDetalle";

const Tareas: React.FC = () => {
  const { token, user } = useAuth();
  const [tareas, setTareas] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]); // Simulado, deberías traer de la API real
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [editTarea, setEditTarea] = useState<any | null>(null);
  const [showDelete, setShowDelete] = useState<any | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<string>("");
  const [filtroFecha, setFiltroFecha] = useState<string>("");
  const [filtroPeriodo, setFiltroPeriodo] = useState<string>("");

  // Cargar usuarios desde la API
  const fetchUsuarios = async () => {
    if (!token) return;
    try {
      const response = await fetch('http://localhost:4000/api/usuarios', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUsuarios(data);
      } else {
        console.error('Error al cargar usuarios:', response.statusText);
        // Fallback con el usuario actual
        setUsuarios([
          { id: user?.id, nombre: user?.nombre }
        ]);
      }
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      // Fallback con el usuario actual
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

  const fetchTareas = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await getTareas(token);
      setTareas(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTareas();
  }, [token]);

  const handleCreate = async (form: any) => {
    if (!token || !user) return;
    await createTarea({
      ...form,
      responsableId: form.responsableId === "" ? null : Number(form.responsableId),
      intervalo: form.intervalo === "" ? null : Number(form.intervalo),
      creadaPorId: user.id
    }, token);
    setShowForm(false);
    fetchTareas();
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
    await addComentario(selected.id, { contenido, autorId: user.id }, token);
    // Refrescar tarea seleccionada
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
    fetchTareas();
  };

  const handleDelete = async () => {
    if (!token || !showDelete) return;
    await deleteTarea(showDelete.id, token);
    setShowDelete(null);
    fetchTareas();
  };

  const handleToggleCheck = async (tarea: any, checked: boolean) => {
    if (!token) return;
    await updateTarea(tarea.id, { ...tarea, estado: checked ? "hecha" : "pendiente" }, token);
    fetchTareas();
  };

  const handleUpdateEstado = async (estado: string, observacion?: string) => {
    if (!token || !selected) return;
    await updateTarea(selected.id, { ...selected, estado, notas: observacion }, token);
    setSelected(null);
    fetchTareas();
  };

  const tareasFiltradas = tareas.filter(t => {
    let ok = true;
    if (filtroEstado && t.estado !== filtroEstado) ok = false;
    if (filtroFecha && t.fechaVencimiento) {
      const fecha = new Date(t.fechaVencimiento).toISOString().slice(0, 10);
      if (fecha !== filtroFecha) ok = false;
    }
    if (filtroPeriodo && t.periodo !== filtroPeriodo) ok = false;
    return ok;
  });

  return (
    <div className="p-6 relative min-h-screen bg-gray-50">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Tareas diarias</h1>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold shadow-lg transition-all duration-200 flex items-center gap-2"
            style={{
              backgroundColor: '#2563eb',
              color: 'white',
              padding: '8px 24px',
              borderRadius: '8px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nueva Tarea
          </button>
        </div>
        <div className="flex flex-wrap gap-4 items-center bg-blue-50 border border-blue-200 rounded-xl p-4 shadow-sm">
          <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} className="border rounded px-2 py-1">
            <option value="">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="en_progreso">En progreso</option>
            <option value="hecha">Completada</option>
            <option value="bloqueada">Con error</option>
          </select>
          <input type="date" value={filtroFecha} onChange={e => setFiltroFecha(e.target.value)} className="border rounded px-2 py-1" />
          <select value={filtroPeriodo} onChange={e => setFiltroPeriodo(e.target.value)} className="border rounded px-2 py-1">
            <option value="">Todos los periodos</option>
            <option value="Diario">Diario</option>
            <option value="Semanal">Semanal</option>
            <option value="Mensual">Mensual</option>
            <option value="Anual">Anual</option>
          </select>
          {(filtroEstado || filtroFecha || filtroPeriodo) && (
            <button onClick={() => { setFiltroEstado(""); setFiltroFecha(""); setFiltroPeriodo(""); }} className="ml-2 text-sm text-blue-700 underline">Limpiar filtros</button>
          )}
        </div>
      </div>
      {loading ? (
        <div className="text-center text-gray-500 py-8">Cargando tareas...</div>
      ) : (
        <TareaList
          tareas={tareasFiltradas}
          onSelect={handleSelect}
          onEdit={handleEdit}
          onDelete={handleShowDelete}
          onToggleCheck={handleToggleCheck}
        />
      )}
      {/* Botón flotante para nueva tarea */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="fixed bottom-8 right-8 bg-blue-600 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg text-3xl hover:bg-blue-700 transition z-50"
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
          onClose={() => setSelected(null)}
          onAddComentario={handleAddComentario}
          onUpdateEstado={handleUpdateEstado}
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