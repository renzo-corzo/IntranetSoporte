import React, { useState } from "react";

interface TareaFormProps {
  onSubmit: (tarea: any) => void;
  onCancel: () => void;
  initial?: any;
  usuarios: any[];
}

const TareaForm: React.FC<TareaFormProps> = ({ onSubmit, onCancel, initial, usuarios }) => {
  const [form, setForm] = useState({
    titulo: initial?.titulo || "",
    descripcion: initial?.descripcion || "",
    responsableId: initial?.responsableId || "",
    estado: initial?.estado || "pendiente",
    prioridad: initial?.prioridad || "media",
    tipo: initial?.tipo || "rutinaria",
    esRepetitiva: initial?.periodo ? true : false,
    periodo: initial?.periodo || "",
    intervalo: initial?.intervalo || "",
    diaDelMes: initial?.diaDelMes || "1",
    fechaVencimiento: initial?.fechaVencimiento ? initial.fechaVencimiento.slice(0, 10) : "",
    repeticion: initial?.repeticion || "No se repite"
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox" && e.target instanceof HTMLInputElement) {
      setForm({ ...form, [name]: e.target.checked });
      if (name === "esRepetitiva" && !e.target.checked) {
        setForm(f => ({ ...f, periodo: "", intervalo: "" }));
      }
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { ...form };
    if (!form.esRepetitiva) {
      data.periodo = "";
      data.intervalo = "";
      data.repeticion = "No se repite";
    } else {
      data.repeticion = form.periodo === "Personalizado" ? "Personalizado" : form.periodo ? `Cada ${form.periodo.toLowerCase()}` : "No se repite";
    }
    onSubmit(data);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-6xl">
        <form onSubmit={handleSubmit}>
          <div className="modal-header">
            <h2 className="text-xl font-bold text-gray-900">
              {initial ? "✏️ Editar Tarea" : "➕ Nueva Tarea"}
            </h2>
            <button 
              type="button" 
              onClick={onCancel} 
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="modal-body">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Información básica */}
              <div className="space-y-3">
                <h3 className="text-base font-semibold text-gray-900 mb-2 flex items-center">
                  <span className="mr-2">📋</span>
                  Información Básica
                </h3>
                
                <div>
                  <label className="form-label">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Título *
                  </label>
                  <input 
                    name="titulo" 
                    value={form.titulo} 
                    onChange={handleChange} 
                    required 
                    className="form-input" 
                    placeholder="Ingrese el título de la tarea"
                  />
                </div>

                <div>
                  <label className="form-label">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                    </svg>
                    Descripción
                  </label>
                  <textarea 
                    name="descripcion" 
                    value={form.descripcion} 
                    onChange={handleChange} 
                    className="form-input min-h-[60px]" 
                    rows={2}
                    placeholder="Descripción de la tarea"
                  />
                </div>

                <div>
                  <label className="form-label">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    Tipo
                  </label>
                  <select name="tipo" value={form.tipo} onChange={handleChange} className="form-select">
                    <option value="rutinaria">🔄 Rutinaria</option>
                    <option value="puntual">📍 Puntual</option>
                    <option value="mantenimiento">🔧 Mantenimiento</option>
                  </select>
                </div>


              </div>

              {/* Configuración adicional */}
              <div className="space-y-3">
                <h3 className="text-base font-semibold text-gray-900 mb-2 flex items-center">
                  <span className="mr-2">⚙️</span>
                  Configuración
                </h3>

                {form.esRepetitiva ? (
                  <>
                    <div>
                      <label className="form-label">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Periodicidad
                      </label>
                      <select name="periodo" value={form.periodo} onChange={handleChange} className="form-select">
                        <option value="">Seleccionar período</option>
                        <option value="Diario">📅 Diaria</option>
                        <option value="Semanal">📆 Semanal</option>
                        <option value="Mensual">🗓️ Mensual</option>
                        <option value="Anual">📊 Anual</option>
                        <option value="Personalizado">⚙️ Personalizado</option>
                      </select>
                    </div>
                    
                    {/* Campo para día del mes cuando es mensual */}
                    {form.periodo === "Mensual" && (
                      <div>
                        <label className="form-label">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Día del mes
                        </label>
                        <select name="diaDelMes" value={form.diaDelMes} onChange={handleChange} className="form-select">
                          {/* Días del 1 al 28 (para evitar problemas con febrero) */}
                          {Array.from({ length: 28 }, (_, i) => i + 1).map(dia => (
                            <option key={dia} value={dia}>Día {dia}</option>
                          ))}
                          <option value="ultimo">Último día del mes</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                          💡 Selecciona qué día del mes se debe realizar la tarea
                        </p>
                      </div>
                    )}
                    
                    {form.periodo === "Personalizado" && (
                      <div>
                        <label className="form-label">Intervalo personalizado</label>
                        <div className="flex gap-2">
                          <input 
                            type="number" 
                            name="intervalo" 
                            min={1} 
                            value={form.intervalo || ""} 
                            onChange={handleChange} 
                            className="form-input w-24" 
                            placeholder="Cada"
                          />
                          <span className="flex items-center text-sm text-gray-600">días/semanas/meses</span>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div>
                    <label className="form-label">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Fecha de vencimiento
                    </label>
                    <input 
                      type="date" 
                      name="fechaVencimiento" 
                      value={form.fechaVencimiento} 
                      onChange={handleChange} 
                      className="form-input"
                    />
                  </div>
                )}

                <div>
                  <label className="form-label">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Responsable
                  </label>
                  <select name="responsableId" value={form.responsableId} onChange={handleChange} className="form-select">
                    <option value="">👤 Sin asignar</option>
                    {usuarios.map((u) => (
                      <option key={u.id} value={u.id}>👨‍💼 {u.nombre}</option>
                    ))}
                  </select>
                </div>

                {/* Estado y Prioridad en la misma fila */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Estado
                    </label>
                    <select name="estado" value={form.estado} onChange={handleChange} className="form-select">
                      <option value="pendiente">⏳ Pendiente</option>
                      <option value="en_progreso">🔄 En progreso</option>
                      <option value="hecha">✅ Completada</option>
                      <option value="bloqueada">🚫 Bloqueada</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-label">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Prioridad
                    </label>
                    <select name="prioridad" value={form.prioridad} onChange={handleChange} className="form-select">
                      <option value="baja">🟢 Baja</option>
                      <option value="media">🟡 Media</option>
                      <option value="alta">🔴 Alta</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Tercera columna - Repetición */}
              <div className="space-y-3">
                <h3 className="text-base font-semibold text-gray-900 mb-2 flex items-center">
                  <span className="mr-2">🔄</span>
                  Repetición
                </h3>

                <div>
                  <label className="form-label">
                    <input 
                      type="checkbox" 
                      name="esRepetitiva" 
                      checked={form.esRepetitiva} 
                      onChange={handleChange}
                      className="mr-2"
                    />
                    ¿Es repetitiva?
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    💡 Marca si la tarea se debe repetir periódicamente
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onCancel} className="btn-secondary">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {initial ? "Guardar cambios" : "Crear tarea"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TareaForm; 