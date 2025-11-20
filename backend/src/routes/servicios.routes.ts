import { Router } from 'express';
import {
  obtenerServicios,
  obtenerServicioPorId,
  crearServicio,
  actualizarServicio,
  eliminarServicio
} from '../controllers/servicios.controller';
import { verifyToken, requirePermission } from '../middlewares/auth.middleware';

const router = Router();

router.use(verifyToken);

// 📌 Rutas: /api/servicios
router.get('/', requirePermission(['cmdb:read', 'cmdb:manage']), obtenerServicios);
router.get('/:id', requirePermission(['cmdb:read', 'cmdb:manage']), obtenerServicioPorId);
router.post('/', requirePermission(['cmdb:manage']), crearServicio);
router.put('/:id', requirePermission(['cmdb:manage']), actualizarServicio);
router.delete('/:id', requirePermission(['cmdb:manage']), eliminarServicio);

export default router;

