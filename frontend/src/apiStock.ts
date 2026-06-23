import axios from 'axios';
import { API_BASE_URL } from './config/api';

const API_URL = API_BASE_URL;

const api = axios.create({
  baseURL: API_URL,
});

// Interceptor para agregar el token de autenticación
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Tipos TypeScript
export interface ProductoStock {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  marca?: string;
  modelo?: string;
  numeroSerie?: string;
  codigoBarras?: string;
  stockActual: number;
  stockMinimo: number;
  stockMaximo?: number;
  precioCompra?: number;
  precioVenta?: number;
  moneda: string;
  categoriaId: number;
  categoria: CategoriaStock;
  unidadMedidaId: number;
  unidadMedida: UnidadMedida;
  proveedorId?: number;
  proveedor?: ProveedorStock;
  ubicacionId?: number;
  ubicacion?: UbicacionStock;
  estado: string;
  condicion: string;
  fechaCompra?: string;
  fechaVencimiento?: string;
  fechaUltimoMovimiento?: string;
  observaciones?: string;
  tags: string[];
  imagenes: string[];
  documentos: string[];
  creadoPorId: number;
  creadoPor: { id: number; nombre: string };
  creadoEn: string;
  actualizadoEn: string;
  _count?: { movimientos: number };
  movimientos?: MovimientoStock[];
  alertas?: AlertaStock[];
}

export interface CategoriaStock {
  id: number;
  nombre: string;
  descripcion?: string;
  icono?: string;
  color?: string;
  activo: boolean;
  creadoEn: string;
  _count?: { productos: number };
}

export interface UnidadMedida {
  id: number;
  nombre: string;
  abreviacion: string;
  tipo: string;
  activo: boolean;
  _count?: { productos: number };
}

export interface ProveedorStock {
  id: number;
  nombre: string;
  contacto?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  sitioWeb?: string;
  activo: boolean;
  creadoEn: string;
  _count?: { productos: number };
}

export interface UbicacionStock {
  id: number;
  nombre: string;
  descripcion?: string;
  tipo?: string;
  activo: boolean;
  creadoEn: string;
  _count?: { productos: number };
}

export interface TipoMovimiento {
  id: number;
  nombre: string;
  descripcion?: string;
  afectaStock: 'suma' | 'resta' | 'neutro' | 'ajuste';
  requiereOrigen: boolean;
  requiereDestino: boolean;
  color?: string;
  icono?: string;
  activo: boolean;
  _count?: { movimientos: number };
}

export interface MovimientoStock {
  id: number;
  numero: string;
  productoId: number;
  producto: { id: number; codigo: string; nombre: string };
  cantidad: number;
  stockAnterior: number;
  stockNuevo: number;
  tipoMovimientoId: number;
  tipoMovimiento: TipoMovimiento;
  origenId?: number;
  origen?: UbicacionStock;
  destinoId?: number;
  destino?: UbicacionStock;
  motivo?: string;
  observaciones?: string;
  numeroFactura?: string;
  numeroRemito?: string;
  costoUnitario?: number;
  costoTotal?: number;
  entregadoA?: string;
  realizadoPorId: number;
  realizadoPor: { id: number; nombre: string; username?: string; email?: string };
  fechaMovimiento: string;
  fechaRegistro: string;
  estado: string;
  aprobadoPorId?: number;
  aprobadoPor?: { id: number; nombre: string };
  fechaAprobacion?: string;
}

export interface AlertaStock {
  id: number;
  productoId: number;
  producto: { id: number; codigo: string; nombre: string; stockActual: number; stockMinimo: number };
  tipo: 'stock_bajo' | 'stock_agotado' | 'vencimiento_proximo' | 'vencido';
  mensaje: string;
  nivel: 'info' | 'warning' | 'error' | 'critical';
  activa: boolean;
  leida: boolean;
  creadoEn: string;
  leidaEn?: string;
  leidaPorId?: number;
  leidaPor?: { id: number; nombre: string };
}

