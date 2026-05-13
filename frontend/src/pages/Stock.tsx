import React, { useState, useEffect } from 'react';
import {
  CubeIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ChartBarIcon,
  DocumentArrowDownIcon,
  PencilIcon,
  EyeIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import {
  obtenerDashboardStock,
  obtenerProductos,
  obtenerAlertas,
  obtenerMovimientos,
  obtenerProductoPorId,
  eliminarProducto,
  marcarAlertaLeida,
  type DashboardStock,
  type ProductoStock,
  type AlertaStock,
  type MovimientoStock
} from '../apiStock';

const formatMoneda = (valor: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(valor);

const InfoField: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <p className="text-xs text-slate-500 mb-0.5">{label}</p>
    <p className="text-sm font-medium text-slate-800">{value}</p>
  </div>
);

const ProductoDetalleModal: React.FC<{
  producto: ProductoStock | null;
  onClose: () => void;
  onEditar?: (p: ProductoStock) => void;
  onMovimiento?: (p: ProductoStock) => void;
  canUpdate: boolean;
  canManageMovements: boolean;
}> = ({ producto, onClose, onEditar, onMovimiento, canUpdate, canManageMovements }) => {
  if (!producto) return null;

  const stockColor =
    producto.stockActual === 0
      ? 'text-red-600'
      : producto.stockActual <= producto.stockMinimo
      ? 'text-yellow-600'
      : 'text-green-600';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-2xl animate-float-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="flex items-center gap-3 min-w-0">
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-slate-800 truncate">{producto.nombre}</h2>
              <p className="text-xs text-slate-500 font-mono">{producto.codigo}</p>
            </div>
            <span className={`badge flex-shrink-0 ${producto.estado === 'Activo' ? 'badge-success' : 'badge-danger'}`}>
              {producto.estado}
            </span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 flex-shrink-0 ml-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="modal-body space-y-5">
          {/* KPIs de stock */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-50 rounded-xl p-4 text-center">
              <p className="text-xs text-slate-500 mb-1">Stock actual</p>
              <p className={`text-3xl font-bold ${stockColor}`}>{producto.stockActual}</p>
              <p className="text-xs text-slate-400 mt-0.5">{producto.unidadMedida.abreviacion}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 text-center">
              <p className="text-xs text-slate-500 mb-1">Stock mínimo</p>
              <p className="text-3xl font-bold text-slate-700">{producto.stockMinimo}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 text-center">
              <p className="text-xs text-slate-500 mb-1">Valor en stock</p>
              <p className="text-lg font-bold text-blue-600">
                {producto.precioCompra
                  ? formatMoneda(producto.precioCompra * producto.stockActual)
                  : '—'}
              </p>
            </div>
          </div>

          {/* Detalles */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            <InfoField label="Categoría" value={`${producto.categoria.icono || ''} ${producto.categoria.nombre}`} />
            <InfoField label="Unidad de medida" value={producto.unidadMedida.nombre} />
            <InfoField label="Marca / Modelo" value={[producto.marca, producto.modelo].filter(Boolean).join(' — ') || '—'} />
            <InfoField label="Ubicación" value={producto.ubicacion?.nombre || '—'} />
            <InfoField label="Proveedor" value={producto.proveedor?.nombre || '—'} />
            <InfoField label="Condición" value={producto.condicion || '—'} />
            {producto.fechaCompra && (
              <InfoField label="Fecha de compra" value={new Date(producto.fechaCompra).toLocaleDateString()} />
            )}
            {producto.fechaVencimiento && (
              <InfoField label="Vencimiento" value={new Date(producto.fechaVencimiento).toLocaleDateString()} />
            )}
          </div>

          {producto.observaciones && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Observaciones</p>
              <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3">{producto.observaciones}</p>
            </div>
          )}

          {/* Últimos movimientos */}
          {producto.movimientos && producto.movimientos.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Últimos movimientos
              </p>
              <div className="divide-y divide-slate-100">
                {producto.movimientos.slice(0, 6).map(mov => (
                  <div key={mov.id} className="flex items-center justify-between py-2 text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <span>{mov.tipoMovimiento.icono}</span>
                      <span className="text-slate-700 font-medium">{mov.tipoMovimiento.nombre}</span>
                      {mov.motivo && (
                        <span className="text-slate-400 text-xs truncate">— {mov.motivo}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className={`font-semibold ${mov.cantidad > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {mov.cantidad > 0 ? '+' : ''}{mov.cantidad}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(mov.fechaMovimiento).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          {canManageMovements && onMovimiento && (
            <button onClick={() => { onClose(); onMovimiento(producto); }} className="btn-secondary btn-sm">
              Registrar movimiento
            </button>
          )}
          {canUpdate && onEditar && (
            <button onClick={() => { onClose(); onEditar(producto); }} className="btn-primary btn-sm">
              Editar producto
            </button>
          )}
          {!canUpdate && !canManageMovements && (
            <button onClick={onClose} className="btn-secondary btn-sm">Cerrar</button>
          )}
        </div>
      </div>
    </div>
  );
};
import ProductoForm from '../components/ProductoForm';
import MovimientoForm from '../components/MovimientoForm';
import { useAuth } from '../context/AuthContext';

const Stock: React.FC = () => {
  const { user } = useAuth();
  const hasPerm = (perm: string) => (user?.permisos || []).includes(perm) || user?.rol === 'admin';
  const canRead = hasPerm('stock:read') || hasPerm('ver_stock');
  const canCreate = hasPerm('stock:create');
  const canUpdate = hasPerm('stock:update');
  const canDelete = hasPerm('stock:delete');
  const canManageMovements = canCreate || canUpdate;
  const [dashboard, setDashboard] = useState<DashboardStock | null>(null);
  const [productos, setProductos] = useState<ProductoStock[]>([]);
  const [alertas, setAlertas] = useState<AlertaStock[]>([]);
  const [movimientos, setMovimientos] = useState<MovimientoStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [vistaActual, setVistaActual] = useState<'dashboard' | 'productos' | 'movimientos' | 'alertas'>('dashboard');
  const [busqueda, setBusqueda] = useState('');
  const [filtros, setFiltros] = useState({
    categoria: '',
    ubicacion: '',
    estado: '',
    stockBajo: false,
    stockAgotado: false
  });
  
  // Filtros específicos para movimientos
  const [filtrosMovimientos, setFiltrosMovimientos] = useState({
    buscar: '',
    tipoMovimiento: '',
    fechaInicio: '',
    fechaFin: '',
    realizadoPorId: ''
  });
  
  // Lista de usuarios para el filtro
  const [usuarios, setUsuarios] = useState<any[]>([]);
  
  // Estados para redimensionamiento de columnas
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
    numero: 200,
    producto: 200,
    tipo: 150,
    cantidad: 100,
    stock: 120,
    usuario: 180,
    fecha: 160,
    motivo: 200,
    entregadoA: 150
  });
  const [resizingColumn, setResizingColumn] = useState<string | null>(null);
  const [resizeStartX, setResizeStartX] = useState(0);
  const [resizeStartWidth, setResizeStartWidth] = useState(0);
  
  // Estados para el formulario de producto
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState<ProductoStock | null>(null);
  const [modoFormulario, setModoFormulario] = useState<'crear' | 'editar'>('crear');
  
  // Estados para el formulario de movimiento
  const [mostrarFormularioMovimiento, setMostrarFormularioMovimiento] = useState(false);
  const [productoParaMovimiento, setProductoParaMovimiento] = useState<ProductoStock | null>(null);

  // Estado para modal de detalle
  const [productoDetalle, setProductoDetalle] = useState<ProductoStock | null>(null);
  const [mostrarDetalle, setMostrarDetalle] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  // Recargar movimientos cuando cambien los filtros
  useEffect(() => {
    if (vistaActual === 'movimientos') {
      cargarMovimientosFiltrados();
    }
  }, [filtrosMovimientos, vistaActual]);

  // Recargar productos cuando cambien los filtros
  useEffect(() => {
    if (vistaActual === 'productos') {
      cargarProductosFiltrados();
    }
  }, [busqueda, filtros, vistaActual]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const [dashboardData, productosData, alertasData, movimientosData, usuariosData] = await Promise.all([
        obtenerDashboardStock(),
        obtenerProductos({ limit: 10 }),
        obtenerAlertas({ activa: true }),
        obtenerMovimientos({ limit: 20 }),
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000/api'}/usuarios`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }).then(res => res.json()).catch(() => [])
      ]);
      
      setDashboard(dashboardData);
      setProductos(productosData.productos);
      setAlertas(alertasData);
      setMovimientos(movimientosData.movimientos);
      setUsuarios(Array.isArray(usuariosData) ? usuariosData : usuariosData?.data || []);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarProductosFiltrados = async () => {
    try {
      setLoading(true);
      const parametros: any = { limit: 50 };
      
      if (busqueda) {
        parametros.buscar = busqueda;
      }
      if (filtros.categoria) {
        parametros.categoria = filtros.categoria;
      }
      if (filtros.ubicacion) {
        parametros.ubicacion = filtros.ubicacion;
      }
      if (filtros.estado) {
        parametros.estado = filtros.estado;
      }
      if (filtros.stockBajo) {
        parametros.stockBajo = 'true';
      }
      if (filtros.stockAgotado) {
        parametros.stockAgotado = 'true';
      }

      const productosData = await obtenerProductos(parametros);
      setProductos(productosData.productos);
    } catch (error) {
      console.error('Error al cargar productos filtrados:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarMovimientosFiltrados = async () => {
    try {
      setLoading(true);
      const parametros: any = { limit: 50 };
      
      if (filtrosMovimientos.buscar) {
        parametros.buscar = filtrosMovimientos.buscar;
      }
      if (filtrosMovimientos.tipoMovimiento) {
        parametros.tipoMovimiento = filtrosMovimientos.tipoMovimiento;
      }
      if (filtrosMovimientos.fechaInicio) {
        parametros.fechaInicio = filtrosMovimientos.fechaInicio;
      }
      if (filtrosMovimientos.fechaFin) {
        parametros.fechaFin = filtrosMovimientos.fechaFin;
      }
      if (filtrosMovimientos.realizadoPorId) {
        parametros.realizadoPorId = parseInt(filtrosMovimientos.realizadoPorId);
      }

      const movimientosData = await obtenerMovimientos(parametros);
      setMovimientos(movimientosData.movimientos);
    } catch (error) {
      console.error('Error al cargar movimientos filtrados:', error);
    } finally {
      setLoading(false);
    }
  };

  const obtenerColorAlerta = (nivel: string) => {
    switch (nivel) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'error': return 'text-red-500 bg-red-50 border-red-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'info': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const abrirFormularioCrear = () => {
    if (!canCreate) return;
    setProductoSeleccionado(null);
    setModoFormulario('crear');
    setMostrarFormulario(true);
  };

  const abrirFormularioEditar = (producto: ProductoStock) => {
    if (!canUpdate) return;
    setProductoSeleccionado(producto);
    setModoFormulario('editar');
    setMostrarFormulario(true);
  };

  const cerrarFormulario = () => {
    setMostrarFormulario(false);
    setProductoSeleccionado(null);
  };

  const onSuccessFormulario = () => {
    // Recargar dashboard y alertas siempre
    Promise.all([
      obtenerDashboardStock(),
      obtenerAlertas({ activa: true })
    ]).then(([dashboardData, alertasData]) => {
      setDashboard(dashboardData);
      setAlertas(alertasData);
    });

    // Si estamos en la vista de productos, recargar con los filtros actuales
    if (vistaActual === 'productos') {
      cargarProductosFiltrados();
    } else {
      // Si estamos en otra vista, recargar productos básicos
      obtenerProductos({ limit: 10 }).then(data => {
        setProductos(data.productos);
      });
    }
  };

  const manejarEliminar = async (producto: ProductoStock) => {
    if (!canDelete) return;
    const confirmMessage = `¿Estás seguro de que deseas eliminar el producto "${producto.nombre}" (${producto.codigo})?\n\n⚠️ ADVERTENCIA: Esta acción también eliminará:\n• Todos los movimientos de stock relacionados\n• Todas las alertas relacionadas\n• Esta acción NO se puede deshacer\n\n¿Continuar?`;

    if (window.confirm(confirmMessage)) {
      try {
        const response = await eliminarProducto(producto.id);
        cargarDatos(); // Recargar la lista después de eliminar
        
        // Mostrar mensaje de éxito detallado
        console.log(`✅ Producto ${producto.codigo} eliminado exitosamente`);
        alert(`✅ Producto eliminado exitosamente!\n\n📊 Detalles:\n• Producto: ${producto.codigo}\n• Movimientos eliminados: ${response?.movimientosEliminados || 0}\n• Alertas eliminadas: ${response?.alertasEliminadas || 0}`);
      } catch (error: any) {
        console.error('Error al eliminar producto:', error);
        let errorMessage = 'Error desconocido';
        
        if (error.response) {
          // El servidor respondió con un código de estado fuera del rango 2xx
          errorMessage = error.response.data?.error || 
                        error.response.data?.message || 
                        `Error ${error.response.status}: ${error.response.statusText}`;
        } else if (error.request) {
          // La petición fue hecha pero no se recibió respuesta
          errorMessage = 'No se pudo conectar con el servidor. Por favor, verifica tu conexión.';
        } else {
          // Algo pasó al configurar la petición
          errorMessage = error.message || 'Error al configurar la petición';
        }
        
        alert(`❌ Error al eliminar el producto:\n\n${errorMessage}\n\nPor favor, inténtalo de nuevo.`);
      }
    }
  };

  const abrirFormularioMovimiento = (producto: ProductoStock) => {
    if (!canManageMovements) return;
    setProductoParaMovimiento(producto);
    setMostrarFormularioMovimiento(true);
  };

  const cerrarFormularioMovimiento = () => {
    setMostrarFormularioMovimiento(false);
    setProductoParaMovimiento(null);
  };

  const onSuccessMovimiento = () => {
    // Recargar dashboard y alertas siempre
    Promise.all([
      obtenerDashboardStock(),
      obtenerAlertas({ activa: true })
    ]).then(([dashboardData, alertasData]) => {
      setDashboard(dashboardData);
      setAlertas(alertasData);
    });

    // Si estamos en la vista de productos, recargar con los filtros actuales
    if (vistaActual === 'productos') {
      cargarProductosFiltrados();
    } else {
      // Si estamos en otra vista, recargar productos básicos
      obtenerProductos({ limit: 10 }).then(data => {
        setProductos(data.productos);
      });
    }

    // Si estamos en la vista de movimientos, recargar movimientos con filtros
    if (vistaActual === 'movimientos') {
      cargarMovimientosFiltrados();
    } else {
      // Si estamos en otra vista, recargar movimientos básicos
      obtenerMovimientos({ limit: 20 }).then(data => {
        setMovimientos(data.movimientos);
      });
    }
  };

  const limpiarFiltrosMovimientos = () => {
    setFiltrosMovimientos({
      buscar: '',
      tipoMovimiento: '',
      fechaInicio: '',
      fechaFin: '',
      realizadoPorId: ''
    });
  };

  const limpiarFiltrosProductos = () => {
    setBusqueda('');
    setFiltros({
      categoria: '',
      ubicacion: '',
      estado: '',
      stockBajo: false,
      stockAgotado: false
    });
  };

  const verProducto = async (id: number) => {
    try {
      const data = await obtenerProductoPorId(id);
      setProductoDetalle(data);
      setMostrarDetalle(true);
    } catch {
      alert('Error al cargar el detalle del producto');
    }
  };

  const marcarLeida = async (id: number) => {
    try {
      await marcarAlertaLeida(id);
      setAlertas(prev => prev.filter(a => a.id !== id));
    } catch {
      alert('Error al marcar la alerta como leída');
    }
  };

  const exportarCSV = () => {
    const escape = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    let headers: string[];
    let rows: any[][];
    let filename: string;

    if (vistaActual === 'movimientos') {
      filename = 'movimientos_stock.csv';
      headers = ['Número', 'Producto', 'Código', 'Tipo', 'Cantidad', 'Stock Anterior', 'Stock Nuevo', 'Usuario', 'Fecha', 'Motivo', 'Entregado a'];
      rows = movimientos.map(m => [
        m.numero, m.producto.nombre, m.producto.codigo,
        m.tipoMovimiento.nombre, m.cantidad, m.stockAnterior, m.stockNuevo,
        m.realizadoPor.nombre, new Date(m.fechaMovimiento).toLocaleString(),
        m.motivo || '', m.entregadoA || ''
      ]);
    } else {
      filename = 'productos_stock.csv';
      headers = ['Código', 'Nombre', 'Categoría', 'Stock Actual', 'Stock Mínimo', 'Ubicación', 'Estado', 'Marca', 'Modelo'];
      rows = productos.map(p => [
        p.codigo, p.nombre, p.categoria.nombre,
        p.stockActual, p.stockMinimo,
        p.ubicacion?.nombre || '', p.estado,
        p.marca || '', p.modelo || ''
      ]);
    }

    const csv = [headers.map(escape).join(','), ...rows.map(r => r.map(escape).join(','))].join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  
  const handleClickStockAgotado = () => {
    setVistaActual('productos');
    setFiltros({
      categoria: '',
      ubicacion: '',
      estado: '',
      stockBajo: false,
      stockAgotado: true
    });
  };
  
  const handleClickStockBajo = () => {
    setVistaActual('productos');
    setFiltros({
      categoria: '',
      ubicacion: '',
      estado: '',
      stockBajo: true,
      stockAgotado: false
    });
  };
  
  // Handlers para redimensionamiento de columnas
  const handleResizeStart = (columnKey: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingColumn(columnKey);
    setResizeStartX(e.clientX);
    setResizeStartWidth(columnWidths[columnKey] || 150);
  };

  useEffect(() => {
    const handleResizeMove = (e: MouseEvent) => {
      if (!resizingColumn) return;
      
      const diff = e.clientX - resizeStartX;
      const newWidth = Math.max(50, resizeStartWidth + diff); // Mínimo 50px
      
      setColumnWidths(prev => ({
        ...prev,
        [resizingColumn]: newWidth
      }));
    };

    const handleResizeEnd = () => {
      setResizingColumn(null);
    };

    if (resizingColumn) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [resizingColumn, resizeStartX, resizeStartWidth]);

  if (!canRead) {
    return (
      <div className="bg-white shadow-sm rounded-xl p-8 text-center">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Acceso restringido</h2>
        <p className="text-gray-600">No tienes permisos para visualizar el módulo de stock.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <CubeIcon className="w-6 h-6 text-blue-600" />
            Control de Stock
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Gestión de inventario — Departamento de Sistemas</p>
        </div>
        <div className="flex space-x-3">
          <button onClick={exportarCSV} className="btn-secondary flex items-center">
            <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
            Exportar CSV
          </button>
          {canManageMovements && (
            <button 
              onClick={() => { setProductoParaMovimiento(null); setMostrarFormularioMovimiento(true); }}
              className="btn-secondary flex items-center"
            >
              <ArrowTrendingUpIcon className="w-4 h-4 mr-2" />
              Nuevo Movimiento
            </button>
          )}
          {canCreate && (
            <button 
              onClick={abrirFormularioCrear}
              className="btn-primary flex items-center"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Nuevo Producto
            </button>
          )}
        </div>
      </div>

      {/* Navegación de pestañas */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'dashboard', label: 'Dashboard', icon: ChartBarIcon },
            { key: 'productos', label: 'Productos', icon: CubeIcon },
            { key: 'movimientos', label: 'Movimientos', icon: ArrowTrendingUpIcon },
            { key: 'alertas', label: 'Alertas', icon: ExclamationTriangleIcon }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setVistaActual(key as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                vistaActual === key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="w-4 h-4 mr-2" />
              {label}
              {key === 'alertas' && alertas.length > 0 && (
                <span className="ml-2 bg-red-100 text-red-800 text-xs font-medium px-2 py-0.5 rounded-full">
                  {alertas.length}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Dashboard */}
      {vistaActual === 'dashboard' && dashboard && (
        <div className="space-y-6">
          {/* Tarjetas de resumen */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CubeIcon className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Productos</p>
                  <p className="text-2xl font-semibold text-gray-900">{dashboard.resumen.totalProductos}</p>
                </div>
              </div>
            </div>

            <div 
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md hover:border-yellow-400 transition-all"
              onClick={handleClickStockBajo}
              title="Haz clic para ver productos con stock bajo"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ArrowTrendingDownIcon className="h-8 w-8 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Stock Bajo</p>
                  <p className="text-2xl font-semibold text-yellow-600">{dashboard.resumen.stockBajo}</p>
                </div>
              </div>
            </div>

            <div 
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md hover:border-red-400 transition-all"
              onClick={handleClickStockAgotado}
              title="Haz clic para ver productos con stock agotado"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Stock Agotado</p>
                  <p className="text-2xl font-semibold text-red-600">{dashboard.resumen.stockAgotado}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ArrowTrendingUpIcon className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Valor Total</p>
                  <p className="text-2xl font-semibold text-green-600">
                    {formatMoneda(dashboard.resumen.valorTotalStock)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Gráficos y listas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Distribución por categoría */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Productos por Categoría</h3>
              <div className="space-y-3">
                {dashboard.distribucion.porCategoria.map((cat, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-3"
                        style={{ backgroundColor: cat.color || '#6B7280' }}
                      ></div>
                      <span className="text-sm font-medium text-gray-700">{cat.nombre}</span>
                    </div>
                    <span className="text-sm text-gray-500">{cat.cantidad}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Últimos movimientos */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Últimos Movimientos</h3>
              <div className="space-y-3">
                {dashboard.ultimosMovimientos.slice(0, 5).map((mov) => (
                  <div key={mov.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{mov.producto.nombre}</p>
                      <p className="text-xs text-gray-500">
                        {mov.tipoMovimiento.nombre} - {mov.cantidad} unidades
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">
                        {new Date(mov.fechaMovimiento).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-400">{mov.realizadoPor.nombre}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lista de productos */}
      {vistaActual === 'productos' && (
        <div className="space-y-6">
          {/* Filtros y búsqueda */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              <div className="flex-1 max-w-lg">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar productos..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex space-x-3">
                <select 
                  value={filtros.categoria}
                  onChange={(e) => setFiltros({...filtros, categoria: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Todas las categorías</option>
                  {dashboard?.distribucion.porCategoria.map((cat) => (
                    <option key={cat.nombre} value={cat.nombre}>{cat.nombre}</option>
                  ))}
                </select>
                <select 
                  value={filtros.estado}
                  onChange={(e) => setFiltros({...filtros, estado: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Todos los estados</option>
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                  <option value="Descontinuado">Descontinuado</option>
                </select>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filtros.stockBajo}
                    onChange={(e) => setFiltros({...filtros, stockBajo: e.target.checked})}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Solo stock bajo</span>
                </label>
                <button
                  onClick={limpiarFiltrosProductos}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                >
                  Limpiar
                </button>
              </div>
            </div>
          </div>

          {/* Tabla de productos */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Producto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Categoría
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ubicación
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {productos.map((producto) => (
                    <tr key={producto.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{producto.nombre}</div>
                          <div className="text-sm text-gray-500">{producto.codigo}</div>
                          {producto.marca && (
                            <div className="text-xs text-gray-400">{producto.marca} {producto.modelo}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {producto.categoria.icono && (
                            <span className="mr-2">{producto.categoria.icono}</span>
                          )}
                          <span className="text-sm text-gray-900">{producto.categoria.nombre}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <span className={`font-medium ${
                            producto.stockActual <= producto.stockMinimo 
                              ? producto.stockActual === 0 ? 'text-red-600' : 'text-yellow-600'
                              : 'text-green-600'
                          }`}>
                            {producto.stockActual}
                          </span>
                          <span className="text-gray-500"> / {producto.stockMinimo} min</span>
                        </div>
                        <div className="text-xs text-gray-500">{producto.unidadMedida.abreviacion}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {producto.ubicacion?.nombre || 'Sin ubicación'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          producto.estado === 'Activo' 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {producto.estado}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => verProducto(producto.id)}
                          className="text-blue-600 hover:text-blue-900 mr-3 inline-flex items-center"
                        >
                          <EyeIcon className="w-4 h-4 mr-1" />
                          Ver
                        </button>
                        {canUpdate && (
                          <button 
                            onClick={() => abrirFormularioEditar(producto)}
                            className="text-green-600 hover:text-green-900 mr-3 inline-flex items-center"
                          >
                            <PencilIcon className="w-4 h-4 mr-1" />
                            Editar
                          </button>
                        )}
                        {canDelete && (
                          <button 
                            onClick={() => manejarEliminar(producto)}
                            className="text-red-600 hover:text-red-900 mr-3 inline-flex items-center"
                          >
                            <TrashIcon className="w-4 h-4 mr-1" />
                            Eliminar
                          </button>
                        )}
                        {canManageMovements && (
                          <button 
                            onClick={() => abrirFormularioMovimiento(producto)}
                            className="text-purple-600 hover:text-purple-900"
                          >
                            Movimiento
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Lista de movimientos */}
      {vistaActual === 'movimientos' && (
        <div className="space-y-6">
          {/* Filtros para movimientos */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              <div className="flex-1 max-w-lg">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar por producto o número..."
                    value={filtrosMovimientos.buscar}
                    onChange={(e) => setFiltrosMovimientos({...filtrosMovimientos, buscar: e.target.value})}
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex space-x-3">
                <select 
                  value={filtrosMovimientos.tipoMovimiento}
                  onChange={(e) => setFiltrosMovimientos({...filtrosMovimientos, tipoMovimiento: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Todos los tipos</option>
                  <option value="Ingreso">Ingreso</option>
                  <option value="Salida">Salida</option>
                  <option value="Transferencia">Transferencia</option>
                  <option value="Ajuste">Ajuste</option>
                  <option value="Devolución">Devolución</option>
                </select>
                <input
                  type="date"
                  value={filtrosMovimientos.fechaInicio}
                  onChange={(e) => setFiltrosMovimientos({...filtrosMovimientos, fechaInicio: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Fecha desde"
                />
                <input
                  type="date"
                  value={filtrosMovimientos.fechaFin}
                  onChange={(e) => setFiltrosMovimientos({...filtrosMovimientos, fechaFin: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Fecha hasta"
                />
                <select
                  value={filtrosMovimientos.realizadoPorId}
                  onChange={(e) => setFiltrosMovimientos({...filtrosMovimientos, realizadoPorId: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Todos los usuarios</option>
                  {usuarios.map(usuario => (
                    <option key={usuario.id} value={usuario.id}>
                      {usuario.nombre} ({usuario.username})
                    </option>
                  ))}
                </select>
                <button
                  onClick={limpiarFiltrosMovimientos}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                >
                  Limpiar
                </button>
              </div>
            </div>
          </div>

          {/* Tabla de movimientos */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200" style={{ tableLayout: 'fixed', width: '100%' }}>
                <colgroup>
                  <col style={{ width: `${columnWidths.numero}px` }} />
                  <col style={{ width: `${columnWidths.producto}px` }} />
                  <col style={{ width: `${columnWidths.tipo}px` }} />
                  <col style={{ width: `${columnWidths.cantidad}px` }} />
                  <col style={{ width: `${columnWidths.stock}px` }} />
                  <col style={{ width: `${columnWidths.usuario}px` }} />
                  <col style={{ width: `${columnWidths.fecha}px` }} />
                  <col style={{ width: `${columnWidths.motivo}px` }} />
                  <col style={{ width: `${columnWidths.entregadoA}px` }} />
                </colgroup>
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider relative">
                      <div className="flex items-center justify-between">
                        <span>Número</span>
                        <div
                          className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 bg-transparent"
                          onMouseDown={(e) => handleResizeStart('numero', e)}
                        />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider relative">
                      <div className="flex items-center justify-between">
                        <span>Producto</span>
                        <div
                          className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 bg-transparent"
                          onMouseDown={(e) => handleResizeStart('producto', e)}
                        />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider relative">
                      <div className="flex items-center justify-between">
                        <span>Tipo</span>
                        <div
                          className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 bg-transparent"
                          onMouseDown={(e) => handleResizeStart('tipo', e)}
                        />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider relative">
                      <div className="flex items-center justify-between">
                        <span>Cantidad</span>
                        <div
                          className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 bg-transparent"
                          onMouseDown={(e) => handleResizeStart('cantidad', e)}
                        />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider relative">
                      <div className="flex items-center justify-between">
                        <span>Stock</span>
                        <div
                          className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 bg-transparent"
                          onMouseDown={(e) => handleResizeStart('stock', e)}
                        />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider relative">
                      <div className="flex items-center justify-between">
                        <span>Usuario</span>
                        <div
                          className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 bg-transparent"
                          onMouseDown={(e) => handleResizeStart('usuario', e)}
                        />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider relative">
                      <div className="flex items-center justify-between">
                        <span>Fecha</span>
                        <div
                          className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 bg-transparent"
                          onMouseDown={(e) => handleResizeStart('fecha', e)}
                        />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider relative">
                      <div className="flex items-center justify-between">
                        <span>Motivo</span>
                        <div
                          className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 bg-transparent"
                          onMouseDown={(e) => handleResizeStart('motivo', e)}
                        />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider relative">
                      <div className="flex items-center justify-between">
                        <span>Entregado a</span>
                        <div
                          className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 bg-transparent"
                          onMouseDown={(e) => handleResizeStart('entregadoA', e)}
                        />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {movimientos.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center">
                          <ArrowTrendingUpIcon className="h-12 w-12 text-gray-400 mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay movimientos registrados</h3>
                          <p className="text-gray-500">Los movimientos de stock aparecerán aquí cuando se registren.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    movimientos.map((movimiento) => (
                      <tr key={movimiento.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4" style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          <div className="text-sm font-medium text-gray-900 truncate">{movimiento.numero}</div>
                          <div className="text-xs text-gray-500 truncate">{movimiento.estado}</div>
                        </td>
                        <td className="px-6 py-4" style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          <div className="text-sm font-medium text-gray-900 truncate">{movimiento.producto.nombre}</div>
                          <div className="text-xs text-gray-500 truncate">{movimiento.producto.codigo}</div>
                        </td>
                        <td className="px-6 py-4" style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          <div className="flex items-center">
                            <span className="mr-2">{movimiento.tipoMovimiento.icono}</span>
                            <span 
                              className="inline-flex px-2 py-1 text-xs font-semibold rounded-full truncate"
                              style={{ 
                                backgroundColor: movimiento.tipoMovimiento.color + '20',
                                color: movimiento.tipoMovimiento.color 
                              }}
                            >
                              {movimiento.tipoMovimiento.nombre}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 font-medium">
                            {movimiento.cantidad > 0 ? '+' : ''}{movimiento.cantidad}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            <span className="text-gray-500">{movimiento.stockAnterior}</span>
                            <span className="mx-2">→</span>
                            <span className="font-medium">{movimiento.stockNuevo}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4" style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {movimiento.realizadoPor.nombre}
                          </div>
                          {movimiento.realizadoPor.username && (
                            <div className="text-xs text-gray-500 truncate">
                              @{movimiento.realizadoPor.username}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(movimiento.fechaMovimiento).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(movimiento.fechaMovimiento).toLocaleTimeString()}
                          </div>
                        </td>
                        <td className="px-6 py-4" style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          <div className="text-sm text-gray-900 truncate" title={movimiento.motivo}>
                            {movimiento.motivo}
                          </div>
                          {movimiento.observaciones && (
                            <div className="text-xs text-gray-500 truncate" title={movimiento.observaciones}>
                              {movimiento.observaciones}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4" style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {movimiento.entregadoA ? (
                            <div className="text-sm text-gray-900 truncate" title={movimiento.entregadoA}>
                              {movimiento.entregadoA}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Alertas */}
      {vistaActual === 'alertas' && (
        <div className="space-y-4">
          {alertas.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay alertas activas</h3>
              <p className="mt-1 text-sm text-gray-500">Todas las alertas han sido resueltas.</p>
            </div>
          ) : (
            alertas.map((alerta) => (
              <div key={alerta.id} className={`bg-white rounded-xl shadow-sm border p-4 ${obtenerColorAlerta(alerta.nivel)}`}>
                <div className="flex items-start justify-between">
                  <div className="flex">
                    <ExclamationTriangleIcon className="h-5 w-5 mt-0.5 mr-3" />
                    <div>
                      <h4 className="text-sm font-medium">{alerta.mensaje}</h4>
                      <p className="text-xs mt-1 opacity-75">
                        Producto: {alerta.producto.nombre} ({alerta.producto.codigo})
                      </p>
                      <p className="text-xs mt-1 opacity-75">
                        {new Date(alerta.creadoEn).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => marcarLeida(alerta.id)}
                    className="text-xs px-3 py-1 bg-white bg-opacity-60 rounded-md hover:bg-opacity-100 font-medium transition-all"
                  >
                    Marcar como leída
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal de detalle de producto */}
      {mostrarDetalle && (
        <ProductoDetalleModal
          producto={productoDetalle}
          onClose={() => { setMostrarDetalle(false); setProductoDetalle(null); }}
          onEditar={canUpdate ? (p) => { abrirFormularioEditar(p); } : undefined}
          onMovimiento={canManageMovements ? (p) => { abrirFormularioMovimiento(p); } : undefined}
          canUpdate={canUpdate}
          canManageMovements={canManageMovements}
        />
      )}

      {/* Modal de formulario de producto */}
      <ProductoForm
        isOpen={mostrarFormulario}
        onClose={cerrarFormulario}
        onSuccess={onSuccessFormulario}
        producto={productoSeleccionado}
        modo={modoFormulario}
      />
      
      {/* Modal de formulario de movimiento */}
      <MovimientoForm
        isOpen={mostrarFormularioMovimiento}
        onClose={cerrarFormularioMovimiento}
        onSuccess={onSuccessMovimiento}
        producto={productoParaMovimiento}
      />
    </div>
  );
};

export default Stock;
