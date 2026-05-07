import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { empleadosService } from '@/services/empleados.service';
import { vacacionesService } from '@/services/vacaciones.service';
import { licenciasService } from '@/services/licencias.service';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface EstadisticasCompletas {
  empleados: {
    total: number;
    activos: number;
    inactivos: number;
    porDepartamento: Array<{
      departamento: string;
      count: number;
    }>;
  };
  vacaciones: {
    total: number;
    pendientes: number;
    aprobadas: number;
    rechazadas: number;
    canceladas: number;
    porMes: Array<{
      mes: string;
      count: number;
    }>;
  };
  licencias: {
    total: number;
    porTipo: Array<{
      tipo: string;
      count: number;
    }>;
    porMes: Array<{
      mes: string;
      count: number;
    }>;
  };
}

const EstadisticasRRHH: React.FC = () => {
  const [estadisticas, setEstadisticas] = useState<EstadisticasCompletas | null>(null);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    departamento: 'todos',
    año: '2023' // Año base desde el que comenzaron a cargar datos
  });

  useEffect(() => {
    cargarEstadisticas();
  }, [filtros]);

  const cargarEstadisticas = async () => {
    try {
      setLoading(true);
      
      // Cargar estadísticas de empleados
      const empleadosResponse = await empleadosService.getEstadisticas();
      // getEstadisticas ya devuelve response.data directamente
      const empleadosData = empleadosResponse;

      // Cargar vacaciones del año seleccionado
      const fechaInicio = `${filtros.año}-01-01`;
      const fechaFin = `${filtros.año}-12-31`;
      
      const vacacionesResponse = await vacacionesService.getVacaciones({
        fechaInicio,
        fechaFin
      });

      // Cargar licencias del año seleccionado
      const licenciasResponse = await licenciasService.getLicencias({
        fechaInicio,
        fechaFin
      });

      // Procesar datos de vacaciones
      // getVacaciones devuelve { data: [...] }
      // Pero el backend devuelve { success: true, data: [...] }
      let vacaciones = [];
      if (vacacionesResponse && vacacionesResponse.data) {
        if (Array.isArray(vacacionesResponse.data)) {
          vacaciones = vacacionesResponse.data;
        } else if (vacacionesResponse.data.data && Array.isArray(vacacionesResponse.data.data)) {
          vacaciones = vacacionesResponse.data.data;
        }
      } else if (Array.isArray(vacacionesResponse)) {
        vacaciones = vacacionesResponse;
      }
      
      
      const vacacionesPorEstado = vacaciones.reduce((acc: any, vacacion: any) => {
        acc[vacacion.estado] = (acc[vacacion.estado] || 0) + 1;
        return acc;
      }, {});

      // Procesar datos de licencias
      // getLicencias devuelve response.data directamente
      let licencias = [];
      if (licenciasResponse && licenciasResponse.data) {
        if (Array.isArray(licenciasResponse.data)) {
          licencias = licenciasResponse.data;
        } else if (licenciasResponse.data.data && Array.isArray(licenciasResponse.data.data)) {
          licencias = licenciasResponse.data.data;
        }
      } else if (Array.isArray(licenciasResponse)) {
        licencias = licenciasResponse;
      }
      
      
      const licenciasPorTipo = licencias.reduce((acc: any, licencia: any) => {
        acc[licencia.tipo] = (acc[licencia.tipo] || 0) + 1;
        return acc;
      }, {});

      // Agrupar por mes
      const vacacionesPorMes = agruparPorMes(vacaciones, 'fechaInicio');
      const licenciasPorMes = agruparPorMes(licencias, 'fechaInicio');

      // El backend devuelve: { total, activos, inactivos, porDepartamento: { dept: count } }
      // Convertir porDepartamento de objeto a array
      const porDepartamentoArray = empleadosData.porDepartamento 
        ? Object.entries(empleadosData.porDepartamento).map(([departamento, count]) => ({
            departamento,
            count: count as number
          }))
        : [];

      setEstadisticas({
        empleados: {
          total: empleadosData.total || 0,
          activos: empleadosData.activos || 0,
          inactivos: empleadosData.inactivos || 0,
          porDepartamento: porDepartamentoArray
        },
        vacaciones: {
          total: vacaciones.length,
          pendientes: vacacionesPorEstado.PENDIENTE || 0,
          aprobadas: vacacionesPorEstado.APROBADA || 0,
          rechazadas: vacacionesPorEstado.RECHAZADA || 0,
          canceladas: vacacionesPorEstado.CANCELADA || 0,
          porMes: vacacionesPorMes
        },
        licencias: {
          total: licencias.length,
          porTipo: Object.entries(licenciasPorTipo).map(([tipo, count]) => ({
            tipo,
            count: count as number
          })),
          porMes: licenciasPorMes
        }
      });
    } catch (error: any) {
      console.error('Error al cargar estadísticas:', error);
      console.error('Detalles del error:', error.response?.data || error.message);
      // No establecer estadísticas en null, dejar que muestre el error
    } finally {
      setLoading(false);
    }
  };

  const agruparPorMes = (datos: any[], campoFecha: string) => {
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    if (!Array.isArray(datos) || datos.length === 0) {
      return meses.map((mes) => ({ mes, count: 0 }));
    }

    const agrupado = datos.reduce((acc: any, item: any) => {
      if (!item || !item[campoFecha]) return acc;
      
      try {
        // Parsear fecha correctamente (puede venir como string ISO o Date)
        const fechaStr = item[campoFecha];
        let fecha: Date;
        
        if (typeof fechaStr === 'string') {
          // Si es string, parsear manualmente para evitar problemas de zona horaria
          if (fechaStr.includes('T')) {
            const datePart = fechaStr.split('T')[0];
            const [year, month, day] = datePart.split('-').map(Number);
            fecha = new Date(year, month - 1, day);
          } else {
            fecha = new Date(fechaStr);
          }
        } else {
          fecha = fechaStr;
        }
        
        if (!isNaN(fecha.getTime())) {
          const mes = fecha.getMonth();
          acc[mes] = (acc[mes] || 0) + 1;
        }
      } catch (e) {
        console.warn('Error al parsear fecha:', item[campoFecha], e);
      }
      
      return acc;
    }, {});

    return meses.map((mes, index) => ({
      mes,
      count: agrupado[index] || 0
    }));
  };

  const exportarCSV = () => {
    if (!estadisticas) return;

    let csv = 'Categoría,Detalle,Cantidad\n';
    
    // Empleados
    csv += `Empleados,Total,${estadisticas.empleados.total}\n`;
    csv += `Empleados,Activos,${estadisticas.empleados.activos}\n`;
    csv += `Empleados,Inactivos,${estadisticas.empleados.inactivos}\n`;
    
    // Vacaciones
    csv += `Vacaciones,Total,${estadisticas.vacaciones.total}\n`;
    csv += `Vacaciones,Pendientes,${estadisticas.vacaciones.pendientes}\n`;
    csv += `Vacaciones,Aprobadas,${estadisticas.vacaciones.aprobadas}\n`;
    csv += `Vacaciones,Rechazadas,${estadisticas.vacaciones.rechazadas}\n`;
    csv += `Vacaciones,Canceladas,${estadisticas.vacaciones.canceladas}\n`;
    
    // Licencias
    csv += `Licencias,Total,${estadisticas.licencias.total}\n`;
    estadisticas.licencias.porTipo.forEach(tipo => {
      csv += `Licencias,${tipo.tipo},${tipo.count}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `estadisticas_rrhh_${filtros.año}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando estadísticas...</p>
        </div>
      </div>
    );
  }

  if (!estadisticas) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-gray-500">No se pudieron cargar las estadísticas</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Estadísticas RRHH</h2>
        <div className="flex space-x-2">
          <Select value={filtros.año} onValueChange={(value) => setFiltros(prev => ({ ...prev, año: value }))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2023">2023</SelectItem>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2026">2026</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportarCSV} variant="outline">
            📊 Exportar CSV
          </Button>
        </div>
      </div>

      {/* Estadísticas de Empleados */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Empleados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{estadisticas.empleados.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Empleados Activos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{estadisticas.empleados.activos}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Empleados Inactivos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{estadisticas.empleados.inactivos}</div>
          </CardContent>
        </Card>
      </div>

      {/* Estadísticas de Vacaciones */}
      <Card>
        <CardHeader>
          <CardTitle>Vacaciones {filtros.año}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{estadisticas.vacaciones.total}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{estadisticas.vacaciones.pendientes}</div>
              <div className="text-sm text-gray-600">Pendientes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{estadisticas.vacaciones.aprobadas}</div>
              <div className="text-sm text-gray-600">Aprobadas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{estadisticas.vacaciones.rechazadas}</div>
              <div className="text-sm text-gray-600">Rechazadas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{estadisticas.vacaciones.canceladas}</div>
              <div className="text-sm text-gray-600">Canceladas</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas de Licencias */}
      <Card>
        <CardHeader>
          <CardTitle>Licencias {filtros.año}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{estadisticas.licencias.total}</div>
              <div className="text-sm text-gray-600">Total de Licencias</div>
            </div>
            
            {estadisticas.licencias.porTipo.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Por Tipo:</h4>
                <div className="flex flex-wrap gap-2">
                  {estadisticas.licencias.porTipo.map((tipo) => (
                    <Badge key={tipo.tipo} variant="outline" className="text-sm">
                      {tipo.tipo}: {tipo.count}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Empleados por Departamento */}
      <Card>
        <CardHeader>
          <CardTitle>Empleados por Departamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {estadisticas.empleados.porDepartamento.map((dept) => (
              <div key={dept.departamento} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="font-medium">{dept.departamento}</span>
                <Badge variant="outline">{dept.count} empleados</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EstadisticasRRHH;
