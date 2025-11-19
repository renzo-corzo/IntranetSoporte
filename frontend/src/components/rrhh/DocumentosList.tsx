import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { documentosService } from '@/services/documentos.service';
import { empleadosService } from '@/services/empleados.service';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Documento {
  id: string;
  empleadoId: string;
  nombreArchivo: string;
  tipoArchivo?: string;
  urlArchivo: string;
  createdAt: string;
  empleado: {
    id: string;
    nombre: string;
    apellido: string;
    departamento: string;
  };
}

interface DocumentosListProps {
  filtros: {
    departamento: string;
    estado: string;
    search: string;
  };
}

const DocumentosList: React.FC<DocumentosListProps> = ({ filtros }) => {
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [empleados, setEmpleados] = useState<any[]>([]);
  const [tiposDocumento, setTiposDocumento] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState<any>(null);
  const [formData, setFormData] = useState({
    empleadoId: '',
    tipoArchivo: '',
    archivo: null as File | null
  });

  useEffect(() => {
    cargarEmpleados();
    cargarTiposDocumento();
  }, []);

  const cargarEmpleados = async () => {
    try {
      setLoading(true);
      const response = await empleadosService.getEmpleados();
      setEmpleados(response.data);
    } catch (error) {
      console.error('Error al cargar empleados:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarTiposDocumento = async () => {
    try {
      const response = await documentosService.getTiposDocumento();
      setTiposDocumento(response.data);
    } catch (error) {
      console.error('Error al cargar tipos de documento:', error);
    }
  };

  const cargarDocumentosEmpleado = async (empleadoId: string) => {
    try {
      const response = await documentosService.getDocumentosEmpleado(empleadoId);
      setDocumentos(response.data);
    } catch (error) {
      console.error('Error al cargar documentos:', error);
    }
  };

  const handleSeleccionarEmpleado = (empleado: any) => {
    setEmpleadoSeleccionado(empleado);
    cargarDocumentosEmpleado(empleado.id);
  };

  const handleSubirDocumento = () => {
    if (!empleadoSeleccionado) {
      alert('Por favor selecciona un empleado primero');
      return;
    }
    setFormData({
      empleadoId: empleadoSeleccionado.id,
      tipoArchivo: '',
      archivo: null
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.archivo) {
      alert('Por favor selecciona un archivo');
      return;
    }

    try {
      await documentosService.uploadDocumento(
        formData.empleadoId,
        formData.archivo,
        formData.tipoArchivo
      );
      setShowModal(false);
      cargarDocumentosEmpleado(formData.empleadoId);
    } catch (error) {
      console.error('Error al subir documento:', error);
    }
  };

  const handleDescargar = async (documento: Documento) => {
    try {
      const blob = await documentosService.downloadDocumento(documento.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = documento.nombreArchivo;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error al descargar documento:', error);
    }
  };

  const handleEliminar = async (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este documento?')) {
      try {
        await documentosService.deleteDocumento(id);
        if (empleadoSeleccionado) {
          cargarDocumentosEmpleado(empleadoSeleccionado.id);
        }
      } catch (error) {
        console.error('Error al eliminar documento:', error);
      }
    }
  };

  const getTipoBadge = (tipo?: string) => {
    if (!tipo) return <Badge variant="outline">Sin tipo</Badge>;

    const colores: { [key: string]: string } = {
      'DNI': 'bg-blue-100 text-blue-800',
      'CONTRATO': 'bg-green-100 text-green-800',
      'CERTIFICADO_MEDICO': 'bg-red-100 text-red-800',
      'CERTIFICADO_ESTUDIOS': 'bg-purple-100 text-purple-800',
      'OTRO': 'bg-gray-100 text-gray-800'
    };

    return (
      <Badge variant="outline" className={colores[tipo] || 'bg-gray-100 text-gray-800'}>
        {tipo.replace('_', ' ')}
      </Badge>
    );
  };

  const getIconoArchivo = (nombreArchivo: string) => {
    const extension = nombreArchivo.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return '📄';
      case 'doc':
      case 'docx':
        return '📝';
      case 'jpg':
      case 'jpeg':
      case 'png':
        return '🖼️';
      default:
        return '📎';
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Documentos</h2>
        {empleadoSeleccionado && (
          <Button onClick={handleSubirDocumento}>
            📁 Subir Documento
          </Button>
        )}
      </div>

      {/* Selección de empleado */}
      <Card>
        <CardHeader>
          <CardTitle>Seleccionar Empleado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {empleados.map((empleado) => (
              <Card
                key={empleado.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  empleadoSeleccionado?.id === empleado.id
                    ? 'ring-2 ring-blue-500 bg-blue-50'
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => handleSeleccionarEmpleado(empleado)}
              >
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-lg font-semibold">
                      {empleado.nombre} {empleado.apellido}
                    </div>
                    <div className="text-sm text-gray-600">{empleado.departamento}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {empleado.documentos?.length || 0} documentos
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Lista de documentos del empleado seleccionado */}
      {empleadoSeleccionado && (
        <Card>
          <CardHeader>
            <CardTitle>
              Documentos de {empleadoSeleccionado.nombre} {empleadoSeleccionado.apellido}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {documentos.length > 0 ? (
              <div className="space-y-3">
                {documentos.map((documento) => (
                  <div
                    key={documento.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{getIconoArchivo(documento.nombreArchivo)}</span>
                      <div>
                        <div className="font-medium">{documento.nombreArchivo}</div>
                        <div className="text-sm text-gray-500">
                          {format(new Date(documento.createdAt), 'dd/MM/yyyy HH:mm', { locale: es })}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getTipoBadge(documento.tipoArchivo)}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDescargar(documento)}
                      >
                        📥 Descargar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleEliminar(documento.id)}
                      >
                        🗑️ Eliminar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No hay documentos para este empleado</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Modal para subir documento */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Subir Documento</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="tipoArchivo">Tipo de Documento</Label>
              <Select
                value={formData.tipoArchivo}
                onValueChange={(value) => setFormData(prev => ({ ...prev, tipoArchivo: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {tiposDocumento.map((tipo) => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="archivo">Archivo *</Label>
              <Input
                id="archivo"
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  archivo: e.target.files?.[0] || null 
                }))}
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Formatos permitidos: PDF, DOC, DOCX, JPG, JPEG, PNG (máximo 10MB)
              </p>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={!formData.archivo}>
                📁 Subir
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DocumentosList;
