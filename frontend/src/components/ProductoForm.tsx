import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import {
  crearProducto,
  actualizarProducto,
  obtenerCategorias,
  obtenerUnidadesMedida,
  obtenerProveedores,
  obtenerUbicaciones,
  type ProductoStock,
  type CategoriaStock,
  type UnidadMedida,
  type ProveedorStock,
  type UbicacionStock
} from '../apiStock';

interface ProductoFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  producto?: ProductoStock | null;
  modo: 'crear' | 'editar';
}

const ProductoForm: React.FC<ProductoFormProps> = ({
  isOpen,
  onClose,
  onSuccess,
  producto,
  modo
}) => {
  const [loading, setLoading] = useState(false);
  const [categorias, setCategorias] = useState<CategoriaStock[]>([]);
  const [unidades, setUnidades] = useState<UnidadMedida[]>([]);
  const [proveedores, setProveedores] = useState<ProveedorStock[]>([]);
  const [ubicaciones, setUbicaciones] = useState<UbicacionStock[]>([]);
  
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    marca: '',
    modelo: '',
    numeroSerie: '',
    codigoBarras: '',
    stockActual: 0,
    stockMinimo: 1,
    stockMaximo: '',
    precioCompra: '',
    precioVenta: '',
    moneda: 'ARS',
    categoriaId: '',
    unidadMedidaId: '',
    proveedorId: '',
    ubicacionId: '',
    estado: 'Activo',
    condicion: 'Nuevo',
    fechaCompra: '',
    fechaVencimiento: '',
    observaciones: '',
    tags: [] as string[]
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      cargarDatosIniciales();
      if (modo === 'editar' && producto) {
        setFormData({
          codigo: producto.codigo,
          nombre: producto.nombre,
          descripcion: producto.descripcion || '',
          marca: producto.marca || '',
          modelo: producto.modelo || '',
          numeroSerie: producto.numeroSerie || '',
          codigoBarras: producto.codigoBarras || '',
          stockActual: producto.stockActual,
          stockMinimo: producto.stockMinimo,
          stockMaximo: producto.stockMaximo?.toString() || '',
          precioCompra: producto.precioCompra?.toString() || '',
          precioVenta: producto.precioVenta?.toString() || '',
          moneda: producto.moneda,
          categoriaId: producto.categoriaId.toString(),
          unidadMedidaId: producto.unidadMedidaId.toString(),
          proveedorId: producto.proveedorId?.toString() || '',
          ubicacionId: producto.ubicacionId?.toString() || '',
          estado: producto.estado,
          condicion: producto.condicion,
          fechaCompra: producto.fechaCompra ? producto.fechaCompra.split('T')[0] : '',
          fechaVencimiento: producto.fechaVencimiento ? producto.fechaVencimiento.split('T')[0] : '',
          observaciones: producto.observaciones || '',
          tags: producto.tags || []
        });
      } else {
        // Resetear formulario para crear
        setFormData({
          codigo: '',
          nombre: '',
          descripcion: '',
          marca: '',
          modelo: '',
          numeroSerie: '',
          codigoBarras: '',
          stockActual: 0,
          stockMinimo: 1,
          stockMaximo: '',
          precioCompra: '',
          precioVenta: '',
          moneda: 'ARS',
          categoriaId: '',
          unidadMedidaId: '',
          proveedorId: '',
          ubicacionId: '',
          estado: 'Activo',
          condicion: 'Nuevo',
          fechaCompra: '',
          fechaVencimiento: '',
          observaciones: '',
          tags: []
        });
      }
      setErrors({});
    }
  }, [isOpen, modo, producto]);

  const cargarDatosIniciales = async () => {
    try {
      const [categoriasData, unidadesData, proveedoresData, ubicacionesData] = await Promise.all([
        obtenerCategorias(),
        obtenerUnidadesMedida(),
        obtenerProveedores(),
        obtenerUbicaciones()
      ]);
      
      setCategorias(categoriasData);
      setUnidades(unidadesData);
      setProveedores(proveedoresData);
      setUbicaciones(ubicacionesData);
    } catch (error) {
      console.error('Error al cargar datos iniciales:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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

    if (!formData.codigo.trim()) newErrors.codigo = 'El código es obligatorio';
    if (!formData.nombre.trim()) newErrors.nombre = 'El nombre es obligatorio';
    if (!formData.categoriaId || formData.categoriaId === '') newErrors.categoriaId = 'La categoría es obligatoria';
    if (!formData.unidadMedidaId || formData.unidadMedidaId === '') newErrors.unidadMedidaId = 'La unidad de medida es obligatoria';
    if (formData.stockMinimo < 0) newErrors.stockMinimo = 'El stock mínimo no puede ser negativo';
    if (formData.stockActual < 0) newErrors.stockActual = 'El stock actual no puede ser negativo';

    // Validar que los IDs sean números válidos
    if (formData.categoriaId && isNaN(parseInt(formData.categoriaId))) {
      newErrors.categoriaId = 'ID de categoría inválido';
    }
    if (formData.unidadMedidaId && isNaN(parseInt(formData.unidadMedidaId))) {
      newErrors.unidadMedidaId = 'ID de unidad de medida inválido';
    }

    console.log('🔍 Validación frontend:', {
      categoriaId: formData.categoriaId,
      unidadMedidaId: formData.unidadMedidaId,
      categoriaIdParsed: parseInt(formData.categoriaId),
      unidadMedidaIdParsed: parseInt(formData.unidadMedidaId),
      errors: newErrors
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validarFormulario()) return;

    setLoading(true);
    try {
      const dataToSend = {
        ...formData,
        categoriaId: parseInt(formData.categoriaId),
        unidadMedidaId: parseInt(formData.unidadMedidaId),
        proveedorId: formData.proveedorId && formData.proveedorId !== '' ? parseInt(formData.proveedorId) : undefined,
        ubicacionId: formData.ubicacionId && formData.ubicacionId !== '' ? parseInt(formData.ubicacionId) : undefined,
        stockMaximo: formData.stockMaximo && formData.stockMaximo !== '' ? parseInt(formData.stockMaximo) : undefined,
        precioCompra: formData.precioCompra && formData.precioCompra !== '' ? parseFloat(formData.precioCompra) : undefined,
        precioVenta: formData.precioVenta && formData.precioVenta !== '' ? parseFloat(formData.precioVenta) : undefined,
        fechaCompra: formData.fechaCompra && formData.fechaCompra !== '' ? formData.fechaCompra : undefined,
        fechaVencimiento: formData.fechaVencimiento && formData.fechaVencimiento !== '' ? formData.fechaVencimiento : undefined
      };

      if (modo === 'crear') {
        await crearProducto(dataToSend);
      } else if (producto) {
        await actualizarProducto(producto.id, dataToSend);
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error al guardar producto:', error);
      if (error.response?.data?.error) {
        setErrors({ general: error.response.data.error });
      } else {
        setErrors({ general: 'Error al guardar el producto' });
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {modo === 'crear' ? 'Nuevo Producto' : 'Editar Producto'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errors.general && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {errors.general}
            </div>
          )}

          {/* Información básica */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Código *
              </label>
              <input
                type="text"
                name="codigo"
                value={formData.codigo}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.codigo ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Ej: CABLE-001"
              />
              {errors.codigo && <p className="text-red-500 text-sm mt-1">{errors.codigo}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre *
              </label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.nombre ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Ej: Cable UTP Cat 6"
              />
              {errors.nombre && <p className="text-red-500 text-sm mt-1">{errors.nombre}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción
              </label>
              <textarea
                name="descripcion"
                value={formData.descripcion}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Descripción detallada del producto..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Marca
              </label>
              <input
                type="text"
                name="marca"
                value={formData.marca}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: TP-Link"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Modelo
              </label>
              <input
                type="text"
                name="modelo"
                value={formData.modelo}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: TL-SG1005D"
              />
            </div>
          </div>

          {/* Clasificación */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoría *
              </label>
              <select
                name="categoriaId"
                value={formData.categoriaId}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.categoriaId ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Seleccionar categoría</option>
                {categorias.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icono} {cat.nombre}
                  </option>
                ))}
              </select>
              {errors.categoriaId && <p className="text-red-500 text-sm mt-1">{errors.categoriaId}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unidad de Medida *
              </label>
              <select
                name="unidadMedidaId"
                value={formData.unidadMedidaId}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.unidadMedidaId ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Seleccionar unidad</option>
                {unidades.map(unidad => (
                  <option key={unidad.id} value={unidad.id}>
                    {unidad.nombre} ({unidad.abreviacion})
                  </option>
                ))}
              </select>
              {errors.unidadMedidaId && <p className="text-red-500 text-sm mt-1">{errors.unidadMedidaId}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Proveedor
              </label>
              <select
                name="proveedorId"
                value={formData.proveedorId}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Sin proveedor</option>
                {proveedores.map(prov => (
                  <option key={prov.id} value={prov.id}>
                    {prov.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ubicación
              </label>
              <select
                name="ubicacionId"
                value={formData.ubicacionId}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Sin ubicación</option>
                {ubicaciones.map(ub => (
                  <option key={ub.id} value={ub.id}>
                    {ub.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Stock */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stock Actual
              </label>
              <input
                type="number"
                name="stockActual"
                value={formData.stockActual}
                onChange={handleInputChange}
                min="0"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.stockActual ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.stockActual && <p className="text-red-500 text-sm mt-1">{errors.stockActual}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stock Mínimo
              </label>
              <input
                type="number"
                name="stockMinimo"
                value={formData.stockMinimo}
                onChange={handleInputChange}
                min="0"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.stockMinimo ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.stockMinimo && <p className="text-red-500 text-sm mt-1">{errors.stockMinimo}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stock Máximo
              </label>
              <input
                type="number"
                name="stockMaximo"
                value={formData.stockMaximo}
                onChange={handleInputChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Precios */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Precio de Compra
              </label>
              <input
                type="number"
                name="precioCompra"
                value={formData.precioCompra}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Precio de Venta
              </label>
              <input
                type="number"
                name="precioVenta"
                value={formData.precioVenta}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Moneda
              </label>
              <select
                name="moneda"
                value={formData.moneda}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ARS">ARS - Peso Argentino</option>
                <option value="USD">USD - Dólar</option>
                <option value="EUR">EUR - Euro</option>
              </select>
            </div>
          </div>

          {/* Estados y fechas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado
              </label>
              <select
                name="estado"
                value={formData.estado}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Activo">Activo</option>
                <option value="Inactivo">Inactivo</option>
                <option value="Descontinuado">Descontinuado</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Condición
              </label>
              <select
                name="condicion"
                value={formData.condicion}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Nuevo">Nuevo</option>
                <option value="Usado">Usado</option>
                <option value="Reparado">Reparado</option>
                <option value="Defectuoso">Defectuoso</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de Compra
              </label>
              <input
                type="date"
                name="fechaCompra"
                value={formData.fechaCompra}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de Vencimiento
              </label>
              <input
                type="date"
                name="fechaVencimiento"
                value={formData.fechaVencimiento}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Observaciones adicionales..."
            />
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Guardando...' : modo === 'crear' ? 'Crear Producto' : 'Actualizar Producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductoForm;
