import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import VacacionesCalendarAdvanced from './VacacionesCalendarAdvanced';

interface VacacionesCalendarProps {
  filtros: {
    departamento: string;
    estado: string;
    search: string;
  };
}

const VacacionesCalendar: React.FC<VacacionesCalendarProps> = ({ filtros }) => {
  return (
    <Tabs defaultValue="calendario" className="space-y-4">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="calendario">📅 Vista Calendario</TabsTrigger>
        <TabsTrigger value="lista">📋 Vista Lista</TabsTrigger>
      </TabsList>

      <TabsContent value="calendario">
        <VacacionesCalendarAdvanced filtros={filtros} />
      </TabsContent>

      <TabsContent value="lista">
        <VacacionesCalendarAdvanced filtros={filtros} />
      </TabsContent>
    </Tabs>
  );
};

export default VacacionesCalendar;
