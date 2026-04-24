import React from 'react';
import type { KpisTareas } from './types';

interface Props {
  kpis: KpisTareas | null;
  loading: boolean;
}

const KpiCard: React.FC<{
  label: string;
  value: number | string;
  bg: string;
  color: string;
}> = ({ label, value, bg, color }) => (
  <div style={{
    background: bg,
    borderRadius: '8px',
    padding: '10px 14px',
    minWidth: 0,
    flex: 1,
  }}>
    <div style={{ fontSize: 11, color, marginBottom: 3, fontWeight: 500 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 600, color }}>{value}</div>
  </div>
);

const TareasKpis: React.FC<Props> = ({ kpis, loading }) => {
  if (loading || !kpis) {
    return (
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{
            flex: 1, height: 60, borderRadius: 8,
            background: '#f3f4f6', animation: 'pulse 1.5s infinite'
          }} />
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
      <KpiCard label="Abiertas" value={kpis.abiertas ?? kpis.total} bg="#F1EFE8" color="#5F5E5A" />
      <KpiCard label="Críticas" value={kpis.criticas} bg="#FCEBEB" color="#A32D2D" />
      <KpiCard label="Vencidas" value={kpis.vencidas} bg="#FAEEDA" color="#854F0B" />
      <KpiCard label="Sin asignar" value={kpis.sinAsignar} bg="#EEEDFE" color="#534AB7" />
      <KpiCard label="Resueltas hoy" value={kpis.resueltasHoy} bg="#EAF3DE" color="#3B6D11" />
    </div>
  );
};

export default TareasKpis;
