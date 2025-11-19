import React, { useState } from "react";

interface UsuarioFormProps {
  onSubmit: (form: any) => void;
  onCancel: () => void;
  roles: any[];
  initial?: any;
}

const UsuarioForm: React.FC<UsuarioFormProps> = ({ onSubmit, onCancel, roles, initial }) => {
  const [form, setForm] = useState({
    username: initial?.username || "",
    nombre: initial?.nombre || "",
    email: initial?.email || "",
    password: "",
    rolId: initial?.rolId || (roles[0]?.id || ""),
    activo: initial?.activo ?? true
  });
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox" && e.target instanceof HTMLInputElement) {
      setForm({ ...form, [name]: e.target.checked });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username || !form.nombre || !form.rolId || (!initial && !form.password)) {
      setError("Completa los campos obligatorios");
      return;
    }
    setError("");
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="form-label">
            <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Usuario *
          </label>
          <input 
            name="username" 
            value={form.username} 
            onChange={handleChange} 
            className="form-input" 
            placeholder="Nombre de usuario"
            required 
          />
        </div>

        <div>
          <label className="form-label">
            <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Nombre Completo *
          </label>
          <input 
            name="nombre" 
            value={form.nombre} 
            onChange={handleChange} 
            className="form-input" 
            placeholder="Nombre y apellido"
            required 
          />
        </div>

        <div>
          <label className="form-label">
            <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Email
          </label>
          <input 
            name="email" 
            value={form.email} 
            onChange={handleChange} 
            className="form-input" 
            type="email"
            placeholder="correo@ejemplo.com"
          />
        </div>

        <div>
          <label className="form-label">
            <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Contraseña {initial ? "(opcional)" : "*"}
          </label>
          <input 
            name="password" 
            value={form.password} 
            onChange={handleChange} 
            className="form-input" 
            type="password" 
            placeholder={initial ? "Dejar vacío para no cambiar" : "Ingresa una contraseña"}
            autoComplete="new-password" 
            required={!initial} 
          />
        </div>

        <div>
          <label className="form-label">
            <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Rol *
          </label>
          <select 
            name="rolId" 
            value={form.rolId} 
            onChange={handleChange} 
            className="form-select" 
            required
          >
            {roles.map(r => (
              <option key={r.id} value={r.id}>{r.nombre}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center">
          <div className="flex items-center space-x-3">
            <input 
              type="checkbox" 
              name="activo" 
              checked={form.activo} 
              onChange={handleChange}
              className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
            />
            <label className="form-label mb-0">
              <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Usuario Activo
            </label>
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
          {initial ? "Actualizar" : "Crear Usuario"}
        </button>
      </div>
    </form>
  );
};

export default UsuarioForm; 