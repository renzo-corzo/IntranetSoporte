import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { createRelevamiento } from "../apiRelevamientos";

interface ItemForm {
  tipo: string;
  marca: string;
  modelo: string;
  serie: string;
  estado: string;
  observaciones: string;
}

interface RelevamientoFormProps {
  onSuccess?: () => void;
}

const estados = ["Activo", "En reparación", "Baja", "Otro"];

const emptyItem = (): ItemForm => ({
  tipo: "", marca: "", modelo: "", serie: "", estado: "", observaciones: ""
});

const RelevamientoForm: React.FC<RelevamientoFormProps> = ({ onSuccess }) => {
  const { token } = useAuth();
  const [fecha, setFecha] = useState("");
  const [responsable, setResponsable] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [items, setItems] = useState<ItemForm[]>([emptyItem()]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleItemChange = (index: number, field: keyof ItemForm, value: string) => {
    setItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
    setError("");
  };

  const addItem = () => setItems(prev => [...prev, emptyItem()]);

  const removeItem = (index: number) => {
    if (items.length === 1) return;
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fecha || !responsable || !ubicacion) {
      setError("Completa fecha, responsable y ubicación.");
      return;
    }
    if (items.some(it => !it.tipo || !it.marca || !it.modelo || !it.serie || !it.estado)) {
      setError("Completa todos los campos obligatorios de cada equipo.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await createRelevamiento({ fecha, responsable, ubicacion, observaciones, items }, token!);
      setSuccess(true);
      setFecha("");
      setResponsable("");
      setUbicacion("");
      setObservaciones("");
      setItems([emptyItem()]);
      setTimeout(() => {
        setSuccess(false);
        onSuccess?.();
      }, 1500);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Error al guardar el relevamiento.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl mx-auto">
      <h2 className="text-xl font-bold text-gray-800">Nuevo relevamiento</h2>

      {/* Datos generales */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-4 border">
        <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Datos generales</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-1">Fecha *</label>
            <input
              type="date"
              value={fecha}
              onChange={e => { setFecha(e.target.value); setError(""); }}
              className="w-full border rounded px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Responsable *</label>
            <input
              value={responsable}
              onChange={e => { setResponsable(e.target.value); setError(""); }}
              className="w-full border rounded px-3 py-2 text-sm"
              placeholder="Nombre del responsable"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Ubicación *</label>
            <input
              value={ubicacion}
              onChange={e => { setUbicacion(e.target.value); setError(""); }}
              className="w-full border rounded px-3 py-2 text-sm"
              placeholder="Ej: Piso 3 - Sala de servidores"
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Observaciones generales</label>
          <textarea
            value={observaciones}
            onChange={e => setObservaciones(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm"
            rows={2}
            placeholder="Observaciones sobre el relevamiento (opcional)"
          />
        </div>
      </div>

      {/* Lista de equipos */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
            Equipos relevados <span className="text-blue-600">({items.length})</span>
          </h3>
          <button
            type="button"
            onClick={addItem}
            className="text-sm bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-lg hover:bg-blue-100 transition font-medium"
          >
            + Agregar equipo
          </button>
        </div>

        {items.map((item, index) => (
          <div key={index} className="border rounded-lg p-4 bg-white shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <span className="font-semibold text-sm text-gray-600">Equipo {index + 1}</span>
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="text-red-400 hover:text-red-600 text-sm font-medium transition"
                >
                  Quitar
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-600">Tipo *</label>
                <input
                  value={item.tipo}
                  onChange={e => handleItemChange(index, "tipo", e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm"
                  placeholder="Ej: Notebook, Switch, UPS"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-600">Marca *</label>
                <input
                  value={item.marca}
                  onChange={e => handleItemChange(index, "marca", e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm"
                  placeholder="Ej: Dell, HP, Cisco"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-600">Modelo *</label>
                <input
                  value={item.modelo}
                  onChange={e => handleItemChange(index, "modelo", e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm"
                  placeholder="Ej: Latitude 5510"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-600">N° de serie *</label>
                <input
                  value={item.serie}
                  onChange={e => handleItemChange(index, "serie", e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm font-mono"
                  placeholder="Número de serie"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-600">Estado *</label>
                <select
                  value={item.estado}
                  onChange={e => handleItemChange(index, "estado", e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm"
                >
                  <option value="">Selecciona...</option>
                  {estados.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-600">Observaciones</label>
                <input
                  value={item.observaciones}
                  onChange={e => handleItemChange(index, "observaciones", e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm"
                  placeholder="Opcional"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {error && <div className="text-red-600 font-semibold text-sm bg-red-50 border border-red-200 rounded px-3 py-2">{error}</div>}
      {success && <div className="text-green-700 font-semibold text-sm bg-green-50 border border-green-200 rounded px-3 py-2">Relevamiento guardado correctamente.</div>}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Guardando..." : "Guardar relevamiento"}
        </button>
      </div>
    </form>
  );
};

export default RelevamientoForm;
