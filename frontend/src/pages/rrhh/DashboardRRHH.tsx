import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { empleadosService } from '@/services/empleados.service';
import { vacacionesService } from '@/services/vacaciones.service';
import { licenciasService } from '@/services/licencias.service';
import EmpleadosList from '@/components/rrhh/EmpleadosList';
import VacacionesCalendar from '@/components/rrhh/VacacionesCalendar';
import LicenciasList from '@/components/rrhh/LicenciasList';
import DocumentosList from '@/components/rrhh/DocumentosList';
import EstadisticasRRHH from '@/components/rrhh/EstadisticasRRHH';

interface Estadisticas {
  totalEmpleados: number;
  empleadosActivos: number;
  vacacionesPendientes: number;
  empleadosPorDepartamento: Array<{
    departamento: string;
    _count: { id: number };
  }>;
}

const DashboardRRHH: React.FC = () => {
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    departamento: 'todos',
    estado: 'todos',
    search: ''
  });

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  const cargarEstadisticas = async () => {
    try {
      setLoading(true);
      const data = await empleadosService.getEstadisticas();
      const porDeptoArray = Object.entries(data.porDepartamento || {}).map(([departamento, count]) => ({
        departamento,
        _count: { id: count as number }
      }));
      setEstadisticas({
        totalEmpleados: data.total ?? 0,
        empleadosActivos: data.activos ?? 0,
        vacacionesPendientes: 0,
        empleadosPorDepartamento: porDeptoArray
      });
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFiltroChange = (campo: string, valor: string) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando dashboard RRHH...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard RRHH</h1>
          <p className="text-gray-600">Gestión de empleados, vacaciones y licencias</p>
        </div>
        <Button onClick={cargarEstadisticas} variant="outline">
          🔄 Actualizar
        </Button>
      </div>

      {/* Estadísticas */}
      {estadisticas && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Empleados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{estadisticas.totalEmpleados}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Empleados Activos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{estadisticas.empleadosActivos}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Vacaciones Pendientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{estadisticas.vacacionesPendientes}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Departamentos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{estadisticas.empleadosPorDepartamento.length}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Buscar</Label>
              <Input
                id="search"
                placeholder="Nombre, apellido, email..."
                value={filtros.search}
                onChange={(e) => handleFiltroChange('search', e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="departamento">Departamento</Label>
              <Select value={filtros.departamento} onValueChange={(value) => handleFiltroChange('departamento', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar departamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los departamentos</SelectItem>
                  {estadisticas?.empleadosPorDepartamento.map((dept) => (
                    <SelectItem key={dept.departamento} value={dept.departamento}>
                      {dept.departamento} ({dept._count.id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="estado">Estado</Label>
              <Select value={filtros.estado} onValueChange={(value) => handleFiltroChange('estado', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="ACTIVO">Activo</SelectItem>
                  <SelectItem value="INACTIVO">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => setFiltros({ departamento: 'todos', estado: 'todos', search: '' })}
                className="w-full"
              >
                Limpiar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs principales */}
      <Tabs defaultValue="empleados" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="empleados">👥 Empleados</TabsTrigger>
          <TabsTrigger value="vacaciones">📅 Vacaciones</TabsTrigger>
          <TabsTrigger value="licencias">📋 Licencias</TabsTrigger>
          <TabsTrigger value="documentos">📁 Documentos</TabsTrigger>
          <TabsTrigger value="estadisticas">📊 Estadísticas</TabsTrigger>
        </TabsList>

        <TabsContent value="empleados">
          <EmpleadosList filtros={filtros} />
        </TabsContent>

        <TabsContent value="vacaciones">
          <VacacionesCalendar filtros={filtros} />
        </TabsContent>

        <TabsContent value="licencias">
          <LicenciasList filtros={filtros} />
        </TabsContent>

        <TabsContent value="documentos">
          <DocumentosList filtros={filtros} />
        </TabsContent>

        <TabsContent value="estadisticas">
          <EstadisticasRRHH />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DashboardRRHH;
