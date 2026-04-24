import { Router } from 'express';
import { verifyToken, requirePermission } from '../middlewares/auth.middleware';
import {
  getInterfaces,
  getInterfaceStats,
  getTopHosts,
  getActiveHosts,
  getHostStats,
  getTopApplications,
  getTopCountries,
  formatBytes,
  formatBps
} from '../services/ntopngService';

const router = Router();

console.log('✅ Módulo de rutas de tráfico cargado');

// Todas las rutas requieren autenticación
router.use(verifyToken);

// Ruta de prueba
router.get('/test', (req, res) => {
  console.log('✅ Ruta de prueba /test llamada');
  res.json({ message: 'Ruta de tráfico funcionando correctamente' });
});

// IMPORTANTE: Las rutas más específicas deben ir ANTES de las generales
// GET /api/trafico/interfaces/:ifid/stats - Obtener estadísticas de una interfaz
router.get('/interfaces/:ifid/stats', requirePermission('ver_monitor'), async (req, res) => {
  try {
    console.log('📊 Ruta /interfaces/:ifid/stats llamada, ifid:', req.params.ifid);
    const ifidParam = req.params.ifid;
    const ifid = ifidParam ? parseInt(ifidParam, 10) || 0 : 0;
    console.log('📊 Obteniendo estadísticas para ifid:', ifid);
    const stats = await getInterfaceStats(ifid);
    console.log('📊 Estadísticas obtenidas:', stats ? 'OK' : 'NULL');
    
    if (stats) {
      // Formatear los datos para facilitar su uso en el frontend
      const formattedStats = {
        ...stats,
        bytes_sent_formatted: stats.bytes_sent ? formatBytes(stats.bytes_sent) : '0 B',
        bytes_rcvd_formatted: stats.bytes_rcvd ? formatBytes(stats.bytes_rcvd) : '0 B',
        bytes_total_formatted: stats.bytes_sent && stats.bytes_rcvd 
          ? formatBytes(stats.bytes_sent + stats.bytes_rcvd) 
          : '0 B',
        bps_sent_formatted: stats.bps_sent ? formatBps(stats.bps_sent) : '0 bps',
        bps_rcvd_formatted: stats.bps_rcvd ? formatBps(stats.bps_rcvd) : '0 bps',
        bps_total_formatted: stats.bps_sent && stats.bps_rcvd 
          ? formatBps(stats.bps_sent + stats.bps_rcvd) 
          : '0 bps'
      };
      res.json(formattedStats);
    } else {
      res.status(404).json({ error: 'Interfaz no encontrada' });
    }
  } catch (error: any) {
    console.error('Error obteniendo estadísticas de interfaz:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas', details: error.message });
  }
});

// GET /api/trafico/interfaces - Obtener interfaces disponibles (debe ir DESPUÉS de la ruta específica)
router.get('/interfaces', requirePermission('ver_monitor'), async (req, res) => {
  try {
    console.log('📊 Ruta /interfaces llamada');
    const interfaces = await getInterfaces();
    console.log('📊 Interfaces obtenidas:', interfaces.length);
    res.json(interfaces);
  } catch (error: any) {
    console.error('Error obteniendo interfaces:', error);
    res.status(500).json({ error: 'Error al obtener interfaces', details: error.message });
  }
});

