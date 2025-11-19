import { Router } from 'express';
import { verifyToken, requirePermission } from '../middlewares/auth.middleware';
import {
  getLicencias,
  createLicencia,
  updateLicencia,
  deleteLicencia,
  getTiposLicencia
} from '../controllers/licencias.controller';

const router = Router();

// Todas las rutas requieren autenticación
router.use(verifyToken);

// GET /api/licencias - Obtener todas las licencias
router.get('/', requirePermission(['rrhh:ver', 'licencias:read']), getLicencias);

// GET /api/licencias/tipos - Obtener tipos de licencia
router.get('/tipos', requirePermission(['rrhh:ver', 'licencias:read']), getTiposLicencia);

// POST /api/licencias - Crear nueva licencia
router.post('/', requirePermission(['rrhh:ver', 'licencias:manage']), createLicencia);

// PUT /api/licencias/:id - Actualizar licencia
router.put('/:id', requirePermission(['rrhh:ver', 'licencias:manage']), updateLicencia);

// DELETE /api/licencias/:id - Eliminar licencia
router.delete('/:id', requirePermission(['rrhh:ver', 'licencias:manage']), deleteLicencia);

export default router;