import { Router } from 'express';
import {
  obtenerEquiposUsuario,
  obtenerEquipoUsuarioPorId,
  crearEquipoUsuario,
  actualizarEquipoUsuario,
  eliminarEquipoUsuario
} from '../controllers/equipos-usuario.controller';
import { verifyToken, requirePermission } from '../middlewares/auth.middleware';

const router = Router();

router.use(verifyToken);

// 📌 Rutas: /api/equipos-usuario
router.get('/', requirePermission(['cmdb:read', 'cmdb:manage']), obtenerEquiposUsuario);
router.get('/:id', requirePermission(['cmdb:read', 'cmdb:manage']), obtenerEquipoUsuarioPorId);
router.post('/', requirePermission(['cmdb:manage']), crearEquipoUsuario);
router.put('/:id', requirePermission(['cmdb:manage']), actualizarEquipoUsuario);
router.delete('/:id', requirePermission(['cmdb:manage']), eliminarEquipoUsuario);

export default router;

