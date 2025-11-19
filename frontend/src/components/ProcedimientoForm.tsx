import React, { useState } from "react";

interface ProcedimientoFormProps {
  onSubmit: (proc: any) => void;
  onCancel: () => void;
  initial?: any;
}

const ProcedimientoForm: React.FC<ProcedimientoFormProps> = ({ onSubmit, onCancel, initial }) => {
  const [form, setForm] = useState({
    titulo: initial?.titulo || "",
    descripcion: initial?.descripcion || "",
    adjuntos: initial?.adjuntos || [""]
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAdjuntoChange = (i: number, value: string) => {
    const adjuntos = [...form.adjuntos];
    adjuntos[i] = value;
    setForm({ ...form, adjuntos });
  };

  const handleAddAdjunto = () => {
    setForm({ ...form, adjuntos: [...form.adjuntos, ""] });
  };

  const handleRemoveAdjunto = (i: number) => {
    const adjuntos = form.adjuntos.filter((_: any, idx: number) => idx !== i);
    setForm({ ...form, adjuntos });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...form, adjuntos: form.adjuntos.filter((a: string) => a.trim() !== "") });
  };

  return (
    <form className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col gap-4 items-center w-full max-w-md animate-fade-in" onSubmit={handleSubmit} style={{ minWidth: 340 }}>
      <h2 className="text-2xl font-extrabold text-blue-700 mb-1 text-center">{initial ? "Editar procedimiento" : "Nuevo procedimiento"}</h2>
      <div className="w-full flex flex-col gap-2">
        <label className="font-medium text-blue-900">Título</label>
        <input name="titulo" value={form.titulo} onChange={handleChange} required className="w-full p-3 border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 transition bg-blue-50" />
        <label className="font-medium text-blue-900">Descripción</label>
        <textarea name="descripcion" value={form.descripcion} onChange={handleChange} className="w-full p-3 border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 transition bg-blue-50 min-h-[80px]" />
        <label className="font-medium text-blue-900">Adjuntos (URLs)</label>
        {form.adjuntos.map((a: string, i: number) => (
          <div key={i} className="flex gap-2 mb-2">
            <input type="url" value={a} onChange={e => handleAdjuntoChange(i, e.target.value)} className="flex-1 p-3 border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 transition bg-blue-50" placeholder="https://..." />
            <button type="button" onClick={() => handleRemoveAdjunto(i)} className="bg-red-100 text-red-700 px-2 rounded hover:bg-red-200">✕</button>
          </div>
        ))}
        <button type="button" onClick={handleAddAdjunto} className="bg-blue-100 text-blue-700 px-4 py-1 rounded hover:bg-blue-200 font-bold">+ Adjunto</button>
      </div>
      <div className="flex gap-4 mt-4 w-full justify-center">
        <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 transition shadow">{initial ? "Guardar" : "Crear"}</button>
        <button type="button" onClick={onCancel} className="bg-gray-200 px-6 py-2 rounded-xl font-bold hover:bg-gray-300 transition shadow">Cancelar</button>
      </div>
    </form>
  );
};

export default ProcedimientoForm; 