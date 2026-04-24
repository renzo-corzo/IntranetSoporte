import React from 'react';
import type { Tarea } from './types';
import { PRIORIDADES, ESTADOS } from './types';

interface Props {
  tareas: Tarea[];
  selectedId?: number;
  onSelect: (tarea: Tarea) => void;
}

const fmt = (iso?: string) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' });
};

const initials = (nombre?: string) => {
  if (!nombre) return '—';
  return nombre.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
};

const TareasLista: React.FC<Props> = ({ tareas, selectedId, onSelect }) => {
  if (tareas.length === 0) {
    return (
      <div style={{
        textAlign: 'center', padding: '48px 0',
        color: '#aaa', fontSize: 14,
      }}>
        No hay tareas con los filtros seleccionados
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
            {['Tarea', 'Estado', 'Prioridad', 'Responsable', 'Vencimiento', 'Creada'].map(h => (
              <th key={h} style={{
                textAlign: 'left', padding: '8px 12px',
                fontSize: 11, fontWeight: 600, color: '#888',
                textTransform: 'uppercase', letterSpacing: '0.04em',
                whiteSpace: 'nowrap',
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tareas.map(tarea => {
            const prioridad = PRIORIDADES.find(p => p.value === tarea.prioridad);
            const estado = ESTADOS.find(e => e.value === tarea.estado);
            const resuelta = tarea.estado === 'resuelta' || tarea.estado === 'cancelada';
            const vencida = tarea.fechaVencimiento && new Date(tarea.fechaVencimiento) < new Date() && !resuelta;

            return (
              <tr
                key={tarea.id}
                onClick={() => onSelect(tarea)}
                style={{
                  borderBottom: '0.5px solid rgba(0,0,0,0.06)',
                  background: tarea.id === selectedId ? '#EFF6FF' : 'transparent',
                  cursor: 'pointer',
                  transition: 'background 0.1s',
                  opacity: resuelta ? 0.6 : 1,
                }}
                onMouseEnter={e => {
                  if (tarea.id !== selectedId)
                    (e.currentTarget as HTMLTableRowElement).style.background = '#f9fafb';
                }}
                onMouseLeave={e => {
                  if (tarea.id !== selectedId)
                    (e.currentTarget as HTMLTableRowElement).style.background = 'transparent';
                }}
              >
                <td style={{ padding: '10px 12px', maxWidth: 280 }}>
                  <div style={{
                    fontWeight: 500, color: '#1a1a1a',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    textDecoration: resuelta ? 'line-through' : 'none',
                  }}>
                    {tarea.titulo}
                  </div>
                  {tarea.categoria && (
                    <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>{tarea.categoria}</div>
                  )}
                </td>
                <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    fontSize: 11, fontWeight: 500,
                    padding: '2px 8px', borderRadius: 20,
                    background: estado?.color + '20' || '#eee',
                    color: estado?.color || '#888',
                  }}>
                    <span style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: estado?.color || '#888', flexShrink: 0,
                    }} />
                    {estado?.label || tarea.estado}
                  </span>
                </td>
                <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                  {prioridad && (
                    <span style={{
                      fontSize: 11, fontWeight: 500,
                      padding: '2px 8px', borderRadius: 20,
                      background: prioridad.bg, color: prioridad.text,
                    }}>
                      {prioridad.label}
                    </span>
                  )}
                </td>
                <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                  {tarea.responsable ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{
                        width: 22, height: 22, borderRadius: '50%',
                        background: '#E6F1FB', color: '#185FA5',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 10, fontWeight: 600, flexShrink: 0,
                      }}>
                        {initials(tarea.responsable.nombre)}
                      </div>
                      <span style={{ fontSize: 12, color: '#444' }}>{tarea.responsable.nombre}</span>
                    </div>
                  ) : (
                    <span style={{ fontSize: 12, color: '#bbb' }}>Sin asignar</span>
                  )}
                </td>
                <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                  <span style={{ fontSize: 12, color: vencida ? '#A32D2D' : '#666', fontWeight: vencida ? 600 : 400 }}>
                    {fmt(tarea.fechaVencimiento)}
                  </span>
                </td>
                <td style={{ padding: '10px 12px', whiteSpace: 'nowrap', color: '#888', fontSize: 12 }}>
                  {fmt(tarea.creadaEn)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default TareasLista;