// GET /api/trafico/top/hosts - Obtener top hosts por tráfico
router.get('/top/hosts', requirePermission('ver_monitor'), async (req, res) => {
  try {
    const ifid = parseInt(req.query.ifid as string) || 0;
    const mode = (req.query.mode as string) || 'bytes'; // 'bytes', 'packets', 'flows'
    const limit = parseInt(req.query.limit as string) || 10;
    
    const topHosts = await getTopHosts(ifid, mode, limit);
    
    // Formatear los datos
    const formattedHosts = topHosts.map((host: any) => ({
      ...host,
      bytes_sent_formatted: host.bytes_sent ? formatBytes(host.bytes_sent) : '0 B',
      bytes_rcvd_formatted: host.bytes_rcvd ? formatBytes(host.bytes_rcvd) : '0 B',
      bytes_total_formatted: host.bytes_sent && host.bytes_rcvd 
        ? formatBytes(host.bytes_sent + host.bytes_rcvd) 
        : '0 B',
      bps_sent_formatted: host.bps_sent ? formatBps(host.bps_sent) : '0 bps',
      bps_rcvd_formatted: host.bps_rcvd ? formatBps(host.bps_rcvd) : '0 bps',
      bps_total_formatted: host.bps_sent && host.bps_rcvd 
        ? formatBps(host.bps_sent + host.bps_rcvd) 
        : '0 bps'
    }));
    
    res.json(formattedHosts);
  } catch (error: any) {
    console.error('Error obteniendo top hosts:', error);
    res.status(500).json({ error: 'Error al obtener top hosts', details: error.message });
  }
});

// GET /api/trafico/hosts/active - Obtener hosts activos
router.get('/hosts/active', requirePermission('ver_monitor'), async (req, res) => {
  try {
    const ifid = parseInt(req.query.ifid as string) || 0;
    const hosts = await getActiveHosts(ifid);
    res.json(hosts);
  } catch (error: any) {
    console.error('Error obteniendo hosts activos:', error);
    res.status(500).json({ error: 'Error al obtener hosts activos', details: error.message });
  }
});

// GET /api/trafico/hosts/:hostIp/stats - Obtener estadísticas de un host específico
router.get('/hosts/:hostIp/stats', requirePermission('ver_monitor'), async (req, res) => {
  try {
    const hostIp = req.params.hostIp;
    if (!hostIp) {
      return res.status(400).json({ error: 'Host IP requerida' });
    }
    const vlanId = parseInt(req.query.vlan as string) || 0;
    
    const stats = await getHostStats(hostIp, vlanId);
    
    if (stats) {
      // Formatear los datos
      const formattedStats = {
        ...stats,
        bytes_sent_formatted: stats.bytes_sent ? formatBytes(stats.bytes_sent) : '0 B',
        bytes_rcvd_formatted: stats.bytes_rcvd ? formatBytes(stats.bytes_rcvd) : '0 B',
        bytes_total_formatted: stats.bytes_sent && stats.bytes_rcvd 
          ? formatBytes(stats.bytes_sent + stats.bytes_rcvd) 
          : '0 B'
      };
      res.json(formattedStats);
    } else {
      res.status(404).json({ error: 'Host no encontrado' });
    }
  } catch (error: any) {
    console.error('Error obteniendo estadísticas de host:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas de host', details: error.message });
  }
});

// GET /api/trafico/top/applications - Obtener top aplicaciones
router.get('/top/applications', requirePermission('ver_monitor'), async (req, res) => {
  try {
    const ifid = parseInt(req.query.ifid as string) || 0;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const apps = await getTopApplications(ifid, limit);
    
    // Formatear los datos
    const formattedApps = apps.map((app: any) => ({
      ...app,
      bytes_formatted: app.bytes ? formatBytes(app.bytes) : '0 B',
      bps_formatted: app.bps ? formatBps(app.bps) : '0 bps'
    }));
    
    res.json(formattedApps);
  } catch (error: any) {
    console.error('Error obteniendo top aplicaciones:', error);
    res.status(500).json({ error: 'Error al obtener top aplicaciones', details: error.message });
  }
});

// GET /api/trafico/top/countries - Obtener top países
router.get('/top/countries', requirePermission('ver_monitor'), async (req, res) => {
  try {
    const ifid = parseInt(req.query.ifid as string) || 0;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const countries = await getTopCountries(ifid, limit);
    
    // Formatear los datos
    const formattedCountries = countries.map((country: any) => ({
      ...country,
      bytes_formatted: country.bytes ? formatBytes(country.bytes) : '0 B',
      bps_formatted: country.bps ? formatBps(country.bps) : '0 bps'
    }));
    
    res.json(formattedCountries);
  } catch (error: any) {
    console.error('Error obteniendo top países:', error);
    res.status(500).json({ error: 'Error al obtener top países', details: error.message });
  }
});

export default router;

