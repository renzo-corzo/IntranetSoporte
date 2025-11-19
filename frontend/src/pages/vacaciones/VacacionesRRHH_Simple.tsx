import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const VacacionesRRHH_Simple: React.FC = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simular carga
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Vacaciones - RRHH</h1>
          <p className="text-gray-600">Administra las vacaciones de todos los empleados</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          Nueva Solicitud
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Filtros de búsqueda aquí...</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="h-[400px] flex items-center justify-center">
            <p className="text-gray-500">Calendario de vacaciones aquí...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VacacionesRRHH_Simple;
