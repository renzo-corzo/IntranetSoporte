import { Router } from 'express';
import {
  getDashboardStats,
  busquedaGlobal
} from '../controllers/cmdb-dashboard.controller';
import {
  getZabbixHosts,
  sincronizarHost,
  buscarCoincidencias
} from '../controllers/cmdb-zabbix.controller';
import { verifyToken, requirePermission } from '../middlewares/auth.middleware';
import { requireEmpresa, requireModulo } from '../middlewares/empresa.middleware';

const router = Router();

router.use(verifyToken);
router.use(requireEmpresa);
router.use(requireModulo('cmdb'));

// 📌 Rutas: /api/cmdb/dashboard
router.get('/stats', requirePermission(['cmdb:read', 'cmdb:manage']), getDashboardStats);
router.get('/busqueda', requirePermission(['cmdb:read', 'cmdb:manage']), busquedaGlobal);

// 📌 Rutas: /api/cmdb/zabbix
router.get('/zabbix/hosts', requirePermission(['cmdb:read', 'cmdb:manage']), getZabbixHosts);
router.post('/zabbix/sincronizar', requirePermission(['cmdb:manage']), sincronizarHost);
router.get('/zabbix/coincidencias', requirePermission(['cmdb:read', 'cmdb:manage']), buscarCoincidencias);

export default router;

