import { Router } from 'express';
import { obtenerEmpresas, crearEmpresa, actualizarEmpresa } from '../controllers/empresa.controller';
import { verifyToken, requireRole } from '../middlewares/auth.middleware';

const router = Router();

router.use(verifyToken);

// 📌 Rutas: /api/empresas
router.get('/', obtenerEmpresas);
router.post('/', requireRole('admin'), crearEmpresa);
router.put('/:id', requireRole('admin'), actualizarEmpresa);

export default router;
