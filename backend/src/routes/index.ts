import { Router } from 'express';
import authRoutes from './auth.routes';
import { verifyToken } from '../middlewares/auth.middleware';
import relevamientoRoutes from "./relevamiento.routes";
import zabbixRoutes from "./zabbix.routes";
import tareaRoutes from "./tarea.routes";
import procedimientoRoutes from "./procedimiento.routes";
import usuarioRoutes from "./usuario.routes";
// import empleadoRoutes from "./empleado.routes"; // Comentado - usando empleados.routes.ts
import linkRoutes from "./link.routes";
import kbRoutes from "./kb.routes";
import categoriaTareaRoutes from "./categoriaTarea.routes";
import uploadRoutes from "./upload.routes";
import stockRoutes from "./stock.routes";
import vacacionesRoutes from "./vacaciones.routes";
import empleadosRoutes from "./empleados.routes";
import licenciasRoutes from "./licencias.routes";
import documentosRoutes from "./documentos.routes";
import traficoRoutes from "./trafico.routes";

const router = Router();

router.use('/auth', authRoutes);
router.use("/relevamientos", relevamientoRoutes);
router.use("/zabbix", zabbixRoutes);
router.use("/tareas", tareaRoutes);
router.use("/categorias-tarea", categoriaTareaRoutes);
router.use("/procedimientos", procedimientoRoutes);
router.use("/usuarios", usuarioRoutes);
// router.use("/empleados", empleadoRoutes); // Comentado - usando empleados.routes.ts
router.use("/links", linkRoutes);
router.use("/kb", kbRoutes);
router.use("/upload", uploadRoutes);
router.use("/stock", stockRoutes);
router.use('/vacaciones', vacacionesRoutes);
router.use('/empleados', empleadosRoutes);
router.use('/licencias', licenciasRoutes);
router.use('/documentos', documentosRoutes);
router.use('/trafico', traficoRoutes);

router.get('/', (req, res) => {
  res.json({ 
    message: 'API de Infraestructura Caja de Abogados funcionando',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

router.get('/protegido', verifyToken, (req, res) => {
  res.json({ message: 'Acceso concedido a la ruta protegida', user: (req as any).user });
});

// Aquí se agregarán más rutas (servidores, redes, etc.)

export default router; 