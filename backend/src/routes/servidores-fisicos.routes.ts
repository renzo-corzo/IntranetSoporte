import { Router } from 'express';
import {
  obtenerServidoresFisicos,
  obtenerServidorFisicoPorId,
  crearServidorFisico,
  actualizarServidorFisico,
  eliminarServidorFisico
} from '../controllers/servidores-fisicos.controller';
import { verifyToken, requirePermission } from '../middlewares/auth.middleware';

const router = Router();

router.use(verifyToken);

// 📌 Rutas: /api/servidores-fisicos
router.get('/', requirePermission(['cmdb:read', 'cmdb:manage']), obtenerServidoresFisicos);
router.get('/:id', requirePermission(['cmdb:read', 'cmdb:manage']), obtenerServidorFisicoPorId);
router.post('/', requirePermission(['cmdb:manage']), crearServidorFisico);
router.put('/:id', requirePermission(['cmdb:manage']), actualizarServidorFisico);
router.delete('/:id', requirePermission(['cmdb:manage']), eliminarServidorFisico);

export default router;

