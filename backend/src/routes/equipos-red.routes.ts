import { Router } from 'express';
import {
  obtenerEquiposRed,
  obtenerEquipoRedPorId,
  crearEquipoRed,
  actualizarEquipoRed,
  eliminarEquipoRed
} from '../controllers/equipos-red.controller';
import { verifyToken, requirePermission } from '../middlewares/auth.middleware';

const router = Router();

router.use(verifyToken);

// 📌 Rutas: /api/equipos-red
router.get('/', requirePermission(['cmdb:read', 'cmdb:manage']), obtenerEquiposRed);
router.get('/:id', requirePermission(['cmdb:read', 'cmdb:manage']), obtenerEquipoRedPorId);
router.post('/', requirePermission(['cmdb:manage']), crearEquipoRed);
router.put('/:id', requirePermission(['cmdb:manage']), actualizarEquipoRed);
router.delete('/:id', requirePermission(['cmdb:manage']), eliminarEquipoRed);

export default router;

