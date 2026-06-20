import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';

// Import routes
import authRoutes from './routes/auth.routes';
import usuarioRoutes from './routes/usuario.routes';
import empleadosRoutes from './routes/empleados.routes';
import licenciasRoutes from './routes/licencias.routes';
import documentosRoutes from './routes/documentos.routes';
import stockRoutes from './routes/stock.routes';
import tareaRoutes from './routes/tarea.routes';
import procedimientoRoutes from './routes/procedimiento.routes';
import relevamientoRoutes from './routes/relevamiento.routes';
import kbRoutes from './routes/kb.routes';
import linkRoutes from './routes/link.routes';
import categoriaTareaRoutes from './routes/categoriaTarea.routes';
import uploadRoutes from './routes/upload.routes';
import zabbixRoutes from './routes/zabbix.routes';
import vacacionesRoutes from './routes/vacaciones.routes';
import servidoresFisicosRoutes from './routes/servidores-fisicos.routes';
import maquinasVirtualesRoutes from './routes/maquinas-virtuales.routes';
import equiposRedRoutes from './routes/equipos-red.routes';
import equiposUsuarioRoutes from './routes/equipos-usuario.routes';
import serviciosRoutes from './routes/servicios.routes';
import cmdbDashboardRoutes from './routes/cmdb-dashboard.routes';
import credencialesRoutes from './routes/credenciales.routes';
import empresaRoutes from './routes/empresa.routes';
import configuracionRoutes from './routes/configuracion.routes';
import prisma from './lib/prisma';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

// Servir archivos estáticos desde la carpeta uploads (configurable vía UPLOAD_DIR, ej. disco persistente en Render)
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '../uploads');
app.use('/uploads', express.static(UPLOAD_DIR));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/empleados', empleadosRoutes);
app.use('/api/licencias', licenciasRoutes);
app.use('/api/documentos', documentosRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/tareas', tareaRoutes);
app.use('/api/procedimientos', procedimientoRoutes);
app.use('/api/relevamientos', relevamientoRoutes);
app.use('/api/kb', kbRoutes);
app.use('/api/links', linkRoutes);
app.use('/api/categoria-tareas', categoriaTareaRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/zabbix', zabbixRoutes);
app.use('/api/vacaciones', vacacionesRoutes);
app.use('/api/servidores-fisicos', servidoresFisicosRoutes);
app.use('/api/maquinas-virtuales', maquinasVirtualesRoutes);
app.use('/api/equipos-red', equiposRedRoutes);
app.use('/api/equipos-usuario', equiposUsuarioRoutes);
app.use('/api/servicios', serviciosRoutes);
app.use('/api/cmdb', cmdbDashboardRoutes);
app.use('/api/credenciales', credencialesRoutes);
app.use('/api/empresas', empresaRoutes);
app.use('/api/configuracion', configuracionRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📡 API disponible en http://localhost:${PORT}/api`);
  console.log(`🌐 Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(`💾 Base de datos: ${process.env.DATABASE_URL ? 'Conectada' : 'No configurada'}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Cerrando servidor...');
  await prisma.$disconnect();
  process.exit(0);
});

export default app;