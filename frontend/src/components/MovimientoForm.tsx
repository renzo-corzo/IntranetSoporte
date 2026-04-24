import React, { useState, useEffect } from 'react';
import { XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';
import {
  obtenerTiposMovimiento,
  obtenerUbicaciones,
  obtenerProductos,
  crearMovimiento,
  crearUbicacion,
  type TipoMovimiento,
  type UbicacionStock,
  type ProductoStock
} from '../apiStock';
import { empleadosService } from '../services/empleados.service';
import ModalUbicacion from './ModalUbicacion';

interface MovimientoFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  producto?: ProductoStock | null;
}

const MovimientoForm: React.FC<MovimientoFormProps> = ({
  isOpen,
  onClose,
  onSuccess,
  producto
}) => {
  const [formData, setFormData] = useState({
    productoId: '',
    tipoMovimientoId: '',
    cantidad: 1,
    origenId: '',
    destinoId: '',
    motivo: '',
    observaciones: '',
    numeroFactura: '',
    numeroRemito: '',
    costoUnitario: '',
    costoTotal: '',
    entregadoA: '' // Nuevo campo para registrar a quién se entregó
  });

  const [tiposMovimiento, setTiposMovimiento] = useState<TipoMovimiento[]>([]);
  const [ubicaciones, setUbicaciones] = useState<UbicacionStock[]>([]);
  const [productos, setProductos] = useState<ProductoStock[]>([]);
  const [empleados, setEmpleados] = useState<any[]>([]);
  /** Si falla GET /empleados (p. ej. 403), no bloquea productos/tipos/ubicaciones */
  const [empleadosCargaFallida, setEmpleadosCargaFallida] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showModalUbicacion, setShowModalUbicacion] = useState(false);

  useEffect(() => {
    if (isOpen) {
      cargarDatosIniciales();
      // Reset form
      setFormData({
        productoId: '',
        tipoMovimientoId: '',
        cantidad: 1,
        origenId: '',
        destinoId: '',
        motivo: '',
        observaciones: '',
        numeroFactura: '',
        numeroRemito: '',
        costoUnitario: '',
        costoTotal: '',
        entregadoA: ''
      });
      setErrors({});
      setEmpleadosCargaFallida(false);
    }
  }, [isOpen]);

  const cargarDatosIniciales = async () => {
    setEmpleadosCargaFallida(false);

    // Stock: tipos, ubicaciones y (opcional) productos — sin mezclar con empleados
    try {
      const peticionesStock: Promise<any>[] = [
        obtenerTiposMovimiento(),
        obtenerUbicaciones()
      ];
      if (!producto) {
        peticionesStock.push(obtenerProductos({ limit: 100 } as any));
      }

      const resStock = await Promise.all(peticionesStock);
      setTiposMovimiento(resStock[0]);
      setUbicaciones(resStock[1]);
      if (!producto) {
        setProductos(resStock[2]?.productos || []);
      }
    } catch (error) {
      console.error('Error al cargar tipos/ubicaciones/productos de stock:', error);
    }

    // Empleados: permisos distintos (RRHH); un 403 no debe vaciar el resto del formulario
    try {
      const res = await empleadosService.getEmpleados({ estado: 'ACTIVO' });
      setEmpleados(res?.data || []);
      setEmpleadosCargaFallida(false);
    } catch (error) {
      setEmpleados([]);
      setEmpleadosCargaFallida(true);
      console.warn(
        'MovimientoForm: lista de empleados no disponible (p. ej. sin permiso). Productos y stock siguen cargados.',
        error
      );
    }
  };

  const handleUbicacionCreated = (nuevaUbicacion: UbicacionStock) => {
    setUbicaciones(prev => [...prev, nuevaUbicacion]);
    setShowModalUbicacion(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar error del campo
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validarFormulario = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.tipoMovimientoId) newErrors.tipoMovimientoId = 'El tipo de movimiento es obligatorio';
    if (!formData.cantidad || formData.cantidad <= 0) newErrors.cantidad = 'La cantidad debe ser mayor a 0';
    if (!formData.motivo.trim()) newErrors.motivo = 'El motivo es obligatorio';
    if (!producto && !formData.productoId) newErrors.productoId = 'El producto es obligatorio';

    // Validaciones específicas según el tipo de movimiento
    const tipoSeleccionado = tiposMovimiento.find(t => t.id === parseInt(formData.tipoMovimientoId));
    if (tipoSeleccionado) {
      if (tipoSeleccionado.requiereOrigen && !formData.origenId) {
        newErrors.origenId = 'La ubicación de origen es obligatoria para este tipo de movimiento';
      }
      if (tipoSeleccionado.requiereDestino && !formData.destinoId) {
        newErrors.destinoId = 'La ubicación de destino es obligatoria para este tipo de movimiento';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validarFormulario()) return;

    setLoading(true);
    try {
      const dataToSend = {
        productoId: producto ? producto.id : parseInt(formData.productoId),
        tipoMovimientoId: parseInt(formData.tipoMovimientoId),
        cantidad: parseInt(formData.cantidad.toString()),
        origenId: formData.origenId ? parseInt(formData.origenId) : undefined,
        destinoId: formData.destinoId ? parseInt(formData.destinoId) : undefined,
        motivo: formData.motivo,
        observaciones: formData.observaciones || undefined,
        numeroFactura: formData.numeroFactura || undefined,
        numeroRemito: formData.numeroRemito || undefined,
        costoUnitario: formData.costoUnitario ? parseFloat(formData.costoUnitario) : undefined,
        costoTotal: formData.costoTotal ? parseFloat(formData.costoTotal) : undefined,
        entregadoA: formData.entregadoA || undefined, // Nuevo campo
        stockAnterior: producto ? producto.stockActual : 0,
        stockNuevo: producto ? producto.stockActual : 0, // Se calculará en el backend
        // realizadoPorId se obtiene automáticamente del token en el backend
        fechaMovimiento: new Date().toISOString(),
        estado: 'Completado'
      };

      await crearMovimiento(dataToSend);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error al crear movimiento:', error);
      setErrors({ general: error.response?.data?.error || 'Error al crear el movimiento' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const tipoSeleccionado = tiposMovimiento.find(t => t.id === parseInt(formData.tipoMovimientoId));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Nuevo Movimiento de Stock
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Información del producto */}
        {producto && (
          <div className="px-6 pt-4">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-600">Producto seleccionado</p>
              <p className="text-base font-medium text-gray-900">{producto.nombre} <span className="text-gray-500">({producto.codigo})</span></p>
            </div>
          </div>
        )}
        {!producto && (
          <div className="px-6 pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Producto</label>
            <select
              name="productoId"
              value={formData.productoId}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccione un producto</option>
              {productos.map((p) => (
                <option key={p.id} value={p.id}>{p.nombre} ({p.codigo})</option>
              ))}
            </select>
            {errors.productoId && (
              <p className="mt-1 text-sm text-red-600">{errors.productoId}</p>
            )}
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errors.general && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {errors.general}
            </div>
          )}

          {/* Tipo de movimiento y cantidad */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Movimiento *
              </label>
              <select
                name="tipoMovimientoId"
                value={formData.tipoMovimientoId}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.tipoMovimientoId ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Seleccionar tipo</option>
                {tiposMovimiento.map(tipo => (
                  <option key={tipo.id} value={tipo.id}>
                    {tipo.icono} {tipo.nombre} - {tipo.descripcion}
                  </option>
                ))}
              </select>
              {errors.tipoMovimientoId && (
                <p className="mt-1 text-sm text-red-600">{errors.tipoMovimientoId}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cantidad *
              </label>
              <input
                type="number"
                name="cantidad"
                value={formData.cantidad}
                onChange={handleChange}
                min="1"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.cantidad ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.cantidad && (
                <p className="mt-1 text-sm text-red-600">{errors.cantidad}</p>
              )}
            </div>
          </div>

          {/* Ubicaciones (solo si el tipo de movimiento las requiere) */}
          {tipoSeleccionado && (tipoSeleccionado.requiereOrigen || tipoSeleccionado.requiereDestino) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {tipoSeleccionado.requiereOrigen && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Ubicación de Origen *
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowModalUbicacion(true)}
                      className="flex items-center text-xs text-blue-600 hover:text-blue-800"
                    >
                      <PlusIcon className="w-3 h-3 mr-1" />
                      Nueva
                    </button>
                  </div>
                  <select
                    name="origenId"
                    value={formData.origenId}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.origenId ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Seleccionar origen</option>
                    {ubicaciones.map(ubicacion => (
                      <option key={ubicacion.id} value={ubicacion.id}>
                        {ubicacion.nombre} - {ubicacion.tipo}
                      </option>
                    ))}
                  </select>
                  {errors.origenId && (
                    <p className="mt-1 text-sm text-red-600">{errors.origenId}</p>
                  )}
                </div>
              )}

              {tipoSeleccionado.requiereDestino && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Ubicación de Destino *
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowModalUbicacion(true)}
                      className="flex items-center text-xs text-blue-600 hover:text-blue-800"
                    >
                      <PlusIcon className="w-3 h-3 mr-1" />
                      Nueva
                    </button>
                  </div>
                  <select
                    name="destinoId"
                    value={formData.destinoId}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.destinoId ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Seleccionar destino</option>
                    {ubicaciones.map(ubicacion => (
                      <option key={ubicacion.id} value={ubicacion.id}>
                        {ubicacion.nombre} - {ubicacion.tipo}
                      </option>
                    ))}
                  </select>
                  {errors.destinoId && (
                    <p className="mt-1 text-sm text-red-600">{errors.destinoId}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Motivo y Entregado a */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Motivo *
              </label>
              <input
                type="text"
                name="motivo"
                value={formData.motivo}
                onChange={handleChange}
                placeholder="Ej: Entrega a usuario, Reposición de stock, Mantenimiento..."
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.motivo ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.motivo && (
                <p className="mt-1 text-sm text-red-600">{errors.motivo}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Entregado a
              </label>
              <select
                name="entregadoA"
                value={formData.entregadoA}
                onChange={handleChange}
                disabled={empleadosCargaFallida}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
              >
                <option value="">
                  {empleadosCargaFallida ? 'Lista no disponible' : 'Seleccionar empleado'}
                </option>
                {empleados.map(empleado => (
                  <option key={empleado.id} value={`${empleado.nombre} ${empleado.apellido}`}>
                    {empleado.nombre} {empleado.apellido} - {empleado.departamento}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Empleado que recibe el producto
              </p>
              {empleadosCargaFallida && (
                <p className="mt-1 text-xs text-amber-700">
                  No se pudo cargar el listado desde RRHH. Podés completar motivo u observaciones con el nombre o gestionar permisos más adelante.
                </p>
              )}
            </div>
          </div>

          {/* Información adicional */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número de Factura
              </label>
              <input
                type="text"
                name="numeroFactura"
                value={formData.numeroFactura}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número de Remito
              </label>
              <input
                type="text"
                name="numeroRemito"
                value={formData.numeroRemito}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Costos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Costo Unitario
              </label>
              <input
                type="number"
                name="costoUnitario"
                value={formData.costoUnitario}
                onChange={handleChange}
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Costo Total
              </label>
              <input
                type="number"
                name="costoTotal"
                value={formData.costoTotal}
                onChange={handleChange}
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observaciones
            </label>
            <textarea
              name="observaciones"
              value={formData.observaciones}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Información adicional sobre el movimiento..."
            />
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Creando...' : 'Crear Movimiento'}
            </button>
          </div>
        </form>
      </div>

      {/* Modal de Ubicación */}
      <ModalUbicacion
        isOpen={showModalUbicacion}
        onClose={() => setShowModalUbicacion(false)}
        onUbicacionCreated={handleUbicacionCreated}
      />
    </div>
  );
};

export default MovimientoForm;
