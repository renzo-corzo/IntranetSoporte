import { Router } from 'express';
import { verifyToken, requirePermission } from '../middlewares/auth.middleware';
import { upload } from '../middlewares/upload.middleware';
import {
  getDocumentosEmpleado,
  uploadDocumento,
  downloadDocumento,
  deleteDocumento,
  getTiposDocumento
} from '../controllers/documentos.controller';

const router = Router();

// Todas las rutas requieren autenticación
router.use(verifyToken);

// GET /api/documentos/tipos - Obtener tipos de documento
router.get('/tipos', requirePermission(['rrhh:ver', 'documentos_rrhh:read']), getTiposDocumento);

// GET /api/documentos/empleado/:empleadoId - Obtener documentos de un empleado
router.get('/empleado/:empleadoId', requirePermission(['rrhh:ver', 'documentos_rrhh:read']), getDocumentosEmpleado);

// POST /api/documentos/empleado/:empleadoId - Subir documento
router.post(
  '/empleado/:empleadoId',
  requirePermission(['rrhh:ver', 'documentos_rrhh:manage']),
  upload.single('archivo'),
  uploadDocumento
);

// GET /api/documentos/:id/download - Descargar documento
router.get('/:id/download', requirePermission(['rrhh:ver', 'documentos_rrhh:read']), downloadDocumento);

// DELETE /api/documentos/:id - Eliminar documento
router.delete('/:id', requirePermission(['rrhh:ver', 'documentos_rrhh:manage']), deleteDocumento);

export default router;
