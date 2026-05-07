import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { vacacionesService } from '@/services/vacaciones.service';
import { empleadosService } from '@/services/empleados.service';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isWeekend } from 'date-fns';
import { es } from 'date-fns/locale';

// Función helper para parsear fechas sin problemas de zona horaria
const parseDateString = (dateString: string): Date => {
  if (!dateString) {
    return new Date();
  }
  
  // Si la fecha viene como YYYY-MM-DD, la parseamos manualmente
  // para evitar problemas de zona horaria
  if (dateString.includes('T')) {
    // Si tiene hora, extraer solo la parte de la fecha
    const datePart = dateString.split('T')[0];
    const [year, month, day] = datePart.split('-').map(Number);
    if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
      return new Date(year, month - 1, day); // month es 0-indexed en JavaScript
    }
  } else if (dateString.includes('-') && dateString.split('-').length === 3) {
    const [year, month, day] = dateString.split('-').map(Number);
    if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
      return new Date(year, month - 1, day); // month es 0-indexed en JavaScript
    }
  }
  
  // Si es formato ISO completo, usar parseISO pero ajustar
  try {
    const parsed = parseISO(dateString);
    // Si la fecha parece estar en UTC, ajustarla a hora local
    if (dateString.endsWith('Z') || dateString.includes('+00:00')) {
      const datePart = dateString.split('T')[0];
      const [year, month, day] = datePart.split('-').map(Number);
      return new Date(year, month - 1, day);
    }
    return parsed;
  } catch {
    return new Date(dateString);
  }
};

interface Vacacion {
  id: string;
  empleadoId: string;
  fechaInicio: string;
  fechaFin: string;
  diasSolicitados: number;
  observaciones?: string;
  estado: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA' | 'CANCELADA';
  empleado: {
    id: string;
    nombre: string;
    apellido: string;
    departamento: string;
  };
}

interface VacacionesCalendarAdvancedProps {
  filtros: {
    departamento: string;
    estado: string;
    search: string;
  };
}

