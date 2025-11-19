import React, { useState } from "react";

interface TareaDetalleProps {
  tarea: any;
  onClose: () => void;
  onAddComentario: (contenido: string) => void;
  onUpdateEstado?: (estado: string, observacion?: string) => void;
}

const TareaDetalle: React.FC<TareaDetalleProps> = ({ tarea, onClose, onAddComentario, onUpdateEstado }) => {
  const [comentario, setComentario] = useState("");
  const [observacion, setObservacion] = useState(tarea.estado === "pendiente" ? "" : (tarea.notas || ""));
  const [editObs, setEditObs] = useState(false);
  const [editFecha, setEditFecha] = useState(false);
  const [fechaVencimiento, setFechaVencimiento] = useState(
    tarea.fechaVencimiento ? new Date(tarea.fechaVencimiento).toISOString().slice(0, 10) : ""
  );
  // const [proximaFecha, setProximaFecha] = useState<string | null>(null);

  // Función para calcular la próxima fecha en el frontend (preview)
  const calcularProximaFechaPreview = () => {
    if (!tarea.periodo || !tarea.diaDelMes) return null;
    
    const hoy = new Date();
    let proxima = new Date(hoy);
    
    switch (tarea.periodo) {
      case 'Diario':
        proxima.setDate(hoy.getDate() + 1);
        break;
      case 'Semanal':
        proxima.setDate(hoy.getDate() + 7);
        break;
      case 'Mensual':
        const dia = parseInt(tarea.diaDelMes);
        proxima.setMonth(hoy.getMonth() + 1);
        proxima.setDate(dia);
        if (proxima <= hoy) {
          proxima.setMonth(proxima.getMonth() + 1);
        }
        break;
      case 'Anual':
        proxima.setFullYear(hoy.getFullYear() + 1);
        break;
      default:
        return null;
    }
    
    return proxima.toLocaleDateString('es-ES', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (comentario.trim()) {
      onAddComentario(comentario);
      setComentario("");
    }
  };

  const handleEstado = async (estado: string) => {
    if (estado === 'hecha') {
      // Usar el endpoint específico para completar tareas que calcula fechas automáticamente
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:4000/api"}/tareas/${tarea.id}/completar`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            observacion: observacion
          })
        });

        if (response.ok) {
          const tareaActualizada = await response.json();
          alert(`Tarea completada correctamente. ${tareaActualizada.periodo ? 'Se ha programado automáticamente para la próxima fecha.' : ''}`);
          onClose();
          window.location.reload(); // Recargar para mostrar cambios
        } else {
          alert('Error al completar la tarea');
        }
      } catch (error) {
        console.error('Error:', error);
        alert('Error al completar la tarea');
      }
    } else {
      // Para otros estados, usar la función original
      if (onUpdateEstado) {
        onUpdateEstado(estado, observacion);
      }
    }
  };

  const handleSaveObservacion = () => {
    if (onUpdateEstado) {
      onUpdateEstado(tarea.estado, observacion);
    }
    setEditObs(false);
  };

  const handleSaveFecha = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:4000/api"}/tareas/${tarea.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...tarea,
          fechaVencimiento: fechaVencimiento || null
        })
      });

      if (response.ok) {
        alert('Fecha de vencimiento actualizada correctamente');
        setEditFecha(false);
        // Actualizar la tarea en el componente padre
        window.location.reload(); // Temporal - idealmente se debería actualizar el estado
      } else {
        alert('Error al actualizar la fecha');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al actualizar la fecha');
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[1000] bg-black bg-opacity-60">
      <div className="bg-blue-50 rounded-2xl shadow-2xl border-4 border-blue-400 p-8 w-full max-w-2xl animate-float-modal relative">
        <button className="absolute top-4 right-4 text-gray-400 hover:text-red-600 text-2xl font-bold" onClick={onClose}>✕</button>
        <h2 className="text-2xl font-extrabold text-blue-800 mb-2 text-center">{tarea.titulo}</h2>
        <div className="mb-2 text-gray-600 whitespace-pre-line">{tarea.descripcion}</div>
        <div className="mb-2 flex flex-wrap gap-4 justify-between">
          <span><b>Responsable:</b> {tarea.responsable?.nombre || "-"}</span>
          <span><b>Estado:</b> <span className={`inline-block px-2 py-1 rounded-full text-xs font-bold shadow-sm ${tarea.estado === "pendiente" ? "bg-yellow-200 text-yellow-900" : tarea.estado === "en_progreso" ? "bg-blue-200 text-blue-900" : tarea.estado === "hecha" ? "bg-green-200 text-green-900" : tarea.estado === "bloqueada" ? "bg-red-200 text-red-900" : "bg-gray-100 text-gray-500"}`}>{tarea.estado}</span></span>
          <span><b>Prioridad:</b> <span className={`inline-block px-2 py-1 rounded-full text-xs font-bold shadow-sm ${tarea.prioridad === "alta" ? "bg-red-200 text-red-900" : tarea.prioridad === "media" ? "bg-yellow-200 text-yellow-900" : tarea.prioridad === "baja" ? "bg-green-200 text-green-900" : "bg-gray-100 text-gray-500"}`}>{tarea.prioridad}</span></span>
        </div>
        <div className="mb-2 flex flex-wrap gap-4 justify-between">
          <span><b>Tipo:</b> {tarea.tipo}</span>
          <span><b>Periodo:</b> {tarea.periodo || "-"}</span>
          <div className="flex items-center gap-2">
            <span><b>Vencimiento:</b></span>
            {editFecha ? (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={fechaVencimiento}
                  onChange={e => setFechaVencimiento(e.target.value)}
                  className="border rounded px-2 py-1 text-sm"
                />
                <button onClick={handleSaveFecha} className="text-green-600 hover:text-green-800 text-sm font-bold">
                  ✓
                </button>
                <button onClick={() => setEditFecha(false)} className="text-red-600 hover:text-red-800 text-sm font-bold">
                  ✗
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span>{tarea.fechaVencimiento ? new Date(tarea.fechaVencimiento).toLocaleDateString() : "Sin fecha"}</span>
                <button onClick={() => setEditFecha(true)} className="text-blue-600 hover:text-blue-800 text-sm font-bold">
                  📅
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="mb-4">
          <b>Observaciones:</b>
          {editObs ? (
            <textarea
              className="w-full border rounded p-2 mt-1"
              value={observacion}
              onChange={e => setObservacion(e.target.value)}
              rows={3}
              placeholder="Agrega una observación sobre la tarea..."
            />
          ) : (
            <div className="bg-white rounded p-2 mt-1 min-h-[40px] whitespace-pre-line">{observacion || <span className="text-gray-400">Sin observaciones</span>}</div>
          )}
          <div className="flex gap-2 mt-2">
            <button onClick={() => setEditObs(!editObs)} className="text-blue-600 hover:text-blue-800 font-bold text-sm underline">
              {editObs ? "Cancelar edición" : observacion ? "Editar observación" : "Agregar observación"}
            </button>
            {editObs && (
              <button onClick={handleSaveObservacion} className="text-green-600 hover:text-green-800 font-bold text-sm underline">Guardar</button>
            )}
          </div>
        </div>
        
        {/* Información sobre próxima fecha para tareas repetitivas */}
        {tarea.periodo && tarea.periodo !== '' && tarea.estado !== 'hecha' && (
          <div className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-blue-400 text-xl">🔄</span>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  <strong>Tarea repetitiva:</strong> {tarea.periodo} - Día {tarea.diaDelMes}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Al completar, se programará automáticamente para: <strong>{calcularProximaFechaPreview()}</strong>
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-4 mb-6 justify-center">
          <button onClick={() => handleEstado("hecha")}
            className="bg-green-500 hover:bg-green-700 text-white px-6 py-2 rounded-xl font-bold shadow transition flex items-center gap-2">
            <span>✓</span> Completar
            {tarea.periodo && tarea.periodo !== '' && (
              <span className="text-xs opacity-75">(y programar siguiente)</span>
            )}
          </button>
          <button onClick={() => handleEstado("bloqueada")}
            className="bg-red-500 hover:bg-red-700 text-white px-6 py-2 rounded-xl font-bold shadow transition flex items-center gap-2">
            <span>✗</span> Marcar error
          </button>
        </div>
        <h3 className="font-semibold mb-2">Comentarios</h3>
        <ul className="mb-4 max-h-40 overflow-y-auto">
          {tarea.comentarios && tarea.comentarios.length > 0 ? tarea.comentarios.map((c: any) => (
            <li key={c.id} className="mb-2 border-b pb-1">
              <span className="font-medium text-blue-700">{c.autor?.nombre || "-"}</span>: {c.contenido}
              <span className="text-xs text-gray-400 ml-2">{new Date(c.creadoEn).toLocaleString()}</span>
            </li>
          )) : <li className="text-gray-400">Sin comentarios</li>}
        </ul>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={comentario}
            onChange={e => setComentario(e.target.value)}
            placeholder="Agregar comentario..."
            className="flex-1 border rounded p-2"
          />
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">Comentar</button>
        </form>
      </div>
    </div>
  );
};

export default TareaDetalle; 