export interface DashboardStock {
  resumen: {
    totalProductos: number;
    productosActivos: number;
    stockBajo: number;
    stockAgotado: number;
    alertasActivas: number;
    movimientosHoy: number;
    valorTotalStock: number;
  };
  distribucion: {
    porCategoria: Array<{ nombre: string; cantidad: number; color?: string }>;
    porUbicacion: Array<{ nombre: string; cantidad: number }>;
  };
  ultimosMovimientos: MovimientoStock[];
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// ===== API FUNCTIONS =====

// Dashboard
export const obtenerDashboardStock = async (): Promise<DashboardStock> => {
  const response = await api.get('/stock/dashboard');
  return response.data;
};

// Productos
export const obtenerProductos = async (params?: {
  categoria?: number | string;
  ubicacion?: number | string;
  proveedor?: number;
  estado?: string;
  stockBajo?: boolean | string;
  stockAgotado?: boolean | string;
  buscar?: string;
  page?: number;
  limit?: number;
}): Promise<{ productos: ProductoStock[]; pagination: any }> => {
  const response = await api.get('/stock/productos', { params });
  return response.data;
};

export const obtenerProductoPorId = async (id: number): Promise<ProductoStock> => {
  const response = await api.get(`/stock/productos/${id}`);
  return response.data;
};

export const crearProducto = async (producto: Partial<ProductoStock>): Promise<ProductoStock> => {
  const response = await api.post('/stock/productos', producto);
  return response.data;
};

export const actualizarProducto = async (id: number, producto: Partial<ProductoStock>): Promise<ProductoStock> => {
  const response = await api.put(`/stock/productos/${id}`, producto);
  return response.data;
};

export const eliminarProducto = async (id: number): Promise<{message: string, movimientosEliminados: number, alertasEliminadas: number}> => {
  try {
    const response = await api.delete(`/stock/productos/${id}`);
    return response.data;
  } catch (error: any) {
    console.error('Error en eliminarProducto:', error);
    if (error.response) {
      // El servidor respondió con un código de estado fuera del rango 2xx
      throw error;
    } else if (error.request) {
      // La petición fue hecha pero no se recibió respuesta
      throw new Error('No se pudo conectar con el servidor. Por favor, verifica tu conexión.');
    } else {
      // Algo pasó al configurar la petición
      throw new Error('Error al configurar la petición: ' + error.message);
    }
  }
};

// Movimientos
export const obtenerMovimientos = async (params?: {
  productoId?: number;
  tipoMovimiento?: number;
  fechaInicio?: string;
  fechaFin?: string;
  buscar?: string;
  realizadoPorId?: number;
  page?: number;
  limit?: number;
}): Promise<{ movimientos: MovimientoStock[]; pagination: any }> => {
  const response = await api.get('/stock/movimientos', { params });
  return response.data;
};

export const crearMovimiento = async (movimiento: {
  productoId: number;
  tipoMovimientoId: number;
  cantidad: number;
  origenId?: number;
  destinoId?: number;
  motivo?: string;
  observaciones?: string;
  numeroFactura?: string;
  numeroRemito?: string;
  costoUnitario?: number;
  costoTotal?: number;
}): Promise<MovimientoStock> => {
  const response = await api.post('/stock/movimientos', movimiento);
  return response.data;
};

// Alertas
export const obtenerAlertas = async (params?: {
  activa?: boolean;
  tipo?: string;
  nivel?: string;
}): Promise<AlertaStock[]> => {
  const response = await api.get('/stock/alertas', { params });
  return response.data;
};

export const marcarAlertaLeida = async (id: number): Promise<AlertaStock> => {
  const response = await api.put(`/stock/alertas/${id}/leida`);
  return response.data;
};

// Entidades auxiliares
export const obtenerCategorias = async (): Promise<CategoriaStock[]> => {
  const response = await api.get('/stock/categorias');
  return response.data;
};

export const crearCategoria = async (categoria: Partial<CategoriaStock>): Promise<CategoriaStock> => {
  const response = await api.post('/stock/categorias', categoria);
  return response.data;
};

export const actualizarCategoria = async (id: number, categoria: Partial<CategoriaStock>): Promise<CategoriaStock> => {
  const response = await api.put(`/stock/categorias/${id}`, categoria);
  return response.data;
};

export const eliminarCategoria = async (id: number): Promise<void> => {
  await api.delete(`/stock/categorias/${id}`);
};

export const obtenerUnidadesMedida = async (): Promise<UnidadMedida[]> => {
  const response = await api.get('/stock/unidades-medida');
  return response.data;
};

export const crearUnidadMedida = async (unidad: Partial<UnidadMedida>): Promise<UnidadMedida> => {
  const response = await api.post('/stock/unidades-medida', unidad);
  return response.data;
};

export const obtenerProveedores = async (): Promise<ProveedorStock[]> => {
  const response = await api.get('/stock/proveedores');
  return response.data;
};

export const crearProveedor = async (proveedor: Partial<ProveedorStock>): Promise<ProveedorStock> => {
  const response = await api.post('/stock/proveedores', proveedor);
  return response.data;
};

export const obtenerUbicaciones = async (): Promise<UbicacionStock[]> => {
  const response = await api.get('/stock/ubicaciones');
  return response.data;
};

export const crearUbicacion = async (ubicacion: Partial<UbicacionStock>): Promise<UbicacionStock> => {
  const response = await api.post('/stock/ubicaciones', ubicacion);
  return response.data;
};

export const obtenerTiposMovimiento = async (): Promise<TipoMovimiento[]> => {
  const response = await api.get('/stock/tipos-movimiento');
  return response.data;
};

export const crearTipoMovimiento = async (tipo: Partial<TipoMovimiento>): Promise<TipoMovimiento> => {
  const response = await api.post('/stock/tipos-movimiento', tipo);
  return response.data;
};
