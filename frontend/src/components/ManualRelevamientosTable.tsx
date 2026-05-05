import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getRelevamientos, deleteRelevamiento } from "../apiRelevamientos";

interface Item {
  id: number;
  tipo: string;
  marca: string;
  modelo: string;
  serie: string;
  estado: string;
  observaciones?: string;
}

interface Relevamiento {
  id: number;
  fecha: string;
  responsable: string;
  ubicacion: string;
  observaciones?: string;
  creadoEn: string;
  items: Item[];
}

const estadoClases: Record<string, string> = {
  "Activo": "bg-green-100 text-green-700",
  "En reparación": "bg-yellow-100 text-yellow-700",
  "Baja": "bg-red-100 text-red-700",
  "Otro": "bg-gray-100 text-gray-600",
};

const ManualRelevamientosTable: React.FC = () => {
  const { token } = useAuth();
  const [relevamientos, setRelevamientos] = useState<Relevamiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    getRelevamientos(token)
      .then(data => setRelevamientos(data))
      .catch(() => setError("Error al cargar los relevamientos."))
      .finally(() => setLoading(false));
  }, [token]);

  const handleDelete = async (id: number) => {
    if (!window.confirm("¿Eliminar este relevamiento y todos sus equipos?")) return;
    setDeleting(id);
    try {
      await deleteRelevamiento(id, token!);
      setRelevamientos(prev => prev.filter(r => r.id !== id));
      if (expanded === id) setExpanded(null);
    } catch {
      setError("Error al eliminar el relevamiento.");
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-500">
        <span className="text-sm">Cargando relevamientos...</span>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded px-3 py-2">{error}</div>;
  }

  if (relevamientos.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <div className="text-4xl mb-3">📋</div>
        <p className="font-medium text-gray-600">No hay relevamientos registrados</p>
        <p className="text-sm mt-1">Usá el botón "Nuevo relevamiento" para agregar uno.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {relevamientos.map(r => (
        <div key={r.id} className="border rounded-lg overflow-hidden">
          {/* Fila de cabecera del relevamiento */}
          <div
            className="flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 cursor-pointer select-none transition"
            onClick={() => setExpanded(expanded === r.id ? null : r.id)}
          >
            <div className="flex items-center gap-4 flex-wrap">
              <span className="font-semibold text-gray-800 text-sm">
                {new Date(r.fecha).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" })}
              </span>
              <span className="text-gray-700 text-sm">{r.responsable}</span>
              <span className="text-gray-500 text-sm">{r.ubicacion}</span>
              <span className="text-xs bg-blue-100 text-blue-700 font-medium px-2 py-0.5 rounded-full">
                {r.items.length} equipo{r.items.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex items-center gap-3 ml-4 shrink-0">
              <button
                onClick={e => { e.stopPropagation(); handleDelete(r.id); }}
                disabled={deleting === r.id}
                className="text-red-400 hover:text-red-600 text-xs font-medium transition disabled:opacity-50"
              >
                {deleting === r.id ? "Eliminando..." : "Eliminar"}
              </button>
              <span className="text-gray-400 text-xs">{expanded === r.id ? "▲" : "▼"}</span>
            </div>
          </div>

          {/* Detalle expandido */}
          {expanded === r.id && (
            <div className="px-4 py-4 border-t bg-white">
              {r.observaciones && (
                <p className="text-sm text-gray-600 mb-4 italic">"{r.observaciones}"</p>
              )}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-500 uppercase tracking-wide border-b">
                      <th className="pb-2 pr-4 font-semibold">Tipo</th>
                      <th className="pb-2 pr-4 font-semibold">Marca</th>
                      <th className="pb-2 pr-4 font-semibold">Modelo</th>
                      <th className="pb-2 pr-4 font-semibold">N° Serie</th>
                      <th className="pb-2 pr-4 font-semibold">Estado</th>
                      <th className="pb-2 font-semibold">Observaciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {r.items.map(item => (
                      <tr key={item.id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="py-2 pr-4">{item.tipo}</td>
                        <td className="py-2 pr-4">{item.marca}</td>
                        <td className="py-2 pr-4">{item.modelo}</td>
                        <td className="py-2 pr-4 font-mono text-xs text-gray-600">{item.serie}</td>
                        <td className="py-2 pr-4">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${estadoClases[item.estado] ?? estadoClases["Otro"]}`}>
                            {item.estado}
                          </span>
                        </td>
                        <td className="py-2 text-gray-500 text-xs">{item.observaciones || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ManualRelevamientosTable;
