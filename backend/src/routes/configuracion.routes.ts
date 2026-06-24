import { Router } from 'express';
import { obtenerConfiguracion, actualizarConfiguracion, probarConexionZabbix } from '../controllers/configuracion.controller';
import { verifyToken, requireRole } from '../middlewares/auth.middleware';

const router = Router();

router.use(verifyToken);

router.get('/', obtenerConfiguracion);
router.put('/', requireRole('admin'), actualizarConfiguracion);
router.post('/zabbix-test', requireRole('admin'), probarConexionZabbix);

export default router;
