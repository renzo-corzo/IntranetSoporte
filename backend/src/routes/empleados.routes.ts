import { Router } from 'express';
import {
  getEmpleados,
  getDepartamentos,
  getEstadisticas,
  createEmpleado,
  updateEmpleado,
  deleteEmpleado,
  calcularDiasSugeridos
} from '../controllers/empleados.controller';
import { verifyToken, requirePermission } from '../middlewares/auth.middleware';

const router = Router();

router.use(verifyToken);

// 📌 Ruta: /api/empleados
router.get('/', requirePermission(['rrhh:ver', 'empleados:read']), getEmpleados); // Listar empleados
router.post('/', requirePermission(['rrhh:ver', 'empleados:manage']), createEmpleado); // Crear empleado
router.put('/:id', requirePermission(['rrhh:ver', 'empleados:manage']), updateEmpleado); // Actualizar empleado
router.delete('/:id', requirePermission(['rrhh:ver', 'empleados:manage']), deleteEmpleado); // Eliminar empleado

// 📌 Ruta: /api/empleados/departamentos
router.get('/departamentos', requirePermission(['rrhh:ver', 'empleados:read']), getDepartamentos);

// 📌 Ruta: /api/empleados/estadisticas
router.get('/estadisticas', requirePermission(['rrhh:ver', 'rrhh:stats']), getEstadisticas);

// 📌 Ruta: /api/empleados/:id/calcular-dias - Calcular días sugeridos según convenio
router.get('/:id/calcular-dias', requirePermission(['rrhh:ver', 'empleados:read']), calcularDiasSugeridos);

export default router;