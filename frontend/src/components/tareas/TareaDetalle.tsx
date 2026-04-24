import React, { useState, useEffect } from 'react';
import type { Tarea, EstadoTarea, Usuario } from './types';
import { PRIORIDADES, ESTADOS } from './types';

interface Props {
  tarea: Tarea | null;
  token: string;
  currentUser: { id: number; nombre: string };
  usuarios: Usuario[];
  onClose: () => void;
  onUpdate: () => void;
  onEdit: (tarea: Tarea) => void;
  apiUrl: string;
}

const fmt = (iso?: string) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-AR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const fmtShort = (iso?: string) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
};

const initials = (nombre?: string) => {
  if (!nombre) return '?';
  return nombre.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
};

const TareaDetalle: React.FC<Props> = ({
  tarea, token, currentUser, usuarios, onClose, onUpdate, onEdit, apiUrl
}) => {
  const [comentario, setComentario] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [cambiandoEstado, setCambiandoEstado] = useState(false);
  const [nuevoEstado, setNuevoEstado] = useState('');
  const [asignando, setAsignando] = useState(false);
  const [responsableId, setResponsableId] = useState<string>('');

  useEffect(() => {
    if (tarea) {
      setNuevoEstado(tarea.estado);
      setResponsableId(tarea.responsableId?.toString() || '');
    }
  }, [tarea?.id]);

  if (!tarea) return null;

  const prioridad = PRIORIDADES.find(p => p.value === tarea.prioridad);
  const estadoInfo = ESTADOS.find(e => e.value === tarea.estado);
  const resuelta = tarea.estado === 'resuelta' || tarea.estado === 'cancelada';

  const handleComentario = async () => {
    if (!comentario.trim()) return;
    setEnviando(true);
    try {
      await fetch(`${apiUrl}/tareas/${tarea.id}/comentarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ contenido: comentario }),
      });
      setComentario('');
      onUpdate();
    } catch (e) {
      console.error(e);
    }
    setEnviando(false);
  };

  const handleCambioEstado = async () => {
    if (nuevoEstado === tarea.estado) return;
    setCambiandoEstado(true);
    try {
      await fetch(`${apiUrl}/tareas/${tarea.id}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      onUpdate();
    } catch (e) {
      console.error(e);
    }
    setCambiandoEstado(false);
  };

  const handleAsignar = async () => {
    setAsignando(true);
    try {
      await fetch(`${apiUrl}/tareas/${tarea.id}/asignacion`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ responsableId: responsableId ? parseInt(responsableId) : null }),
      });
      onUpdate();
    } catch (e) {
      console.error(e);
    }
    setAsignando(false);
  };

  const handleEliminar = async () => {
    if (!confirm(`¿Eliminar la tarea "${tarea.titulo}"? Esta acción no se puede deshacer.`)) return;
    try {
      await fetch(`${apiUrl}/tareas/${tarea.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      onClose();
      onUpdate();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{
      width: 380, flexShrink: 0,
      background: 'white',
      border: '0.5px solid rgba(0,0,0,0.1)',
      borderRadius: 12,
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
      maxHeight: 'calc(100vh - 200px)',
    }}>
      <div style={{
        padding: '14px 16px',
        borderBottom: '0.5px solid rgba(0,0,0,0.08)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', lineHeight: 1.4 }}>
            {tarea.titulo}
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
            {prioridad && (
              <span style={{
                fontSize: 11, fontWeight: 500, padding: '2px 7px',
                borderRadius: 20, background: prioridad.bg, color: prioridad.text,
              }}>{prioridad.label}</span>
            )}
            {tarea.categoria && (
              <span style={{
                fontSize: 11, padding: '2px 7px', borderRadius: 20,
                background: '#F1EFE8', color: '#5F5E5A',
              }}>{tarea.categoria}</span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          <button onClick={() => onEdit(tarea)} style={{
            background: 'none', border: '0.5px solid rgba(0,0,0,0.15)', borderRadius: 6,
            padding: '4px 8px', cursor: 'pointer', fontSize: 11, color: '#555',
          }}>Editar</button>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#aaa', fontSize: 18, lineHeight: 1, padding: '2px 4px',
          }}>×</button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>

        {tarea.descripcion && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>Descripción</div>
            <div style={{ fontSize: 13, color: '#444', lineHeight: 1.6 }}>{tarea.descripcion}</div>
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>Estado</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <select
              value={nuevoEstado}
              onChange={e => setNuevoEstado(e.target.value)}
              disabled={resuelta}
              style={{
                flex: 1, fontSize: 13, padding: '6px 8px',
                border: '0.5px solid rgba(0,0,0,0.2)', borderRadius: 6,
                background: 'white', color: estadoInfo?.color || '#444',
                cursor: resuelta ? 'not-allowed' : 'pointer',
              }}
            >
              {ESTADOS.map(e => (
                <option key={e.value} value={e.value}>{e.label}</option>
              ))}
            </select>
            {nuevoEstado !== tarea.estado && (
              <button
                onClick={handleCambioEstado}
                disabled={cambiandoEstado}
                style={{
                  padding: '6px 12px', fontSize: 12, fontWeight: 600,
                  background: '#185FA5', color: 'white',
                  border: 'none', borderRadius: 6, cursor: 'pointer',
                }}
              >
                {cambiandoEstado ? '...' : 'Guardar'}
              </button>
            )}
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>Responsable</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <select
              value={responsableId}
              onChange={e => setResponsableId(e.target.value)}
              style={{
                flex: 1, fontSize: 13, padding: '6px 8px',
                border: '0.5px solid rgba(0,0,0,0.2)', borderRadius: 6,
                background: 'white',
              }}
            >
              <option value="">Sin asignar</option>
              {usuarios.map(u => (
                <option key={u.id} value={u.id}>{u.nombre}</option>
              ))}
            </select>
            {responsableId !== (tarea.responsableId?.toString() || '') && (
              <button
                onClick={handleAsignar}
                disabled={asignando}
                style={{
                  padding: '6px 12px', fontSize: 12, fontWeight: 600,
                  background: '#185FA5', color: 'white',
                  border: 'none', borderRadius: 6, cursor: 'pointer',
                }}
              >
                {asignando ? '...' : 'Asignar'}
              </button>
            )}
          </div>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16,
        }}>
          {[
            { label: 'Solicitante', value: tarea.solicitante },
            { label: 'Origen', value: tarea.origen },
            { label: 'Impacto', value: tarea.impacto },
            { label: 'Activo', value: tarea.activoRelacionado },
            { label: 'Vencimiento', value: fmtShort(tarea.fechaVencimiento) },
            { label: 'Creada', value: fmt(tarea.creadaEn) },
          ].filter(f => f.value && f.value !== '—').map(({ label, value }) => (
            <div key={label}>
              <div style={{ fontSize: 10, fontWeight: 600, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>{label}</div>
              <div style={{ fontSize: 12, color: '#444' }}>{value}</div>
            </div>
          ))}
        </div>

        {tarea.observaciones && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>Observaciones</div>
            <div style={{
              fontSize: 12, color: '#555', lineHeight: 1.5, padding: '8px 10px',
              background: '#FAEEDA', borderRadius: 6, borderLeft: '3px solid #854F0B',
            }}>{tarea.observaciones}</div>
          </div>
        )}

        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>
            Comentarios {tarea.comentarios?.length ? `(${tarea.comentarios.length})` : ''}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
            {tarea.comentarios?.map(c => (
              <div key={c.id} style={{
                background: '#f9fafb', borderRadius: 8, padding: '8px 10px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%',
                    background: '#E6F1FB', color: '#185FA5',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 9, fontWeight: 700, flexShrink: 0,
                  }}>
                    {initials(c.autor?.nombre)}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 500, color: '#444' }}>
                    {c.autor?.nombre || 'Usuario'}
                  </span>
                  <span style={{ fontSize: 10, color: '#aaa', marginLeft: 'auto' }}>
                    {fmt(c.creadaEn)}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: '#555', lineHeight: 1.5 }}>{c.contenido}</div>
              </div>
            ))}
            {(!tarea.comentarios || tarea.comentarios.length === 0) && (
              <div style={{ fontSize: 12, color: '#bbb', textAlign: 'center', padding: '8px 0' }}>
                Sin comentarios aún
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <textarea
              value={comentario}
              onChange={e => setComentario(e.target.value)}
              placeholder="Agregar comentario..."
              rows={2}
              onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleComentario(); }}
              style={{
                flex: 1, fontSize: 12, padding: '7px 10px',
                border: '0.5px solid rgba(0,0,0,0.2)', borderRadius: 6,
                resize: 'none', fontFamily: 'inherit',
              }}
            />
            <button
              onClick={handleComentario}
              disabled={enviando || !comentario.trim()}
              style={{
                padding: '0 12px', background: '#185FA5', color: 'white',
                border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12,
                opacity: !comentario.trim() ? 0.5 : 1, alignSelf: 'flex-end',
                height: 34,
              }}
            >
              {enviando ? '...' : 'Enviar'}
            </button>
          </div>
        </div>
      </div>

      {!resuelta && (
        <div style={{
          padding: '10px 16px',
          borderTop: '0.5px solid rgba(0,0,0,0.08)',
          display: 'flex', gap: 6, justifyContent: 'flex-end',
        }}>
          <button
            onClick={handleEliminar}
            style={{
              padding: '5px 12px', fontSize: 12,
              background: 'none', color: '#A32D2D',
              border: '0.5px solid #A32D2D', borderRadius: 6, cursor: 'pointer',
            }}
          >Eliminar</button>
        </div>
      )}
    </div>
  );
};

export default TareaDetalle;
