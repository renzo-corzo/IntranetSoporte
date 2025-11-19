import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { apiEmpleados } from '@/apiEmpleados';
import { apiVacaciones } from '@/apiVacaciones';

interface ModalNuevaSolicitudProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface Empleado {
  id: number;
  nombre: string;
  departamento: string;
  activo: boolean;
}

const ModalNuevaSolicitud: React.FC<ModalNuevaSolicitudProps> = ({ isOpen, onClose, onSuccess }) => {
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingEmpleados, setLoadingEmpleados] = useState(false);
  const [formData, setFormData] = useState({
    solicitanteId: '',
    fechaInicio: '',
    fechaFin: '',
    comentario: '',
    estado: 'PENDIENTE' as 'PENDIENTE' | 'APROBADA' | 'RECHAZADA',
    ignorarSolapamientos: false
  });

  useEffect(() => {
    if (isOpen) {
      loadEmpleados();
    }
  }, [isOpen]);

  const loadEmpleados = async () => {
    setLoadingEmpleados(true);
    try {
      const response = await apiEmpleados.listar();
      console.log('Respuesta de empleados:', response);
      
      if (response.success && Array.isArray(response.data)) {
        setEmpleados(response.data);
      } else {
        console.error('Formato de respuesta inesperado:', response);
        setEmpleados([]);
      }
    } catch (error) {
      console.error('Error al cargar empleados:', error);
      setEmpleados([]);
    } finally {
      setLoadingEmpleados(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await apiVacaciones.crearSolicitudAdmin({
        empleadoId: parseInt(formData.solicitanteId),
        fechaInicio: formData.fechaInicio,
        fechaFin: formData.fechaFin,
        comentario: formData.comentario || undefined,
        estado: formData.estado,
        ignorarSolapamientos: formData.ignorarSolapamientos
      });

      onSuccess();
      onClose();
      resetForm();
    } catch (error: any) {
      console.error('Error al crear solicitud:', error);
      alert(error.response?.data?.message || 'Error al crear la solicitud');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      solicitanteId: '',
      fechaInicio: '',
      fechaFin: '',
      comentario: '',
      estado: 'PENDIENTE',
      ignorarSolapamientos: false
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold mb-4">Nueva Solicitud de Vacaciones</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Empleado *
            </label>
            <select
              value={formData.solicitanteId}
              onChange={(e) => setFormData({ ...formData, solicitanteId: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={loadingEmpleados}
            >
              <option value="">
                {loadingEmpleados ? 'Cargando empleados...' : 'Seleccionar empleado'}
              </option>
              {empleados.filter(empleado => empleado.activo).map(empleado => (
                <option key={empleado.id} value={empleado.id}>
                  {empleado.nombre} ({empleado.departamento})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha de Inicio *
            </label>
            <input
              type="date"
              value={formData.fechaInicio}
              onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha de Fin *
            </label>
            <input
              type="date"
              value={formData.fechaFin}
              onChange={(e) => setFormData({ ...formData, fechaFin: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            <select
              value={formData.estado}
              onChange={(e) => setFormData({ ...formData, estado: e.target.value as any })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="PENDIENTE">Pendiente</option>
              <option value="APROBADA">Aprobada</option>
              <option value="RECHAZADA">Rechazada</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Comentario
            </label>
            <textarea
              value={formData.comentario}
              onChange={(e) => setFormData({ ...formData, comentario: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Comentario opcional..."
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="ignorarSolapamientos"
              checked={formData.ignorarSolapamientos}
              onChange={(e) => setFormData({ ...formData, ignorarSolapamientos: e.target.checked })}
              className="mr-2"
            />
            <label htmlFor="ignorarSolapamientos" className="text-sm text-gray-700">
              Ignorar solapamientos
            </label>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              onClick={onClose}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md disabled:opacity-50"
            >
              {loading ? 'Creando...' : 'Crear Solicitud'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalNuevaSolicitud;
