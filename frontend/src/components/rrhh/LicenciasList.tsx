import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { licenciasService } from '@/services/licencias.service';
import { empleadosService } from '@/services/empleados.service';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

// Función helper para parsear fechas sin problemas de zona horaria
const parseDateString = (dateString: string): Date => {
  if (!dateString) {
    return new Date();
  }
  
  // Si la fecha viene como YYYY-MM-DD, la parseamos manualmente
  // para evitar problemas de zona horaria
  if (dateString.includes('-') && dateString.split('-').length === 3) {
    const [year, month, day] = dateString.split('-').map(Number);
    if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
      return new Date(year, month - 1, day); // month es 0-indexed en JavaScript
    }
  }
  
  // Si es formato ISO completo (YYYY-MM-DDTHH:mm:ss.sssZ), extraer solo la fecha
  if (dateString.includes('T')) {
    const datePart = dateString.split('T')[0];
    const [year, month, day] = datePart.split('-').map(Number);
    if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
      return new Date(year, month - 1, day);
    }
  }
  
  // Si no es formato YYYY-MM-DD, intentar parsear con parseISO
  try {
    const parsed = parseISO(dateString);
    if (!isNaN(parsed.getTime())) {
      // Extraer solo la fecha sin hora
      const year = parsed.getFullYear();
      const month = parsed.getMonth();
      const day = parsed.getDate();
      return new Date(year, month, day);
    }
  } catch (error) {
    console.warn('Error parsing date:', dateString, error);
  }
  
  // Fallback: fecha actual
  return new Date();
};

interface Licencia {
  id: string;
  empleadoId: string;
  tipo: string;
  fechaInicio: string;
  fechaFin: string;
  observaciones?: string;
  empleado: {
    id: string;
    nombre: string;
    apellido: string;
    departamento: string;
  };
}

interface LicenciasListProps {
  filtros: {
    departamento: string;
    estado: string;
    search: string;
  };
}

