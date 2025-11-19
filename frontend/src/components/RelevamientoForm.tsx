import React, { useState } from "react";

const initialState = {
  tipo: "",
  marca: "",
  modelo: "",
  serie: "",
  estado: "",
  responsable: "",
  ubicacion: "",
  fecha: "",
  observaciones: ""
};

const estados = ["Activo", "En reparación", "Baja", "Otro"];

const RelevamientoForm = () => {
  const [form, setForm] = useState(initialState);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validación básica
    if (!form.tipo || !form.marca || !form.modelo || !form.serie || !form.estado || !form.responsable || !form.ubicacion || !form.fecha) {
      setError("Por favor completa todos los campos obligatorios.");
      return;
    }
    setSuccess(true);
    setForm(initialState);
    setTimeout(() => setSuccess(false), 2000);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto space-y-6">
      <h2 className="text-xl font-bold mb-2">Nuevo relevamiento</h2>
      {/* Bloque 1: Identificación */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold mb-1">Tipo de equipo *</label>
          <input name="tipo" value={form.tipo} onChange={handleChange} className="w-full border rounded px-3 py-2" required />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Marca *</label>
          <input name="marca" value={form.marca} onChange={handleChange} className="w-full border rounded px-3 py-2" required />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Modelo *</label>
          <input name="modelo" value={form.modelo} onChange={handleChange} className="w-full border rounded px-3 py-2" required />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">N° de serie *</label>
          <input name="serie" value={form.serie} onChange={handleChange} className="w-full border rounded px-3 py-2" required />
        </div>
      </div>
      {/* Bloque 2: Estado y responsable */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-semibold mb-1">Estado *</label>
          <select name="estado" value={form.estado} onChange={handleChange} className="w-full border rounded px-3 py-2" required>
            <option value="">Selecciona...</option>
            {estados.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Responsable *</label>
          <input name="responsable" value={form.responsable} onChange={handleChange} className="w-full border rounded px-3 py-2" required />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Ubicación *</label>
          <input name="ubicacion" value={form.ubicacion} onChange={handleChange} className="w-full border rounded px-3 py-2" required />
        </div>
      </div>
      {/* Bloque 3: Fecha y observaciones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold mb-1">Fecha *</label>
          <input type="date" name="fecha" value={form.fecha} onChange={handleChange} className="w-full border rounded px-3 py-2" required />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Observaciones</label>
          <textarea name="observaciones" value={form.observaciones} onChange={handleChange} className="w-full border rounded px-3 py-2" rows={2} />
        </div>
      </div>
      {/* Mensajes */}
      {error && <div className="text-red-600 font-semibold text-sm">{error}</div>}
      {success && <div className="text-green-600 font-semibold text-sm">¡Relevamiento guardado (simulado)!</div>}
      {/* Botón */}
      <div className="flex justify-end">
        <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition">Guardar</button>
      </div>
    </form>
  );
};

export default RelevamientoForm; 