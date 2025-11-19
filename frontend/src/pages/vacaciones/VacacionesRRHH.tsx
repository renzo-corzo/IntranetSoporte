import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, momentLocalizer, Views } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '../../components/calendar.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Edit, Trash2, Filter, X } from 'lucide-react';
import { toast } from 'sonner';
import { apiVacaciones } from '@/apiVacaciones';
import { apiEmpleados } from '@/apiEmpleados';
import { Switch } from '@/components/ui/switch';

// Configurar moment para español
moment.locale('es');
const localizer = momentLocalizer(moment);

interface Empleado {
  id: number;
  nombre: string;
  departamento: string;
  activo: boolean;
}

interface Vacacion {
  id: number;
  solicitanteId: number;
  empleadoId?: number;
  fechaInicio: string;
  fechaFin: string;
  diasSolicitados: number;
  comentario?: string;
  estado: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA' | 'CANCELADA';
  solicitante?: Empleado;
  empleado?: Empleado;
  decididoPor?: Empleado;
  comentarioDecision?: string;
  decididoEn?: string;
  creadoEn: string;
}

interface EventoCalendario {
  id: number;
  title: string;
  start: Date;
  end: Date;
  resource: Vacacion;
}

const VacacionesRRHH: React.FC = () => {
  const [vacaciones, setVacaciones] = useState<Vacacion[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    empleado: '',
    departamento: '',
    estado: ''
  });
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalEdicion, setModalEdicion] = useState(false);
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState<Vacacion | null>(null);
  const [formulario, setFormulario] = useState({
    empleadoId: '',
    fechaInicio: '',
    fechaFin: '',
    comentario: '',
    estado: 'PENDIENTE',
    ignorarSolapamientos: false
  });

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [vacacionesData, empleadosData] = await Promise.all([
        apiVacaciones.listarTodas({ page: 1, limit: 1000 }),
        apiEmpleados.listar()
      ]);
      
      setVacaciones(vacacionesData.data || []);
      setEmpleados(empleadosData.data || []);
    } catch (error) {
      console.error('Error cargando datos:', error);
      toast.error('Error cargando datos');
    } finally {
      setLoading(false);
    }
  };

  // Aplicar filtros
  const vacacionesFiltradas = useMemo(() => {
    return vacaciones.filter(vacacion => {
      const cumpleEmpleado = !filtros.empleado || 
        (vacacion.empleadoId && vacacion.empleadoId.toString() === filtros.empleado) ||
        (vacacion.solicitanteId && vacacion.solicitanteId.toString() === filtros.empleado);
      
      const cumpleDepartamento = !filtros.departamento || 
        (vacacion.empleado?.departamento === filtros.departamento) ||
        (vacacion.solicitante?.departamento === filtros.departamento);
      
      const cumpleEstado = !filtros.estado || vacacion.estado === filtros.estado;
      
      return cumpleEmpleado && cumpleDepartamento && cumpleEstado;
    });
  }, [vacaciones, filtros]);

  // Convertir vacaciones a eventos del calendario
  const eventos = useMemo(() => {
    return vacacionesFiltradas.map(vacacion => ({
      id: vacacion.id,
      title: `${vacacion.empleado?.nombre || vacacion.solicitante?.nombre || 'Empleado'} (${vacacion.diasSolicitados} días)`,
      start: new Date(vacacion.fechaInicio),
      end: new Date(vacacion.fechaFin),
      resource: vacacion,
      'data-estado': vacacion.estado
    }));
  }, [vacacionesFiltradas]);

  // Obtener departamentos únicos
  const departamentos = useMemo(() => {
    const deptos = [...new Set(empleados.map(e => e.departamento))];
    return deptos.sort();
  }, [empleados]);

  // Manejar selección de evento
  const handleSelectEvent = (event: EventoCalendario) => {
    setSolicitudSeleccionada(event.resource);
    setFormulario({
      empleadoId: event.resource.empleadoId?.toString() || '',
      fechaInicio: moment(event.resource.fechaInicio).format('YYYY-MM-DD'),
      fechaFin: moment(event.resource.fechaFin).format('YYYY-MM-DD'),
      comentario: event.resource.comentario || '',
      estado: event.resource.estado,
      ignorarSolapamientos: false
    });
    setModalEdicion(true);
  };

  // Manejar creación de nueva solicitud
  const handleNuevaSolicitud = () => {
    setFormulario({
      empleadoId: '',
      fechaInicio: '',
      fechaFin: '',
      comentario: '',
      estado: 'PENDIENTE',
      ignorarSolapamientos: false
    });
    setModalAbierto(true);
  };

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (modalEdicion && solicitudSeleccionada) {
        // Actualizar solicitud existente
        await apiVacaciones.actualizarSolicitud(solicitudSeleccionada.id, {
          empleadoId: formulario.empleadoId ? Number(formulario.empleadoId) : undefined,
          fechaInicio: formulario.fechaInicio,
          fechaFin: formulario.fechaFin,
          comentario: formulario.comentario,
          estado: formulario.estado
        });
        toast.success('Solicitud actualizada correctamente');
      } else {
        // Crear nueva solicitud
        await apiVacaciones.crearSolicitudAdmin({
          empleadoId: Number(formulario.empleadoId),
          fechaInicio: formulario.fechaInicio,
          fechaFin: formulario.fechaFin,
          comentario: formulario.comentario,
          estado: formulario.estado,
          ignorarSolapamientos: formulario.ignorarSolapamientos
        });
        toast.success('Solicitud creada correctamente');
      }
      
      setModalAbierto(false);
      setModalEdicion(false);
      setSolicitudSeleccionada(null);
      cargarDatos();
    } catch (error: any) {
      console.error('Error guardando solicitud:', error);
      toast.error(error.response?.data?.message || 'Error guardando solicitud');
    }
  };

  // Manejar eliminación
  const handleEliminar = async (id: number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta solicitud?')) return;
    
    try {
      await apiVacaciones.eliminarSolicitud(id);
      toast.success('Solicitud eliminada correctamente');
      cargarDatos();
    } catch (error: any) {
      console.error('Error eliminando solicitud:', error);
      toast.error(error.response?.data?.message || 'Error eliminando solicitud');
    }
  };

  // Estilos para eventos según estado
  const getEventStyle = (event: EventoCalendario) => {
    const estado = event.resource.estado;
    let backgroundColor = '#9ca3af'; // CANCELADA / default gray
    let color = '#374151';
    switch (estado) {
      case 'PENDIENTE':
        backgroundColor = '#fcd34d'; // yellow-400
        color = '#92400e';
        break;
      case 'APROBADA':
        backgroundColor = '#34d399'; // green-400
        color = '#065f46';
        break;
      case 'RECHAZADA':
        backgroundColor = '#ef4444'; // red-500
        color = '#991b1b';
        break;
      case 'CANCELADA':
      default:
        backgroundColor = '#9ca3af';
        color = '#374151';
        break;
    }
    return {
      style: {
        backgroundColor,
        color,
        border: 'none',
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: 600,
        padding: '2px 8px',
        boxShadow: '0 1px 1px rgba(0,0,0,0.08)'
      }
    };
  };

  // Limpiar filtros
  const limpiarFiltros = () => {
    setFiltros({
      empleado: '',
      departamento: '',
      estado: ''
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Vacaciones - RRHH</h1>
          <p className="text-gray-600">Administra las vacaciones de todos los empleados</p>
        </div>
        <Button onClick={handleNuevaSolicitud} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Nueva Solicitud
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="empleado">Empleado</Label>
              <Select value={filtros.empleado} onValueChange={(value) => setFiltros(prev => ({ ...prev, empleado: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar empleado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos los empleados</SelectItem>
                  {empleados.map(empleado => (
                    <SelectItem key={empleado.id} value={empleado.id.toString()}>
                      {empleado.nombre} - {empleado.departamento}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="departamento">Departamento</Label>
              <Select value={filtros.departamento} onValueChange={(value) => setFiltros(prev => ({ ...prev, departamento: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar departamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos los departamentos</SelectItem>
                  {departamentos.map(depto => (
                    <SelectItem key={depto} value={depto}>
                      {depto}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="estado">Estado</Label>
              <Select value={filtros.estado} onValueChange={(value) => setFiltros(prev => ({ ...prev, estado: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos los estados</SelectItem>
                  <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                  <SelectItem value="APROBADA">Aprobada</SelectItem>
                  <SelectItem value="RECHAZADA">Rechazada</SelectItem>
                  <SelectItem value="CANCELADA">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button variant="outline" onClick={limpiarFiltros} className="w-full">
                <X className="w-4 h-4 mr-2" />
                Limpiar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leyenda de Estados */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <span className="text-sm font-medium text-gray-600">Estados:</span>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500 rounded"></div>
              <span className="text-sm">Pendiente</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-sm">Aprobada</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span className="text-sm">Rechazada</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-500 rounded"></div>
              <span className="text-sm">Cancelada</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendario */}
      <Card>
        <CardContent className="p-6">
          <div className="h-[600px]">
            <Calendar
              localizer={localizer}
              events={eventos}
              startAccessor="start"
              endAccessor="end"
              onSelectEvent={handleSelectEvent}
              eventPropGetter={getEventStyle}
              views={[Views.MONTH, Views.WEEK, Views.DAY]}
              defaultView={Views.MONTH}
              messages={{
                next: 'Siguiente',
                previous: 'Anterior',
                today: 'Hoy',
                month: 'Mes',
                week: 'Semana',
                day: 'Día',
                agenda: 'Agenda',
                date: 'Fecha',
                time: 'Hora',
                event: 'Evento',
                noEventsInRange: 'No hay eventos en este rango',
                showMore: (total) => `+ Ver ${total} más`
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Modal Nueva/Editar Solicitud */}
      <Dialog open={modalAbierto || modalEdicion} onOpenChange={(open) => {
        if (!open) {
          setModalAbierto(false);
          setModalEdicion(false);
          setSolicitudSeleccionada(null);
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {modalEdicion ? 'Editar Solicitud' : 'Nueva Solicitud'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="empleadoId">Empleado</Label>
              <Select 
                value={formulario.empleadoId} 
                onValueChange={(value) => setFormulario(prev => ({ ...prev, empleadoId: value }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar empleado" />
                </SelectTrigger>
                <SelectContent>
                  {empleados.map(empleado => (
                    <SelectItem key={empleado.id} value={empleado.id.toString()}>
                      {empleado.nombre} ({empleado.departamento})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fechaInicio">Fecha Inicio</Label>
                <Input
                  id="fechaInicio"
                  type="date"
                  value={formulario.fechaInicio}
                  onChange={(e) => setFormulario(prev => ({ ...prev, fechaInicio: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="fechaFin">Fecha Fin</Label>
                <Input
                  id="fechaFin"
                  type="date"
                  value={formulario.fechaFin}
                  onChange={(e) => setFormulario(prev => ({ ...prev, fechaFin: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="estado">Estado</Label>
              <Select 
                value={formulario.estado} 
                onValueChange={(value) => setFormulario(prev => ({ ...prev, estado: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                  <SelectItem value="APROBADA">Aprobada</SelectItem>
                  <SelectItem value="RECHAZADA">Rechazada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="comentario">Comentario</Label>
              <Textarea
                id="comentario"
                value={formulario.comentario}
                onChange={(e) => setFormulario(prev => ({ ...prev, comentario: e.target.value }))}
                placeholder="Comentario opcional..."
                rows={3}
              />
            </div>

            {!modalEdicion && (
              <div className="flex items-center space-x-2">
                <Switch
                  id="ignorar-solapamientos"
                  checked={formulario.ignorarSolapamientos}
                  onCheckedChange={(checked) => setFormulario(prev => ({ ...prev, ignorarSolapamientos: checked }))}
                />
                <Label htmlFor="ignorar-solapamientos">Ignorar solapamientos (solo RRHH)</Label>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => {
                setModalAbierto(false);
                setModalEdicion(false);
                setSolicitudSeleccionada(null);
              }}>
                Cancelar
              </Button>
              <Button type="submit">
                {modalEdicion ? 'Actualizar' : 'Crear'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Detalles/Edición */}
      {solicitudSeleccionada && (
        <Dialog open={modalEdicion} onOpenChange={setModalEdicion}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Detalles de la Solicitud</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-semibold">Empleado:</Label>
                  <p>{solicitudSeleccionada.empleado?.nombre || solicitudSeleccionada.solicitante?.nombre}</p>
                </div>
                <div>
                  <Label className="font-semibold">Departamento:</Label>
                  <p>{solicitudSeleccionada.empleado?.departamento || solicitudSeleccionada.solicitante?.departamento}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-semibold">Fecha Inicio:</Label>
                  <p>{moment(solicitudSeleccionada.fechaInicio).format('DD/MM/YYYY')}</p>
                </div>
                <div>
                  <Label className="font-semibold">Fecha Fin:</Label>
                  <p>{moment(solicitudSeleccionada.fechaFin).format('DD/MM/YYYY')}</p>
                </div>
              </div>

              <div>
                <Label className="font-semibold">Estado:</Label>
                <div className="mt-1">
                  <Badge variant={
                    solicitudSeleccionada.estado === 'APROBADA' ? 'default' :
                    solicitudSeleccionada.estado === 'PENDIENTE' ? 'secondary' :
                    solicitudSeleccionada.estado === 'RECHAZADA' ? 'destructive' : 'outline'
                  }>
                    {solicitudSeleccionada.estado}
                  </Badge>
                </div>
              </div>

              {solicitudSeleccionada.comentario && (
                <div>
                  <Label className="font-semibold">Comentario:</Label>
                  <p className="text-sm text-gray-600">{solicitudSeleccionada.comentario}</p>
                </div>
              )}

              {solicitudSeleccionada.decididoPor && (
                <div>
                  <Label className="font-semibold">Decidido por:</Label>
                  <p>{solicitudSeleccionada.decididoPor.nombre}</p>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setModalEdicion(false)}
                >
                  Cerrar
                </Button>
                <Button 
                  variant="destructive"
                  onClick={() => handleEliminar(solicitudSeleccionada.id)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default VacacionesRRHH;
