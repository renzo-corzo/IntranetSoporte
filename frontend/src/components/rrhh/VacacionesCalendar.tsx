import React from 'react';
import VacacionesCalendarAdvanced from './VacacionesCalendarAdvanced';

interface VacacionesCalendarProps {
  filtros: {
    departamento: string;
    estado: string;
    search: string;
  };
}

const VacacionesCalendar: React.FC<VacacionesCalendarProps> = ({ filtros }) => {
  return <VacacionesCalendarAdvanced filtros={filtros} />;
};

export default VacacionesCalendar;
