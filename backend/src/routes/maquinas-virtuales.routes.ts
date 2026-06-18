import { Router } from 'express';
import {
  obtenerMaquinasVirtuales,
  obtenerMaquinaVirtualPorId,
  crearMaquinaVirtual,
  actualizarMaquinaVirtual,
  eliminarMaquinaVirtual
} from '../controllers/maquinas-virtuales.controller';
import { verifyToken, requirePermission } from '../middlewares/auth.middleware';
import { requireEmpresa } from '../middlewares/empresa.middleware';

const router = Router();

router.use(verifyToken);
router.use(requireEmpresa);

// 📌 Rutas: /api/maquinas-virtuales
router.get('/', requirePermission(['cmdb:read', 'cmdb:manage']), obtenerMaquinasVirtuales);
router.get('/:id', requirePermission(['cmdb:read', 'cmdb:manage']), obtenerMaquinaVirtualPorId);
router.post('/', requirePermission(['cmdb:manage']), crearMaquinaVirtual);
router.put('/:id', requirePermission(['cmdb:manage']), actualizarMaquinaVirtual);
router.delete('/:id', requirePermission(['cmdb:manage']), eliminarMaquinaVirtual);

export default router;

