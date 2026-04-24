import React from "react";

type TareaLike = {
  id: number;
  titulo: string;
  estado?: string;
  prioridad?: string;
  fechaVencimiento?: string | null;
  responsable?: { nombre?: string | null } | null;
};

interface TareasAgendaViewProps {
  tareas: TareaLike[];
  onSelect: (tarea: TareaLike) => void;
}

const isOverdue = (t: TareaLike) => {
  if (!t.fechaVencimiento) return false;
  if (t.estado === "hecha" || t.estado === "resuelta" || t.estado === "cancelada") return false;
  return new Date(t.fechaVencimiento).getTime() < new Date().setHours(0, 0, 0, 0);
};

const TareasAgendaView: React.FC<TareasAgendaViewProps> = ({ tareas, onSelect }) => {
  const conFecha = tareas
    .filter((t) => !!t.fechaVencimiento)
    .sort((a, b) => new Date(a.fechaVencimiento!).getTime() - new Date(b.fechaVencimiento!).getTime());

  if (conFecha.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 text-sm text-gray-500">
        No hay tareas con fecha de vencimiento para mostrar en agenda.
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="grid grid-cols-12 px-4 py-3 text-xs font-semibold text-gray-500 border-b border-gray-200 bg-gray-50">
        <div className="col-span-2">Fecha</div>
        <div className="col-span-4">Tarea</div>
        <div className="col-span-2">Responsable</div>
        <div className="col-span-2">Estado</div>
        <div className="col-span-2">Prioridad</div>
      </div>
      {conFecha.map((t) => (
        <button
          key={t.id}
          onClick={() => onSelect(t)}
          className={`grid grid-cols-12 w-full px-4 py-3 text-sm border-b border-gray-100 text-left hover:bg-blue-50 ${
            isOverdue(t) ? "bg-red-50" : "bg-white"
          }`}
        >
          <div className="col-span-2 font-medium text-gray-800">
            {new Date(t.fechaVencimiento!).toLocaleDateString()}
          </div>
          <div className="col-span-4 text-gray-900">{t.titulo}</div>
          <div className="col-span-2 text-gray-600">{t.responsable?.nombre || "Sin asignar"}</div>
          <div className="col-span-2 text-gray-600">{t.estado || "-"}</div>
          <div className="col-span-2 text-gray-600">{t.prioridad || "-"}</div>
        </button>
      ))}
    </div>
  );
};

export default TareasAgendaView;
