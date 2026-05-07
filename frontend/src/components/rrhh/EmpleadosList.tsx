import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { empleadosService } from '@/services/empleados.service';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Empleado {
  id: string;
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  departamento: string;
  estado: 'ACTIVO' | 'INACTIVO';
  fechaIngreso: string;
  diasDisponibles: number;
  diasBase2023?: number | null;
  vacaciones: Array<{
    id: string;
    estado: string;
    fechaInicio: string;
    fechaFin: string;
  }>;
  licencias: Array<{
    id: string;
    tipo: string;
    fechaInicio: string;
    fechaFin: string;
  }>;
  documentos: Array<{
    id: string;
    nombreArchivo: string;
    tipoArchivo: string;
  }>;
}

interface EmpleadosListProps {
  filtros: {
    departamento: string;
    estado: string;
    search: string;
  };
}

const EmpleadosList: React.FC<EmpleadosListProps> = ({ filtros }) => {
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [departamentos, setDepartamentos] = useState<Array<{id: number, nombre: string}>>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState<Empleado | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    dni: '',
    email: '',
    departamento: '',
    fechaIngreso: '',
    diasDisponibles: 0,
  });

  useEffect(() => {
    cargarEmpleados();
    cargarDepartamentos();
  }, [filtros]);

  const cargarEmpleados = async () => {
    try {
      setLoading(true);
      const response = await empleadosService.getEmpleados(filtros);
      setEmpleados(response.data);
    } catch (error) {
      console.error('Error al cargar empleados:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarDepartamentos = async () => {
    try {
      const response = await empleadosService.getDepartamentos();
      setDepartamentos(response.data);
    } catch (error) {
      console.error('Error al cargar departamentos:', error);
    }
  };

  const handleCrearEmpleado = () => {
    setFormData({
      nombre: '',
      apellido: '',
      dni: '',
      email: '',
      departamento: '',
      fechaIngreso: '',
      diasDisponibles: 0,
    });
    setEmpleadoSeleccionado(null);
    setError(null);
    setSuccess(null);
    setShowModal(true);
  };

  const handleEditarEmpleado = (empleado: Empleado) => {
    setFormData({
      nombre: empleado.nombre,
      apellido: empleado.apellido,
      dni: empleado.dni,
      email: empleado.email,
      departamento: empleado.departamento,
      fechaIngreso: empleado.fechaIngreso.split('T')[0],
      diasDisponibles: empleado.diasDisponibles,
    });
    setEmpleadoSeleccionado(empleado);
    setError(null);
    setSuccess(null);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    try {
      if (empleadoSeleccionado) {
        await empleadosService.updateEmpleado(empleadoSeleccionado.id, formData);
        setSuccess('Empleado actualizado exitosamente');
      } else {
        await empleadosService.createEmpleado(formData);
        setSuccess('Empleado creado exitosamente');
      }
      setShowModal(false);
      cargarEmpleados();
      
      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      console.error('Error al guardar empleado:', error);
      const errorMessage = error.response?.data?.error || 'Error al guardar empleado';
      setError(errorMessage);
    }
  };

  const handleEliminarEmpleado = async (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este empleado?')) {
      try {
        await empleadosService.deleteEmpleado(id);
        cargarEmpleados();
      } catch (error) {
        console.error('Error al eliminar empleado:', error);
      }
    }
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'ACTIVO':
        return <Badge variant="default" className="bg-green-100 text-green-800">Activo</Badge>;
      case 'INACTIVO':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Inactivo</Badge>;
      default:
        return <Badge variant="outline">{estado}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando empleados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mensajes de error y éxito */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          <strong>Éxito:</strong> {success}
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Empleados</h2>
        <Button onClick={handleCrearEmpleado}>
          ➕ Nuevo Empleado
        </Button>
      </div>

      {/* Lista de empleados */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {empleados && empleados.length > 0 ? empleados.map((empleado) => (
          <Card key={empleado.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">
                    {empleado.nombre} {empleado.apellido}
                  </CardTitle>
                  <p className="text-sm text-gray-600">{empleado.email}</p>
                </div>
                {getEstadoBadge(empleado.estado)}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="font-medium">DNI:</span> {empleado.dni}
                </div>
                <div>
                  <span className="font-medium">Depto:</span> {empleado.departamento}
                </div>
                <div>
                  <span className="font-medium">Ingreso:</span> {empleado.fechaIngreso && !isNaN(new Date(empleado.fechaIngreso).getTime()) ? format(new Date(empleado.fechaIngreso), 'dd/MM/yyyy', { locale: es }) : 'N/A'}
                </div>
                <div>
                  <span className="font-medium">Días disp:</span> {empleado.diasDisponibles}
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t">
                <div className="flex space-x-1">
                  <Badge variant="outline" className="text-xs">
                    📅 {empleado.vacaciones.length} vacaciones
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    📋 {empleado.licencias.length} licencias
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    📁 {empleado.documentos.length} docs
                  </Badge>
                </div>
              </div>

              <div className="flex space-x-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEditarEmpleado(empleado)}
                  className="flex-1"
                >
                  ✏️ Editar
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleEliminarEmpleado(empleado.id)}
                  className="flex-1"
                >
                  🗑️ Eliminar
                </Button>
              </div>
            </CardContent>
          </Card>
        )) : (
          <div className="col-span-full">
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-gray-500">Cargando empleados...</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {empleados && empleados.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">No se encontraron empleados con los filtros aplicados</p>
          </CardContent>
        </Card>
      )}

      {/* Modal para crear/editar empleado */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {empleadoSeleccionado ? 'Editar Empleado' : 'Nuevo Empleado'}
            </DialogTitle>
            <DialogDescription>
              {empleadoSeleccionado ? 'Modifica los datos del empleado seleccionado' : 'Completa los datos para crear un nuevo empleado'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Mensaje de error en el modal */}
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                <strong>Error:</strong> {error}
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nombre">Nombre *</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="apellido">Apellido *</Label>
                <Input
                  id="apellido"
                  value={formData.apellido}
                  onChange={(e) => setFormData(prev => ({ ...prev, apellido: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dni">DNI *</Label>
                <Input
                  id="dni"
                  value={formData.dni}
                  onChange={(e) => setFormData(prev => ({ ...prev, dni: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="departamento">Departamento *</Label>
                <Select
                  value={formData.departamento}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, departamento: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar departamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {departamentos && departamentos.length > 0 ? departamentos.map((dept) => (
                      <SelectItem key={dept.id} value={dept.nombre}>{dept.nombre}</SelectItem>
                    )) : (
                      <SelectItem value="Sin departamentos" disabled>Sin departamentos</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="diasDisponibles">Días Disponibles *</Label>
                <Input
                  id="diasDisponibles"
                  type="number"
                  min="0"
                  value={formData.diasDisponibles}
                  onChange={(e) => setFormData(prev => ({ ...prev, diasDisponibles: parseInt(e.target.value) || 0 }))}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Días disponibles totales (se descontarán al aprobar vacaciones)
                </p>
              </div>
            </div>

            <div>
              <Label htmlFor="fechaIngreso">Fecha de Ingreso *</Label>
              <Input
                id="fechaIngreso"
                type="date"
                value={formData.fechaIngreso}
                onChange={(e) => setFormData(prev => ({ ...prev, fechaIngreso: e.target.value }))}
                required
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {empleadoSeleccionado ? 'Actualizar' : 'Crear'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmpleadosList;