const VacacionesCalendarAdvanced: React.FC<VacacionesCalendarAdvancedProps> = ({ filtros }) => {
  const [vacaciones, setVacaciones] = useState<Vacacion[]>([]);
  const [empleados, setEmpleados] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [vacacionSeleccionada, setVacacionSeleccionada] = useState<Vacacion | null>(null);
  const [formData, setFormData] = useState({
    empleadoId: '',
    fechaInicio: '',
    fechaFin: '',
    observaciones: ''
  });
  const [comentarioDecision, setComentarioDecision] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroDepartamento, setFiltroDepartamento] = useState('todos');

  useEffect(() => {
    cargarVacaciones();
    cargarEmpleados();
  }, [filtros, currentMonth]);

  const cargarVacaciones = async () => {
    try {
      setLoading(true);
      const response = await vacacionesService.getVacaciones({
        departamento: filtros.departamento !== 'todos' ? filtros.departamento : undefined,
        estado: filtros.estado !== 'todos' ? filtros.estado : undefined
      });
      setVacaciones((response.data || []) as Vacacion[]);
    } catch (error) {
      console.error('Error al cargar vacaciones:', error);
      setVacaciones([]);
    } finally {
      setLoading(false);
    }
  };

  const cargarEmpleados = async () => {
    try {
      const response = await empleadosService.getEmpleados();
      setEmpleados(response.data || []);
    } catch (error) {
      console.error('Error al cargar empleados:', error);
    }
  };

  const handleCrearVacacion = () => {
    setFormData({
      empleadoId: '',
      fechaInicio: '',
      fechaFin: '',
      observaciones: ''
    });
    setVacacionSeleccionada(null);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await vacacionesService.createVacacion(formData);
      setShowModal(false);
      cargarVacaciones();
    } catch (error: any) {
      console.error('Error al crear vacación:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Error al crear la vacación';
      alert(`Error al crear la vacación:\n\n${errorMessage}`);
    }
  };

  const handleAprobar = async (id: string) => {
    try {
      await vacacionesService.aprobarVacacion(id, comentarioDecision);
      setComentarioDecision('');
      cargarVacaciones();
    } catch (error) {
      console.error('Error al aprobar vacación:', error);
    }
  };

  const handleRechazar = async (id: string) => {
    try {
      await vacacionesService.rechazarVacacion(id, comentarioDecision);
      setComentarioDecision('');
      cargarVacaciones();
    } catch (error) {
      console.error('Error al rechazar vacación:', error);
    }
  };

  const handleCancelar = async (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres cancelar esta solicitud?')) {
      try {
        await vacacionesService.cancelarVacacion(id);
        cargarVacaciones();
      } catch (error) {
        console.error('Error al cancelar vacación:', error);
      }
    }
  };

  const handleEliminar = async (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres ELIMINAR esta vacación? Esta acción no se puede deshacer.')) {
      try {
        await vacacionesService.eliminarVacacion(id);
        cargarVacaciones();
      } catch (error) {
        console.error('Error al eliminar vacación:', error);
        alert('Error al eliminar la vacación. Por favor, inténtalo de nuevo.');
      }
    }
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Pendiente</Badge>;
      case 'APROBADA':
        return <Badge variant="default" className="bg-green-100 text-green-800">Aprobada</Badge>;
      case 'RECHAZADA':
        return <Badge variant="destructive" className="bg-red-100 text-red-800">Rechazada</Badge>;
      case 'CANCELADA':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Cancelada</Badge>;
      default:
        return <Badge variant="outline">{estado}</Badge>;
    }
  };

  const getVacacionesPorDia = (fecha: Date) => {
    if (!Array.isArray(vacaciones)) return [];
    return vacaciones.filter(vacacion => {
      // Filtro por estado
      if (filtroEstado !== 'todos' && vacacion.estado !== filtroEstado) {
        return false;
      }
      
      // Filtro por departamento
      if (filtroDepartamento !== 'todos' && vacacion.empleado.departamento !== filtroDepartamento) {
        return false;
      }
      
      // Filtro por fecha
      const inicio = parseDateString(vacacion.fechaInicio);
      const fin = parseDateString(vacacion.fechaFin);
      return isSameDay(fecha, inicio) || isSameDay(fecha, fin) || (fecha >= inicio && fecha <= fin);
    });
  };

  const getColorVacacion = (estado: string) => {
    switch (estado) {
      case 'APROBADA':
        return 'bg-green-50 border-green-500 text-green-900 hover:bg-green-100';
      case 'PENDIENTE':
        return 'bg-yellow-50 border-yellow-500 text-yellow-900 hover:bg-yellow-100';
      case 'RECHAZADA':
        return 'bg-red-50 border-red-500 text-red-900 hover:bg-red-100';
      case 'CANCELADA':
        return 'bg-gray-50 border-gray-400 text-gray-700 hover:bg-gray-100';
      default:
        return 'bg-gray-50 border-gray-400 text-gray-700 hover:bg-gray-100';
    }
  };

  // Obtener departamentos únicos para el filtro
  const departamentosUnicos = Array.from(new Set(vacaciones.map(v => v.empleado.departamento)));

  const renderCalendario = () => {
    const inicioMes = startOfMonth(currentMonth);
    const finMes = endOfMonth(currentMonth);
    const dias = eachDayOfInterval({ start: inicioMes, end: finMes });
    
    const diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const hoy = new Date();
    const esHoy = (dia: Date) => 
      dia.getDate() === hoy.getDate() &&
      dia.getMonth() === hoy.getMonth() &&
      dia.getFullYear() === hoy.getFullYear();
    
    // Obtener el primer día del mes para calcular días vacíos
    const primerDia = inicioMes.getDay();
    const diasVacios = Array.from({ length: primerDia === 0 ? 6 : primerDia - 1 }, (_, i) => null);
    
    return (
      <div className="w-full">
        {/* Encabezados de días */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {diasSemana.map(dia => (
            <div 
              key={dia} 
              className="text-center text-sm font-bold text-gray-700 py-3 bg-gray-100 rounded-t-lg border-b-2 border-gray-200"
            >
              {dia}
            </div>
          ))}
        </div>
        
        {/* Días del mes */}
        <div className="grid grid-cols-7 gap-2">
          {/* Días vacíos al inicio */}
          {diasVacios.map((_, index) => (
            <div key={`empty-${index}`} className="min-h-[120px]"></div>
          ))}
          
          {/* Días del mes */}
          {dias.map(dia => {
            const vacacionesDia = getVacacionesPorDia(dia);
            const esFinDeSemana = isWeekend(dia);
            const esHoyDia = esHoy(dia);
            
            return (
              <div
                key={dia.toISOString()}
                className={`min-h-[120px] p-2 border-2 rounded-lg transition-all duration-200 ${
                  esFinDeSemana 
                    ? 'bg-gray-50 border-gray-200' 
                    : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-md'
                } ${
                  esHoyDia ? 'ring-2 ring-blue-500 ring-offset-2 bg-blue-50' : ''
                }`}
              >
                <div className={`text-sm font-bold mb-2 ${
                  esHoyDia 
                    ? 'text-blue-600 bg-blue-100 rounded-full w-7 h-7 flex items-center justify-center' 
                    : esFinDeSemana 
                      ? 'text-gray-500' 
                      : 'text-gray-800'
                }`}>
                  {format(dia, 'd')}
                </div>
                
                <div className="space-y-1.5 max-h-[85px] overflow-y-auto">
                  {vacacionesDia.map(vacacion => (
                    <div
                      key={vacacion.id}
                      className={`text-xs p-1.5 rounded-md border-l-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer ${getColorVacacion(vacacion.estado)}`}
                      title={`${vacacion.empleado.nombre} ${vacacion.empleado.apellido} - ${vacacion.estado} - ${format(parseDateString(vacacion.fechaInicio), 'dd/MM/yyyy')} a ${format(parseDateString(vacacion.fechaFin), 'dd/MM/yyyy')}`}
                    >
                      <div className="font-semibold truncate">
                        {vacacion.empleado.nombre.split(' ')[0]} {vacacion.empleado.apellido.split(' ')[0]}
                      </div>
                      <div className="text-[10px] opacity-80 mt-0.5">
                        {vacacion.diasSolicitados} día{vacacion.diasSolicitados !== 1 ? 's' : ''}
                      </div>
                    </div>
                  ))}
                  {vacacionesDia.length === 0 && (
                    <div className="text-[10px] text-gray-400 text-center py-1">
                      -
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando calendario...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header mejorado */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg p-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold text-white mb-1">Calendario de Vacaciones</h2>
            <p className="text-blue-100 text-sm">
              {format(currentMonth, 'MMMM yyyy', { locale: es })}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
              className="bg-white hover:bg-gray-50"
            >
              ← Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth(new Date())}
              className="bg-white hover:bg-gray-50"
            >
              Hoy
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
              className="bg-white hover:bg-gray-50"
            >
              Siguiente →
            </Button>
            <input
              type="month"
              value={format(currentMonth, 'yyyy-MM')}
              onChange={(e) => {
                const value = e.target.value;
                if (value) {
                  const [year, month] = value.split('-').map(Number);
                  setCurrentMonth(new Date(year, (month ?? 1) - 1, 1));
                }
              }}
              className="border rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 shadow-sm"
            />
            <Button 
              onClick={handleCrearVacacion}
              className="bg-white text-blue-600 hover:bg-blue-50 font-semibold shadow-md"
            >
              ➕ Nueva Solicitud
            </Button>
          </div>
        </div>
      </div>

      {/* Filtros mejorados */}
      <Card className="mb-6 shadow-md">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="filtro-estado" className="font-semibold text-gray-700">Estado:</Label>
              <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                <SelectTrigger id="filtro-estado" className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                  <SelectItem value="APROBADA">Aprobada</SelectItem>
                  <SelectItem value="RECHAZADA">Rechazada</SelectItem>
                  <SelectItem value="CANCELADA">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="filtro-departamento" className="font-semibold text-gray-700">Departamento:</Label>
              <Select value={filtroDepartamento} onValueChange={setFiltroDepartamento}>
                <SelectTrigger id="filtro-departamento" className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {departamentosUnicos.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setFiltroEstado('todos');
                setFiltroDepartamento('todos');
              }}
              className="ml-auto"
            >
              🧹 Limpiar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Calendario mejorado */}
      <Card className="shadow-lg">
        <CardContent className="p-6">
          {renderCalendario()}
        </CardContent>
      </Card>

      {/* Lista de vacaciones - Mostrar todas, no solo las del mes */}
      <Card>
        <CardHeader>
          <CardTitle>Vacaciones de {format(currentMonth, 'MMMM yyyy', { locale: es })}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.isArray(vacaciones) ? vacaciones.map((vacacion) => (
              <div
                key={vacacion.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center space-x-4">
                  <div>
                    <div className="font-medium">
                      {vacacion.empleado.nombre} {vacacion.empleado.apellido}
                    </div>
                    <div className="text-sm text-gray-600">
                      {format(parseDateString(vacacion.fechaInicio), 'dd/MM/yyyy')} - {format(parseDateString(vacacion.fechaFin), 'dd/MM/yyyy')}
                    </div>
                  </div>
                  {getEstadoBadge(vacacion.estado)}
                </div>
                
                <div className="flex space-x-2">
                  {vacacion.estado === 'PENDIENTE' && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleAprobar(vacacion.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        ✅ Aprobar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRechazar(vacacion.id)}
                      >
                        ❌ Rechazar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCancelar(vacacion.id)}
                      >
                        🚫 Cancelar
                      </Button>
                    </>
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleEliminar(vacacion.id)}
                    className="bg-red-600 hover:bg-red-700"
                    title="Eliminar vacación (solo para corrección de errores)"
                  >
                    🗑️ Eliminar
                  </Button>
                </div>
              </div>
            )) : (
              <div className="text-center text-gray-500 py-4">
                No hay vacaciones para mostrar
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Leyenda mejorada */}
      <Card className="shadow-md">
        <CardHeader className="bg-gray-50">
          <CardTitle className="text-lg font-semibold">Leyenda</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-3 p-2 rounded-lg bg-yellow-50 border border-yellow-200">
              <div className="w-5 h-5 bg-yellow-50 border-2 border-yellow-500 rounded shadow-sm"></div>
              <span className="text-sm font-medium text-gray-700">Pendiente</span>
            </div>
            <div className="flex items-center space-x-3 p-2 rounded-lg bg-green-50 border border-green-200">
              <div className="w-5 h-5 bg-green-50 border-2 border-green-500 rounded shadow-sm"></div>
              <span className="text-sm font-medium text-gray-700">Aprobada</span>
            </div>
            <div className="flex items-center space-x-3 p-2 rounded-lg bg-red-50 border border-red-200">
              <div className="w-5 h-5 bg-red-50 border-2 border-red-500 rounded shadow-sm"></div>
              <span className="text-sm font-medium text-gray-700">Rechazada</span>
            </div>
            <div className="flex items-center space-x-3 p-2 rounded-lg bg-gray-50 border border-gray-200">
              <div className="w-5 h-5 bg-gray-50 border-2 border-gray-400 rounded shadow-sm"></div>
              <span className="text-sm font-medium text-gray-700">Cancelada</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal para crear solicitud */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nueva Solicitud de Vacaciones</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="empleadoId">Empleado *</Label>
              <Select
                value={formData.empleadoId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, empleadoId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar empleado" />
                </SelectTrigger>
                <SelectContent>
                  {empleados.map((empleado) => (
                    <SelectItem key={empleado.id} value={empleado.id}>
                      {empleado.nombre} {empleado.apellido} - {empleado.departamento}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fechaInicio">Fecha de Inicio *</Label>
                <Input
                  id="fechaInicio"
                  type="date"
                  value={formData.fechaInicio}
                  onChange={(e) => setFormData(prev => ({ ...prev, fechaInicio: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="fechaFin">Fecha de Fin *</Label>
                <Input
                  id="fechaFin"
                  type="date"
                  value={formData.fechaFin}
                  onChange={(e) => setFormData(prev => ({ ...prev, fechaFin: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="observaciones">Observaciones</Label>
              <Textarea
                id="observaciones"
                value={formData.observaciones}
                onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
                placeholder="Motivo de la solicitud..."
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                Crear Solicitud
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VacacionesCalendarAdvanced;
