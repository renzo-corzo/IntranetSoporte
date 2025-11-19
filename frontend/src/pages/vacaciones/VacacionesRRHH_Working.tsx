import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

const VacacionesRRHH_Working: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [empleados, setEmpleados] = useState<any[]>([]);

  useEffect(() => {
    // Simular carga de datos
    setTimeout(() => {
      setEmpleados([
        { id: 1, nombre: 'Juan Pérez', departamento: 'Sistemas' },
        { id: 2, nombre: 'María García', departamento: 'Contaduría' },
        { id: 3, nombre: 'Carlos López', departamento: 'Secretaría' }
      ]);
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
          <CardTitle>Empleados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {empleados.map(empleado => (
              <div key={empleado.id} className="flex justify-between items-center p-2 border rounded">
                <div>
                  <span className="font-medium">{empleado.nombre}</span>
                  <span className="text-gray-500 ml-2">- {empleado.departamento}</span>
                </div>
                <Button size="sm" variant="outline">
                  Ver Vacaciones
                </Button>
              </div>
            ))}
          </div>
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

export default VacacionesRRHH_Working;
