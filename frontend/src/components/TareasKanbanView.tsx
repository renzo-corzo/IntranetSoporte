import React from "react";

type TareaLike = {
  id: number;
  titulo: string;
  prioridad?: string;
  fechaVencimiento?: string | null;
  responsable?: { nombre?: string | null } | null;
  estado?: string;
};

interface TareasKanbanViewProps {
  tareas: TareaLike[];
  grouped?: Record<string, TareaLike[]>;
  onSelect: (tarea: TareaLike) => void;
}

const COLUMNS = [
  { key: "pendiente", label: "Pendiente" },
  { key: "en_progreso", label: "En curso" },
  { key: "bloqueada", label: "Bloqueada" },
  { key: "en_espera", label: "En espera" },
  { key: "resuelta", label: "Resuelta" },
  { key: "cancelada", label: "Cancelada" }
];

const prioridadClass = (prioridad?: string) => {
  switch ((prioridad || "").toLowerCase()) {
    case "critica":
      return "bg-red-100 text-red-800";
    case "alta":
      return "bg-orange-100 text-orange-800";
    case "media":
      return "bg-yellow-100 text-yellow-800";
    case "baja":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

const TareasKanbanView: React.FC<TareasKanbanViewProps> = ({ tareas, grouped, onSelect }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-4">
      {COLUMNS.map((col) => {
        const tareasCol = grouped?.[col.key] || tareas.filter((t) => (t.estado || "pendiente") === col.key);
        return (
          <section key={col.key} className="bg-white border border-gray-200 rounded-xl p-3">
            <header className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-800">{col.label}</h3>
              <span className="text-xs bg-gray-100 text-gray-700 rounded-full px-2 py-0.5">
                {tareasCol.length}
              </span>
            </header>
            <div className="space-y-2 min-h-[120px]">
              {tareasCol.length === 0 && (
                <p className="text-xs text-gray-400">Sin tareas</p>
              )}
              {tareasCol.map((t) => (
                <button
                  key={t.id}
                  onClick={() => onSelect(t)}
                  className="w-full text-left bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg p-3 transition"
                >
                  <p className="text-sm font-medium text-gray-900 line-clamp-2">{t.titulo}</p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className={`text-[11px] px-2 py-0.5 rounded-full ${prioridadClass(t.prioridad)}`}>
                      {(t.prioridad || "media").toUpperCase()}
                    </span>
                    <span className="text-[11px] text-gray-500">
                      {t.responsable?.nombre || "Sin asignar"}
                    </span>
                  </div>
                  {t.fechaVencimiento && (
                    <p className="mt-1 text-[11px] text-gray-500">
                      Vence: {new Date(t.fechaVencimiento).toLocaleDateString()}
                    </p>
                  )}
                </button>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
};

export default TareasKanbanView;
