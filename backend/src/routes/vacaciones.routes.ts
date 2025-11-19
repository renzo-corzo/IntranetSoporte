import { Router } from 'express';
import { verifyToken, requirePermission } from '../middlewares/auth.middleware';
import {
  getVacaciones,
  createVacacion,
  aprobarVacacion,
  rechazarVacacion,
  cancelarVacacion,
  eliminarVacacion
} from '../controllers/vacaciones.controller';

const router = Router();

// Todas las rutas requieren autenticación
router.use(verifyToken);

// GET /api/vacaciones - Obtener todas las vacaciones
router.get('/', requirePermission(['rrhh:ver', 'vacaciones:read']), getVacaciones);

// POST /api/vacaciones - Crear nueva solicitud de vacaciones (RRHH)
router.post('/', requirePermission(['rrhh:ver', 'vacaciones:manage']), createVacacion);

// PUT /api/vacaciones/:id/aprobar - Aprobar vacación (requiere permisos especiales)
router.put('/:id/aprobar', requirePermission(['rrhh:ver', 'vacaciones:approve']), aprobarVacacion);

// PUT /api/vacaciones/:id/rechazar - Rechazar vacación (requiere permisos especiales)
router.put('/:id/rechazar', requirePermission(['rrhh:ver', 'vacaciones:approve']), rechazarVacacion);

// PUT /api/vacaciones/:id/cancelar - Cancelar vacación
router.put('/:id/cancelar', requirePermission(['rrhh:ver', 'vacaciones:manage']), cancelarVacacion);

// DELETE /api/vacaciones/:id - Eliminar vacación (solo para corrección de errores)
router.delete('/:id', requirePermission(['rrhh:ver', 'vacaciones:manage']), eliminarVacacion);

export default router;