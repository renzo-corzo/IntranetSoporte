import React from 'react';
import type { Tarea } from './types';
import { PRIORIDADES } from './types';

interface Props {
  tarea: Tarea;
  onClick: (tarea: Tarea) => void;
  selected?: boolean;
}

const formatFecha = (iso?: string) => {
  if (!iso) return null;
  const d = new Date(iso);
  const hoy = new Date();
  const diffDias = Math.floor((d.getTime() - hoy.setHours(0,0,0,0)) / 86400000);
  if (diffDias < 0) return { label: `Venció hace ${Math.abs(diffDias)}d`, vencida: true };
  if (diffDias === 0) return { label: 'Vence hoy', vencida: true };
  if (diffDias === 1) return { label: 'Vence mañana', vencida: false };
  return { label: `Vence ${d.toLocaleDateString('es-AR', { day:'numeric', month:'short' })}`, vencida: false };
};

const initials = (nombre?: string) => {
  if (!nombre) return '?';
  return nombre.split(' ').slice(0,2).map(n => n[0]).join('').toUpperCase();
};

const AVATAR_COLORS = ['#E6F1FB', '#EEEDFE', '#E1F5EE', '#FAECE7', '#FBEAF0'];
const AVATAR_TEXT   = ['#185FA5', '#534AB7', '#0F6E56', '#993C1D', '#993556'];

const avatarColor = (id?: number) => {
  const i = (id || 0) % AVATAR_COLORS.length;
  return { bg: AVATAR_COLORS[i], text: AVATAR_TEXT[i] };
};

const TareaCard: React.FC<Props> = ({ tarea, onClick, selected }) => {
  const prioridad = PRIORIDADES.find(p => p.value === tarea.prioridad) || PRIORIDADES[1];
  const fecha = formatFecha(tarea.fechaVencimiento);
  const av = avatarColor(tarea.responsable?.id);
  const nComentarios = tarea.comentarios?.length ?? 0;
  const bloqueada = tarea.estado === 'bloqueada';
  const resuelta = tarea.estado === 'resuelta' || tarea.estado === 'cancelada';

  return (
    <div
      onClick={() => onClick(tarea)}
      style={{
        background: 'white',
        border: selected ? '1.5px solid #185FA5' : '0.5px solid rgba(0,0,0,0.1)',
        borderLeft: bloqueada ? '3px solid #854F0B' : tarea.prioridad === 'critica' ? '3px solid #A32D2D' : undefined,
        borderRadius: bloqueada || tarea.prioridad === 'critica' ? '0 10px 10px 0' : 10,
        padding: '10px 12px',
        cursor: 'pointer',
        opacity: resuelta ? 0.65 : 1,
        transition: 'box-shadow 0.15s, transform 0.1s',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
        (e.currentTarget as HTMLDivElement).style.transform = 'none';
      }}
    >
      <div style={{
        fontSize: 13,
        fontWeight: 500,
        color: '#1a1a1a',
        marginBottom: 8,
        lineHeight: 1.4,
        textDecoration: resuelta ? 'line-through' : 'none',
      }}>
        {tarea.titulo}
      </div>

      {tarea.descripcion && (
        <div style={{
          fontSize: 11,
          color: '#888',
          marginBottom: 8,
          lineHeight: 1.4,
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        } as React.CSSProperties}>
          {tarea.descripcion}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{
          display: 'inline-block',
          fontSize: 11,
          fontWeight: 500,
          padding: '2px 7px',
          borderRadius: 20,
          background: prioridad.bg,
          color: prioridad.text,
        }}>
          {prioridad.label}
        </span>

        <div style={{
          width: 26, height: 26, borderRadius: '50%',
          background: tarea.responsable ? av.bg : '#F1EFE8',
          color: tarea.responsable ? av.text : '#888',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10, fontWeight: 600,
        }}>
          {tarea.responsable ? initials(tarea.responsable.nombre) : '—'}
        </div>
      </div>

      {(fecha || nComentarios > 0 || tarea.categoria) && (
        <div style={{
          display: 'flex', gap: 8, marginTop: 7, alignItems: 'center',
          flexWrap: 'wrap',
        }}>
          {fecha && (
            <span style={{
              fontSize: 10,
              color: fecha.vencida ? '#A32D2D' : '#888',
              fontWeight: fecha.vencida ? 600 : 400,
            }}>
              {fecha.label}
            </span>
          )}
          {tarea.categoria && (
            <span style={{ fontSize: 10, color: '#888' }}>
              {tarea.categoria}
            </span>
          )}
          {nComentarios > 0 && (
            <span style={{ fontSize: 10, color: '#888', marginLeft: 'auto' }}>
              💬 {nComentarios}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default TareaCard;
