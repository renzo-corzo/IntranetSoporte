import React, { useState } from "react";

interface TareaListProps {
  tareas: any[];
  onSelect: (tarea: any) => void;
  onEdit: (tarea: any) => void;
  onDelete: (tarea: any) => void;
  onToggleCheck: (tarea: any, checked: boolean) => void;
}

const TareaList: React.FC<TareaListProps> = ({ tareas, onSelect, onEdit, onDelete, onToggleCheck }) => {
  // Paginación
  const [pagina, setPagina] = useState(1);
  const porPagina = 8;
  const totalPaginas = Math.ceil(tareas.length / porPagina);
  const tareasPagina = tareas.slice((pagina - 1) * porPagina, pagina * porPagina);

  // Función para calcular la próxima fecha
  const calcularProximaFecha = (periodo: string, diaDelMes?: string) => {
    if (!periodo || !diaDelMes) return null;
    
    const hoy = new Date();
    let proxima = new Date(hoy);
    
    switch (periodo) {
      case 'Diario':
        proxima.setDate(hoy.getDate() + 1);
        break;
      case 'Semanal':
        proxima.setDate(hoy.getDate() + 7);
        break;
      case 'Mensual':
        const dia = parseInt(diaDelMes);
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
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (tareas.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-3">¡Todo está al día! 🎉</h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          No hay tareas registradas aún. Comienza creando tu primera tarea para organizar tu trabajo diario.
        </p>
        <div className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">
          💡 Usa el botón "Nueva Tarea" para comenzar
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-3">
              {tareasPagina.map((t) => (
        <div
          key={t.id}
          className="bg-white rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-all duration-200 cursor-pointer group overflow-hidden"
          onClick={() => onSelect(t)}
        >
          <div className="p-4">
            <div className="flex items-center justify-between gap-4">
              {/* Izquierda - Checkbox y Título */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <input
                  type="checkbox"
                  checked={t.estado === "resuelta" || t.estado === "hecha"}
                  onChange={e => { e.stopPropagation(); onToggleCheck(t, e.target.checked); }}
                  className="w-4 h-4 text-green-600 bg-gray-100 border-2 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                  title="Marcar como completada"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                    {t.titulo}
                  </h3>
                  {t.descripcion && (
                    <p className="text-gray-600 text-sm mt-1 line-clamp-1">
                      {t.descripcion}
                    </p>
                  )}
                </div>
              </div>
              
              {/* Centro - Estados y Responsable */}
              <div className="flex items-center gap-3">
                {/* Estado */}
                <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                  t.estado === "pendiente" ? "bg-yellow-100 text-yellow-700" :
                  t.estado === "en_curso" || t.estado === "en_progreso" ? "bg-blue-100 text-blue-700" :
                  t.estado === "resuelta" || t.estado === "hecha" ? "bg-green-100 text-green-700" :
                  t.estado === "bloqueada" ? "bg-red-100 text-red-700" :
                  t.estado === "en_espera" ? "bg-indigo-100 text-indigo-700" :
                  t.estado === "cancelada" ? "bg-gray-200 text-gray-700" : "bg-gray-100 text-gray-700"
                }`}>
                  {t.estado === "pendiente" ? "⏳" :
                   t.estado === "en_curso" || t.estado === "en_progreso" ? "🔄" :
                   t.estado === "resuelta" || t.estado === "hecha" ? "✅" :
                   t.estado === "bloqueada" ? "🚫" :
                   t.estado === "en_espera" ? "⏸️" :
                   t.estado === "cancelada" ? "🗑️" : "📋"} {t.estado === "hecha" ? "resuelta" : t.estado}
                </span>

                {/* Prioridad */}
                <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                  t.prioridad === "alta" ? "bg-red-100 text-red-700" :
                  t.prioridad === "media" ? "bg-orange-100 text-orange-700" :
                  t.prioridad === "baja" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                }`}>
                  {t.prioridad === "alta" ? "🔴" :
                   t.prioridad === "media" ? "🟡" :
                   t.prioridad === "baja" ? "🟢" : "⚪"} {t.prioridad || "normal"}
                </span>

                {/* Responsable */}
                <div className="flex items-center gap-2">
                  {t.responsable?.nombre ? (
                    <>
                      <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {t.responsable.nombre.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-gray-700 hidden md:block">
                        {t.responsable.nombre}
                      </span>
                    </>
                  ) : (
                    <span className="text-sm text-gray-400">Sin asignar</span>
                  )}
                </div>
              </div>

              {/* Derecha - Información de fecha y periodicidad */}
              <div className="text-right">
                {/* Fecha de vencimiento */}
                {t.fechaVencimiento ? (
                  <div className="text-sm mb-1">
                    <div className="font-medium text-gray-900">
                      📅 {new Date(t.fechaVencimiento).toLocaleDateString()}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-400 mb-1">Sin fecha</div>
                )}
                
                {/* Información de tarea repetitiva */}
                {t.periodo && t.periodo !== '' && t.diaDelMes && (
                  <div className="space-y-1">
                    <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-200">
                      🔄 {t.periodo} - Día {t.diaDelMes}
                    </div>
                    <div className="text-xs text-green-700 bg-green-50 px-2 py-1 rounded border border-green-200">
                      Próxima: {calcularProximaFecha(t.periodo, t.diaDelMes)}
                    </div>
                  </div>
                )}
              </div>

              {/* Acciones */}
              <div className="flex gap-1">
                <button
                  title="Editar"
                  onClick={e => { e.stopPropagation(); onEdit(t); }}
                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all duration-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  title="Eliminar"
                  onClick={e => { e.stopPropagation(); onDelete(t); }}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all duration-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
      
      {/* Paginación moderna */}
      {totalPaginas > 1 && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mt-6">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              📋 Mostrando <span className="font-bold text-gray-900">{(pagina - 1) * porPagina + 1}</span> - <span className="font-bold text-gray-900">{Math.min(pagina * porPagina, tareas.length)}</span> de <span className="font-bold text-gray-900">{tareas.length}</span> tareas
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setPagina(p => Math.max(1, p - 1))} 
                disabled={pagina === 1} 
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Anterior
              </button>
              
              <div className="flex items-center gap-2">
                <span className="px-4 py-2 text-sm font-bold text-white bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg">
                  {pagina}
                </span>
                <span className="text-sm text-gray-500">de</span>
                <span className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg">
                  {totalPaginas}
                </span>
              </div>
              
              <button 
                onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))} 
                disabled={pagina === totalPaginas} 
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                Siguiente
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TareaList; 