const LicenciasList: React.FC<LicenciasListProps> = ({ filtros }) => {
  const [licencias, setLicencias] = useState<Licencia[]>([]);
  const [licenciasFiltradas, setLicenciasFiltradas] = useState<Licencia[]>([]);
  const [empleados, setEmpleados] = useState<any[]>([]);
  const [tiposLicencia, setTiposLicencia] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [licenciaSeleccionada, setLicenciaSeleccionada] = useState<Licencia | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [filtrosLocales, setFiltrosLocales] = useState({
    tipo: 'todos',
    empleado: 'todos',
    fechaInicio: '',
    fechaFin: ''
  });
  const [formData, setFormData] = useState({
    empleadoId: '',
    tipo: '',
    fechaInicio: '',
    fechaFin: '',
    observaciones: ''
  });

  useEffect(() => {
    cargarLicencias();
    cargarEmpleados();
    cargarTiposLicencia();
  }, [filtros]);

  // Aplicar filtros locales
  useEffect(() => {
    let licenciasFiltradas = [...licencias];

    // Filtro por tipo
    if (filtrosLocales.tipo !== 'todos') {
      licenciasFiltradas = licenciasFiltradas.filter(lic => lic.tipo === filtrosLocales.tipo);
    }

    // Filtro por empleado
    if (filtrosLocales.empleado !== 'todos') {
      licenciasFiltradas = licenciasFiltradas.filter(lic => lic.empleadoId === filtrosLocales.empleado);
    }

    // Filtro por fechas
    if (filtrosLocales.fechaInicio) {
      licenciasFiltradas = licenciasFiltradas.filter(lic => 
        new Date(lic.fechaInicio) >= new Date(filtrosLocales.fechaInicio)
      );
    }

    if (filtrosLocales.fechaFin) {
      licenciasFiltradas = licenciasFiltradas.filter(lic => 
        new Date(lic.fechaFin) <= new Date(filtrosLocales.fechaFin)
      );
    }

    setLicenciasFiltradas(licenciasFiltradas);
  }, [licencias, filtrosLocales]);

  const cargarLicencias = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await licenciasService.getLicencias({});
      setLicencias(response.data || []);
    } catch (error: any) {
      console.error('Error al cargar licencias:', error);
      setError('Error al cargar las licencias. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const cargarEmpleados = async () => {
    try {
      const response = await empleadosService.getEmpleados();
      setEmpleados(response.data);
    } catch (error) {
      console.error('Error al cargar empleados:', error);
    }
  };

  const cargarTiposLicencia = async () => {
    try {
      const response = await licenciasService.getTiposLicencia();
      setTiposLicencia(response.data);
    } catch (error) {
      console.error('Error al cargar tipos de licencia:', error);
    }
  };

  const handleCrearLicencia = () => {
    setFormData({
      empleadoId: '',
      tipo: '',
      fechaInicio: '',
      fechaFin: '',
      observaciones: ''
    });
    setLicenciaSeleccionada(null);
    setError(null);
    setSuccess(null);
    setShowModal(true);
  };

  const handleEditarLicencia = (licencia: Licencia) => {
    // Las fechas ahora vienen en formato YYYY-MM-DD directamente desde el backend
    const fechaInicioFormatted = licencia.fechaInicio.includes('T') 
      ? licencia.fechaInicio.split('T')[0] 
      : licencia.fechaInicio;
    const fechaFinFormatted = licencia.fechaFin.includes('T') 
      ? licencia.fechaFin.split('T')[0] 
      : licencia.fechaFin;
      
    setFormData({
      empleadoId: licencia.empleadoId,
      tipo: licencia.tipo,
      fechaInicio: fechaInicioFormatted,
      fechaFin: fechaFinFormatted,
      observaciones: licencia.observaciones || ''
    });
    setLicenciaSeleccionada(licencia);
    setError(null);
    setSuccess(null);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    try {
      if (licenciaSeleccionada) {
        await licenciasService.updateLicencia(licenciaSeleccionada.id, formData);
        setSuccess('Licencia actualizada exitosamente');
      } else {
        await licenciasService.createLicencia(formData);
        setSuccess('Licencia creada exitosamente');
      }
      setShowModal(false);
      cargarLicencias();
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      console.error('Error al guardar licencia:', error);
      const errorMessage = error.response?.data?.message || 'Error al guardar la licencia';
      setError(errorMessage);
    }
  };

  const handleEliminarLicencia = async (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta licencia?')) {
      try {
        setError(null);
        await licenciasService.deleteLicencia(id);
        setSuccess('Licencia eliminada exitosamente');
        cargarLicencias();
        setTimeout(() => setSuccess(null), 3000);
      } catch (error: any) {
        console.error('Error al eliminar licencia:', error);
        const errorMessage = error.response?.data?.message || 'Error al eliminar la licencia';
        setError(errorMessage);
      }
    }
  };

  const limpiarFiltros = () => {
    setFiltrosLocales({
      tipo: 'todos',
      empleado: 'todos',
      fechaInicio: '',
      fechaFin: ''
    });
  };

  const getTipoBadge = (tipo: string) => {
    const colores: { [key: string]: string } = {
      'Enfermedad': 'bg-red-100 text-red-800',
      'Maternidad': 'bg-pink-100 text-pink-800',
      'Paternidad': 'bg-blue-100 text-blue-800',
      'Duelo': 'bg-gray-100 text-gray-800',
      'Estudios': 'bg-green-100 text-green-800',
      'Personal': 'bg-yellow-100 text-yellow-800',
      'Otro': 'bg-purple-100 text-purple-800'
    };

    return (
      <Badge variant="outline" className={colores[tipo] || 'bg-gray-100 text-gray-800'}>
        {tipo}
      </Badge>
    );
  };

  const calcularDiasTotales = (fechaInicio: string, fechaFin: string) => {
    if (!fechaInicio || !fechaFin) return 0;
    
    const inicio = parseDateString(fechaInicio);
    const fin = parseDateString(fechaFin);
    
    // Validar que las fechas sean válidas
    if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
      return 0;
    }
    
    const diffTime = Math.abs(fin.getTime() - inicio.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando licencias...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Licencias Especiales</h2>
        <Button onClick={handleCrearLicencia}>
          ➕ Nueva Licencia
        </Button>
      </div>

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

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="filtro-tipo">Tipo de Licencia</Label>
              <Select
                value={filtrosLocales.tipo}
                onValueChange={(value) => setFiltrosLocales(prev => ({ ...prev, tipo: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos los tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {tiposLicencia.map((tipo) => (
                    <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="filtro-empleado">Empleado</Label>
              <Select
                value={filtrosLocales.empleado}
                onValueChange={(value) => setFiltrosLocales(prev => ({ ...prev, empleado: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos los empleados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {empleados.map((empleado) => (
                    <SelectItem key={empleado.id} value={empleado.id}>
                      {empleado.nombre} {empleado.apellido}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="fecha-inicio">Fecha Inicio</Label>
              <Input
                id="fecha-inicio"
                type="date"
                value={filtrosLocales.fechaInicio}
                onChange={(e) => setFiltrosLocales(prev => ({ ...prev, fechaInicio: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="fecha-fin">Fecha Fin</Label>
              <Input
                id="fecha-fin"
                type="date"
                value={filtrosLocales.fechaFin}
                onChange={(e) => setFiltrosLocales(prev => ({ ...prev, fechaFin: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={limpiarFiltros}>
              🧹 Limpiar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de licencias */}
      <div className="space-y-4">
        {licenciasFiltradas.map((licencia) => (
          <Card key={licencia.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">
                    {licencia.empleado.nombre} {licencia.empleado.apellido}
                  </CardTitle>
                  <p className="text-sm text-gray-600">{licencia.empleado.departamento}</p>
                </div>
                {getTipoBadge(licencia.tipo)}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Inicio:</span><br />
                          {licencia.fechaInicio ? (() => {
                            try {
                              const fecha = parseDateString(licencia.fechaInicio);
                              return isNaN(fecha.getTime()) ? 'Fecha inválida' : format(fecha, 'dd/MM/yyyy', { locale: es });
                            } catch (error) {
                              return 'Fecha inválida';
                            }
                          })() : 'N/A'}
                        </div>
                        <div>
                          <span className="font-medium">Fin:</span><br />
                          {licencia.fechaFin ? (() => {
                            try {
                              const fecha = parseDateString(licencia.fechaFin);
                              return isNaN(fecha.getTime()) ? 'Fecha inválida' : format(fecha, 'dd/MM/yyyy', { locale: es });
                            } catch (error) {
                              return 'Fecha inválida';
                            }
                          })() : 'N/A'}
                        </div>
                <div>
                  <span className="font-medium">Días totales:</span><br />
                  {calcularDiasTotales(licencia.fechaInicio, licencia.fechaFin)}
                </div>
                <div>
                  <span className="font-medium">Tipo:</span><br />
                  {licencia.tipo}
                </div>
              </div>

              {licencia.observaciones && (
                <div className="pt-2 border-t">
                  <span className="font-medium">Observaciones:</span>
                  <p className="text-sm text-gray-600 mt-1">{licencia.observaciones}</p>
                </div>
              )}

              <div className="flex space-x-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEditarLicencia(licencia)}
                >
                  ✏️ Editar
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleEliminarLicencia(licencia.id)}
                >
                  🗑️ Eliminar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {licenciasFiltradas.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">
              {licencias.length === 0 ? 'No se encontraron licencias' : 'No hay licencias que coincidan con los filtros'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Modal para crear/editar licencia */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {licenciaSeleccionada ? 'Editar Licencia' : 'Nueva Licencia'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Mensajes de error y éxito en el modal */}
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

            <div>
              <Label htmlFor="tipo">Tipo de Licencia *</Label>
              <Select
                value={formData.tipo}
                onValueChange={(value) => setFormData(prev => ({ ...prev, tipo: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {tiposLicencia.map((tipo) => (
                    <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
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
                placeholder="Detalles adicionales sobre la licencia..."
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {licenciaSeleccionada ? 'Actualizar' : 'Crear'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LicenciasList;
