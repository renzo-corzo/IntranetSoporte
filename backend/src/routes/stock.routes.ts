import { Router } from 'express';
import { verifyToken, requirePermission } from '../middlewares/auth.middleware';
import { requireEmpresa, requireModulo } from '../middlewares/empresa.middleware';
import {
  obtenerProductos,
  obtenerProductoPorId,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
  obtenerMovimientos,
  crearMovimiento,
  obtenerAlertas,
  marcarAlertaLeida
} from '../controllers/stock.controller';

import {
  obtenerCategorias,
  crearCategoria,
  actualizarCategoria,
  eliminarCategoria,
  obtenerUnidadesMedida,
  crearUnidadMedida,
  actualizarUnidadMedida,
  obtenerProveedores,
  crearProveedor,
  actualizarProveedor,
  obtenerUbicaciones,
  crearUbicacion,
  actualizarUbicacion,
  obtenerTiposMovimiento,
  crearTipoMovimiento,
  actualizarTipoMovimiento,
  obtenerDashboardStock
} from '../controllers/stock-auxiliares.controller';

const router = Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(verifyToken);
router.use(requireEmpresa);
router.use(requireModulo('stock'));

// ===== DASHBOARD =====
router.get('/dashboard', requirePermission('stock:read'), obtenerDashboardStock);

// ===== PRODUCTOS =====
router.get('/productos', requirePermission('stock:read'), obtenerProductos);
router.get('/productos/:id', requirePermission('stock:read'), obtenerProductoPorId);
router.post('/productos', requirePermission('stock:create'), crearProducto);
router.put('/productos/:id', requirePermission('stock:update'), actualizarProducto);
router.delete('/productos/:id', requirePermission('stock:delete'), eliminarProducto);

// ===== MOVIMIENTOS =====
router.get('/movimientos', requirePermission('stock:read'), obtenerMovimientos);
router.post('/movimientos', requirePermission('stock:create'), crearMovimiento);

// ===== ALERTAS =====
router.get('/alertas', requirePermission('stock:read'), obtenerAlertas);
router.put('/alertas/:id/leida', requirePermission('stock:update'), marcarAlertaLeida);

// ===== CATEGORÍAS =====
router.get('/categorias', requirePermission('stock:read'), obtenerCategorias);
router.post('/categorias', requirePermission('stock:create'), crearCategoria);
router.put('/categorias/:id', requirePermission('stock:update'), actualizarCategoria);
router.delete('/categorias/:id', requirePermission('stock:delete'), eliminarCategoria);

// ===== UNIDADES DE MEDIDA =====
router.get('/unidades-medida', requirePermission('stock:read'), obtenerUnidadesMedida);
router.post('/unidades-medida', requirePermission('stock:create'), crearUnidadMedida);
router.put('/unidades-medida/:id', requirePermission('stock:update'), actualizarUnidadMedida);

// ===== PROVEEDORES =====
router.get('/proveedores', requirePermission('stock:read'), obtenerProveedores);
router.post('/proveedores', requirePermission('stock:create'), crearProveedor);
router.put('/proveedores/:id', requirePermission('stock:update'), actualizarProveedor);

// ===== UBICACIONES =====
router.get('/ubicaciones', requirePermission('stock:read'), obtenerUbicaciones);
router.post('/ubicaciones', requirePermission('stock:create'), crearUbicacion);
router.put('/ubicaciones/:id', requirePermission('stock:update'), actualizarUbicacion);

// ===== TIPOS DE MOVIMIENTO =====
router.get('/tipos-movimiento', requirePermission('stock:read'), obtenerTiposMovimiento);
router.post('/tipos-movimiento', requirePermission('stock:create'), crearTipoMovimiento);
router.put('/tipos-movimiento/:id', requirePermission('stock:update'), actualizarTipoMovimiento);

export default router;

