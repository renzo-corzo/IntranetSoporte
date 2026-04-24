import React from 'react';
import type { Tarea } from './types';
import { COLUMNAS_KANBAN, ESTADOS } from './types';
import TareaCard from './TareaCard';

interface Props {
  tareas: Tarea[];
  selectedId?: number;
  onSelect: (tarea: Tarea) => void;
  onNuevaTarea?: (estado?: string) => void;
}

const TareasKanban: React.FC<Props> = ({ tareas, selectedId, onSelect, onNuevaTarea }) => {
  const columnas = COLUMNAS_KANBAN.map(estado => ({
    estado,
    label: ESTADOS.find(e => e.value === estado)?.label || estado,
    color: ESTADOS.find(e => e.value === estado)?.color || '#888',
    tareas: tareas.filter(t => t.estado === estado || 
      (estado === 'pendiente' && !COLUMNAS_KANBAN.includes(t.estado as any))),
  }));

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${COLUMNAS_KANBAN.length}, minmax(220px, 1fr))`,
      gap: 12,
      overflowX: 'auto',
      paddingBottom: 8,
    }}>
      {columnas.map(col => (
        <div key={col.estado} style={{ minWidth: 0 }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 10, padding: '0 2px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%', background: col.color,
              }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: '#555', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {col.label}
              </span>
              <span style={{
                fontSize: 11, fontWeight: 500, color: 'white',
                background: col.color,
                borderRadius: 20, padding: '1px 6px',
              }}>
                {col.tareas.length}
              </span>
            </div>
            {onNuevaTarea && col.estado === 'pendiente' && (
              <button
                onClick={() => onNuevaTarea(col.estado)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#888', fontSize: 18, lineHeight: 1, padding: '0 2px',
                  borderRadius: 4,
                }}
                title="Nueva tarea"
              >+</button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {col.tareas.map(tarea => (
              <TareaCard
                key={tarea.id}
                tarea={tarea}
                onClick={onSelect}
                selected={tarea.id === selectedId}
              />
            ))}
            {col.tareas.length === 0 && (
              <div style={{
                border: '1.5px dashed rgba(0,0,0,0.1)',
                borderRadius: 10,
                padding: '20px 12px',
                textAlign: 'center',
                color: '#bbb',
                fontSize: 12,
              }}>
                Sin tareas
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TareasKanban;
