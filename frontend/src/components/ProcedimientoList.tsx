import React from "react";

interface ProcedimientoListProps {
  procedimientos: any[];
  onSelect: (proc: any) => void;
  onEdit: (proc: any) => void;
  onDelete: (proc: any) => void;
}

const ProcedimientoList: React.FC<ProcedimientoListProps> = ({ procedimientos, onSelect, onEdit, onDelete }) => {
  if (procedimientos.length === 0) {
    return <div className="text-center text-gray-400 py-8">No hay procedimientos registrados.</div>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border border-gray-200 rounded-lg bg-white shadow-md">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Título</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Descripción</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Adjuntos</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Creado por</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Fecha</th>
            <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {procedimientos.map((p) => (
            <tr key={p.id} className="border-b hover:bg-blue-50 transition cursor-pointer">
              <td className="px-3 py-2 text-sm font-medium text-blue-800" onClick={() => onSelect(p)}>{p.titulo}</td>
              <td className="px-3 py-2 text-sm">{p.descripcion?.slice(0, 60) || "-"}</td>
              <td className="px-3 py-2 text-sm">{p.adjuntos && p.adjuntos.length > 0 ? p.adjuntos.map((a: string, i: number) => <a key={i} href={a} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline mr-2">Adjunto {i+1}</a>) : "-"}</td>
              <td className="px-3 py-2 text-sm">{p.creadoPor?.nombre || "-"}</td>
              <td className="px-3 py-2 text-sm">{p.creadoEn ? new Date(p.creadoEn).toLocaleDateString() : "-"}</td>
              <td className="px-3 py-2 text-center flex gap-2 justify-center">
                <button title="Editar" onClick={e => { e.stopPropagation(); onEdit(p); }} className="text-blue-600 hover:text-blue-800 p-1 rounded transition text-xl">✏️</button>
                <button title="Eliminar" onClick={e => { e.stopPropagation(); onDelete(p); }} className="text-red-600 hover:text-red-800 p-1 rounded transition text-xl">🗑️</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProcedimientoList; 