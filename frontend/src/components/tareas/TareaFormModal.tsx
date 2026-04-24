import React, { useState, useEffect } from 'react';
import type { Tarea, Usuario } from './types';
import { PRIORIDADES, ESTADOS } from './types';

interface Props {
  tarea?: Tarea | null;
  token: string;
  usuarios: Usuario[];
  estadoInicial?: string;
  onClose: () => void;
  onSaved: () => void;
  apiUrl: string;
}

const Field: React.FC<{ label: string; required?: boolean; children: React.ReactNode }> = ({ label, required, children }) => (
  <div style={{ marginBottom: 14 }}>
    <label style={{
      display: 'block', fontSize: 12, fontWeight: 600, color: '#555',
      marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.04em',
    }}>
      {label}{required && <span style={{ color: '#A32D2D', marginLeft: 2 }}>*</span>}
    </label>
    {children}
  </div>
);

const inputStyle: React.CSSProperties = {
  width: '100%', fontSize: 13, padding: '7px 10px',
  border: '0.5px solid rgba(0,0,0,0.2)', borderRadius: 6,
  background: 'white', fontFamily: 'inherit',
  boxSizing: 'border-box',
};

const TareaFormModal: React.FC<Props> = ({
  tarea, token, usuarios, estadoInicial, onClose, onSaved, apiUrl
}) => {
  const esNueva = !tarea;

  const [form, setForm] = useState({
    titulo: '',
    descripcion: '',
    prioridad: 'media',
    estado: estadoInicial || 'pendiente',
    categoria: '',
    origen: 'interno',
    impacto: 'individual',
    solicitante: '',
    activoRelacionado: '',
    observaciones: '',
    fechaVencimiento: '',
    responsableId: '',
  });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (tarea) {
      setForm({
        titulo: tarea.titulo || '',
        descripcion: tarea.descripcion || '',
        prioridad: tarea.prioridad || 'media',
        estado: tarea.estado || 'pendiente',
        categoria: tarea.categoria || '',
        origen: tarea.origen || 'interno',
        impacto: tarea.impacto || 'individual',
        solicitante: tarea.solicitante || '',
        activoRelacionado: tarea.activoRelacionado || '',
        observaciones: tarea.observaciones || '',
        fechaVencimiento: tarea.fechaVencimiento ? tarea.fechaVencimiento.slice(0, 10) : '',
        responsableId: tarea.responsableId?.toString() || '',
      });
    }
  }, [tarea?.id]);

  const set = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }));

  const handleSubmit = async () => {
    if (!form.titulo.trim()) { setError('El título es obligatorio'); return; }
    setGuardando(true); setError('');
    try {
      const payload = {
        ...form,
        responsableId: form.responsableId ? parseInt(form.responsableId) : null,
        fechaVencimiento: form.fechaVencimiento ? new Date(form.fechaVencimiento).toISOString() : null,
        tipo: 'manual',
        periodo: 'ninguno',
        repeticion: 'ninguna',
      };
      const url = esNueva ? `${apiUrl}/tareas` : `${apiUrl}/tareas/${tarea!.id}`;
      const method = esNueva ? 'POST' : 'PUT';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      onSaved();
      onClose();
    } catch (e: any) {
      setError('Error al guardar. Revisá los datos e intentá de nuevo.');
      console.error(e);
    }
    setGuardando(false);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 16,
    }}>
      <div style={{
        background: 'white', borderRadius: 14,
        width: '100%', maxWidth: 560,
        maxHeight: '90vh', display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '16px 20px',
          borderBottom: '0.5px solid rgba(0,0,0,0.08)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a' }}>
            {esNueva ? 'Nueva tarea' : 'Editar tarea'}
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#aaa', fontSize: 20, lineHeight: 1,
          }}>×</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          <Field label="Título" required>
            <input
              type="text"
              value={form.titulo}
              onChange={e => set('titulo', e.target.value)}
              placeholder="Describí la tarea brevemente..."
              style={inputStyle}
              autoFocus
            />
          </Field>

          <Field label="Descripción">
            <textarea
              value={form.descripcion}
              onChange={e => set('descripcion', e.target.value)}
              placeholder="Detalle adicional, contexto, pasos..."
              rows={3}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Prioridad">
              <select value={form.prioridad} onChange={e => set('prioridad', e.target.value)} style={inputStyle}>
                {PRIORIDADES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </Field>

            <Field label="Estado">
              <select value={form.estado} onChange={e => set('estado', e.target.value)} style={inputStyle}>
                {ESTADOS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
              </select>
            </Field>

            <Field label="Responsable">
              <select value={form.responsableId} onChange={e => set('responsableId', e.target.value)} style={inputStyle}>
                <option value="">Sin asignar</option>
                {usuarios.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
              </select>
            </Field>

            <Field label="Vencimiento">
              <input
                type="date"
                value={form.fechaVencimiento}
                onChange={e => set('fechaVencimiento', e.target.value)}
                style={inputStyle}
              />
            </Field>

            <Field label="Categoría">
              <input
                type="text"
                value={form.categoria}
                onChange={e => set('categoria', e.target.value)}
                placeholder="ej: infraestructura, redes..."
                style={inputStyle}
              />
            </Field>

            <Field label="Solicitante">
              <input
                type="text"
                value={form.solicitante}
                onChange={e => set('solicitante', e.target.value)}
                placeholder="Quién solicita la tarea"
                style={inputStyle}
              />
            </Field>

            <Field label="Origen">
              <select value={form.origen} onChange={e => set('origen', e.target.value)} style={inputStyle}>
                {['interno','usuario','externo','monitoreo','otro'].map(o =>
                  <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>
                )}
              </select>
            </Field>

            <Field label="Impacto">
              <select value={form.impacto} onChange={e => set('impacto', e.target.value)} style={inputStyle}>
                {['individual','area','organización'].map(o =>
                  <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>
                )}
              </select>
            </Field>
          </div>

          <Field label="Activo relacionado">
            <input
              type="text"
              value={form.activoRelacionado}
              onChange={e => set('activoRelacionado', e.target.value)}
              placeholder="Servidor, equipo, sistema afectado..."
              style={inputStyle}
            />
          </Field>

          <Field label="Observaciones">
            <textarea
              value={form.observaciones}
              onChange={e => set('observaciones', e.target.value)}
              placeholder="Notas adicionales, bloqueos, contexto..."
              rows={2}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </Field>

          {error && (
            <div style={{
              padding: '8px 12px', borderRadius: 6, marginTop: 4,
              background: '#FCEBEB', color: '#A32D2D', fontSize: 12,
            }}>{error}</div>
          )}
        </div>

        <div style={{
          padding: '12px 20px',
          borderTop: '0.5px solid rgba(0,0,0,0.08)',
          display: 'flex', justifyContent: 'flex-end', gap: 8,
        }}>
          <button onClick={onClose} style={{
            padding: '7px 16px', fontSize: 13,
            background: 'none', border: '0.5px solid rgba(0,0,0,0.2)',
            borderRadius: 7, cursor: 'pointer', color: '#555',
          }}>Cancelar</button>
          <button
            onClick={handleSubmit}
            disabled={guardando}
            style={{
              padding: '7px 20px', fontSize: 13, fontWeight: 600,
              background: '#185FA5', color: 'white',
              border: 'none', borderRadius: 7, cursor: 'pointer',
              opacity: guardando ? 0.7 : 1,
            }}
          >
            {guardando ? 'Guardando...' : esNueva ? 'Crear tarea' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TareaFormModal;
