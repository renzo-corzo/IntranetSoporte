import { Request, Response } from 'express';
import { zabbixLogin, getZabbixHostsFull } from '../services/zabbixService';
import axios from 'axios';
import prisma from '../lib/prisma';

const ZABBIX_URL = "http://192.168.123.6/zabbix/api_jsonrpc.php";

// Obtener hosts de Zabbix para sincronización
export const getZabbixHosts = async (req: Request, res: Response) => {
  try {
    const token = await zabbixLogin();
    const hosts = await getZabbixHostsFull(token);

    // Obtener uptime para cada host
    const hostsConUptime = await Promise.all(
      hosts.map(async (host: any) => {
        let uptimeSeconds: number | null = null;
        let uptimeFormatted: string | null = null;
        
        try {
          const uptimeResp: any = await axios.post(ZABBIX_URL, {
            jsonrpc: "2.0",
            method: "item.get",
            params: {
              hostids: host.hostid,
              search: {
                key_: "system.uptime"
              },
              output: ["itemid", "lastvalue", "lastclock"]
            },
            auth: token,
            id: 1
          });

          if (uptimeResp.data.result && uptimeResp.data.result.length > 0) {
            const item = uptimeResp.data.result[0];
            uptimeSeconds = parseInt(item.lastvalue) || null;
            
            if (uptimeSeconds) {
              const days = Math.floor(uptimeSeconds / 86400);
              const hours = Math.floor((uptimeSeconds % 86400) / 3600);
              const minutes = Math.floor((uptimeSeconds % 3600) / 60);
              const parts = [];
              if (days > 0) parts.push(`${days}d`);
              if (hours > 0) parts.push(`${hours}h`);
              if (minutes > 0) parts.push(`${minutes}m`);
              uptimeFormatted = parts.length > 0 ? parts.join(" ") : `${Math.floor(uptimeSeconds)}s`;
            }
          }
        } catch (error) {
          console.error(`Error obteniendo uptime para host ${host.hostid}:`, error);
        }

        // Obtener IP principal
        const ipPrincipal = host.interfaces && host.interfaces.length > 0 
          ? host.interfaces[0].ip 
          : null;

        return {
          hostid: host.hostid,
          name: host.name,
          ip: ipPrincipal,
          status: host.status === '0' ? 'ACTIVO' : 'INACTIVO',
          uptime: uptimeFormatted,
          uptimeSeconds: uptimeSeconds,
          groups: host.groups ? host.groups.map((g: any) => g.name) : [],
          inventory: host.inventory || {}
        };
      })
    );

    res.json({
      success: true,
      hosts: hostsConUptime
    });
  } catch (error) {
    console.error('Error al obtener hosts de Zabbix:', error);
    res.status(500).json({ error: 'Error al obtener hosts de Zabbix' });
  }
};

// Sincronizar un host de Zabbix con el CMDB
export const sincronizarHost = async (req: Request, res: Response) => {
  try {
    const { zabbixHostId, cmdbTipo, cmdbId, accion } = req.body;
    const empresaId = (req as any).empresaId;

    console.log('🛰️ sincronizarHost payload:', {
      zabbixHostId,
      cmdbTipo,
      cmdbId,
      accion,
    });

    if (!zabbixHostId || !cmdbTipo || !accion) {
      return res.status(400).json({ error: 'Parámetros requeridos: zabbixHostId, cmdbTipo, accion' });
    }

    const token = await zabbixLogin();
    const hosts = await getZabbixHostsFull(token);
    const zabbixHost = hosts.find((h: any) => h.hostid === zabbixHostId);

    if (!zabbixHost) {
      return res.status(404).json({ error: 'Host de Zabbix no encontrado' });
    }

    // Obtener uptime
    let uptimeSeconds: number | null = null;
    try {
      const uptimeResp: any = await axios.post(ZABBIX_URL, {
        jsonrpc: "2.0",
        method: "item.get",
        params: {
          hostids: zabbixHost.hostid,
          search: { key_: "system.uptime" },
          output: ["lastvalue"]
        },
        auth: token,
        id: 1
      });
      if (uptimeResp.data.result && uptimeResp.data.result.length > 0) {
        uptimeSeconds = parseInt(uptimeResp.data.result[0].lastvalue) || null;
      }
    } catch (error) {
      console.error('Error obteniendo uptime:', error);
    }

    const ipPrincipal = zabbixHost.interfaces && zabbixHost.interfaces.length > 0 
      ? zabbixHost.interfaces[0].ip 
      : null;

    // Determinar estado basado en Zabbix
    const estadoZabbix = zabbixHost.status === '0' ? 'PRODUCCION' : 'FUERA_DE_SERVICIO';

    // Detectar tipo de equipo de red basado en el nombre
    const detectarTipoEquipoRed = (nombre: string): 'MIKROTIK' | 'PFSENSE' | 'SWITCH' | 'ACCESS_POINT' | 'ROUTER' | 'FIREWALL' | 'OTRO' => {
      const nombreUpper = nombre.toUpperCase();
      if (nombreUpper.includes('MIKROTIK')) {
        return 'MIKROTIK';
      }
      if (nombreUpper.includes('PFSENSE')) {
        return 'PFSENSE';
      }
      if (nombreUpper.includes('SWITCH')) {
        return 'SWITCH';
      }
      if (nombreUpper.includes('AP ') || nombreUpper.includes('ACCESS POINT') || nombreUpper.includes('ACCESS_POINT') || nombreUpper.includes('WIFI')) {
        return 'ACCESS_POINT';
      }
      if (nombreUpper.includes('FIREWALL')) {
        return 'FIREWALL';
      }
      if (nombreUpper.includes('GATEWAY') || nombreUpper.includes('ROUTER')) {
        return 'ROUTER';
      }
      // Por defecto
      return 'OTRO';
    };

    if (accion === 'crear') {
      // Crear nuevo equipo en CMDB basado en el tipo
      if (cmdbTipo === 'servidor') {
        const nuevoServidor = await prisma.servidorFisico.create({
          data: {
            empresaId,
            nombre: zabbixHost.name,
            ip: ipPrincipal,
            estado: estadoZabbix,
            notasTecnicas: `Sincronizado desde Zabbix. Host ID: ${zabbixHost.hostid}. Uptime: ${uptimeSeconds ? `${Math.floor(uptimeSeconds / 86400)} días` : 'N/A'}`
          }
        });
        return res.json({ success: true, equipo: nuevoServidor, tipo: 'servidor' });
      } else if (cmdbTipo === 'vm') {
        const nuevaVM = await prisma.maquinaVirtual.create({
          data: {
            empresaId,
            nombre: zabbixHost.name,
            ip: ipPrincipal,
            estado: estadoZabbix,
            notasTecnicas: `Sincronizado desde Zabbix. Host ID: ${zabbixHost.hostid}. Uptime: ${uptimeSeconds ? `${Math.floor(uptimeSeconds / 86400)} días` : 'N/A'}`
          }
        });
        return res.json({ success: true, equipo: nuevaVM, tipo: 'vm' });
      } else if (cmdbTipo === 'red') {
        const tipoEquipoRed = detectarTipoEquipoRed(zabbixHost.name);
        const nuevoEquipoRed = await prisma.equipoRed.create({
          data: {
            empresaId,
            nombre: zabbixHost.name,
            ip: ipPrincipal,
            tipo: tipoEquipoRed,
            estado: estadoZabbix,
            notasTecnicas: `Sincronizado desde Zabbix. Host ID: ${zabbixHost.hostid}. Uptime: ${uptimeSeconds ? `${Math.floor(uptimeSeconds / 86400)} días` : 'N/A'}`
          }
        });
        return res.json({ success: true, equipo: nuevoEquipoRed, tipo: 'red' });
      } else if (cmdbTipo === 'usuario') {
        // Detectar tipo de equipo de usuario basado en el nombre
        const detectarTipoEquipoUsuario = (nombre: string): 'PC' | 'NOTEBOOK' | 'IMPRESORA' | 'MONITOR' | 'TECLADO' | 'MOUSE' | 'OTRO' => {
          const nombreUpper = nombre.toUpperCase();
          if (nombreUpper.includes('IMPRESORA') || nombreUpper.includes('PRINTER')) {
            return 'IMPRESORA';
          }
          if (nombreUpper.includes('ESCANER') || nombreUpper.includes('SCANNER')) {
            return 'IMPRESORA'; // Los escáneres también se clasifican como impresoras
          }
          if (nombreUpper.includes('NOTEBOOK') || nombreUpper.includes('LAPTOP')) {
            return 'NOTEBOOK';
          }
          if (nombreUpper.includes('PC ') || nombreUpper.includes('DESKTOP')) {
            return 'PC';
          }
          if (nombreUpper.includes('MONITOR')) {
            return 'MONITOR';
          }
          return 'OTRO';
        };
        
        const tipoEquipoUsuario = detectarTipoEquipoUsuario(zabbixHost.name);
        const nuevoEquipoUsuario = await prisma.equipoUsuario.create({
          data: {
            empresaId,
            nombre: zabbixHost.name,
            ip: ipPrincipal,
            tipo: tipoEquipoUsuario,
            estado: estadoZabbix,
            notasTecnicas: `Sincronizado desde Zabbix. Host ID: ${zabbixHost.hostid}. Uptime: ${uptimeSeconds ? `${Math.floor(uptimeSeconds / 86400)} días` : 'N/A'}`
          }
        });
        return res.json({ success: true, equipo: nuevoEquipoUsuario, tipo: 'usuario' });
      }
    } else if (accion === 'actualizar' && cmdbId) {
      // Actualizar equipo existente (verificando que pertenezca al cliente activo)
      const modeloPorTipo: Record<string, any> = {
        servidor: prisma.servidorFisico,
        vm: prisma.maquinaVirtual,
        red: prisma.equipoRed,
        usuario: prisma.equipoUsuario,
      };
      const modelo = modeloPorTipo[cmdbTipo];
      if (modelo) {
        const existente = await modelo.findUnique({ where: { id: cmdbId } });
        if (!existente || existente.empresaId !== empresaId) {
          return res.status(404).json({ error: 'Equipo no encontrado en este cliente' });
        }
      }

      if (cmdbTipo === 'servidor') {
        const servidor = await prisma.servidorFisico.update({
          where: { id: cmdbId },
          data: {
            ip: ipPrincipal || undefined,
            estado: estadoZabbix,
            notasTecnicas: `Actualizado desde Zabbix. Host ID: ${zabbixHost.hostid}. Uptime: ${uptimeSeconds ? `${Math.floor(uptimeSeconds / 86400)} días` : 'N/A'}`
          }
        });
        return res.json({ success: true, equipo: servidor, tipo: 'servidor' });
      } else if (cmdbTipo === 'vm') {
        const vm = await prisma.maquinaVirtual.update({
          where: { id: cmdbId },
          data: {
            ip: ipPrincipal || undefined,
            estado: estadoZabbix,
            notasTecnicas: `Actualizado desde Zabbix. Host ID: ${zabbixHost.hostid}. Uptime: ${uptimeSeconds ? `${Math.floor(uptimeSeconds / 86400)} días` : 'N/A'}`
          }
        });
        return res.json({ success: true, equipo: vm, tipo: 'vm' });
      } else if (cmdbTipo === 'red') {
        const equipoRed = await prisma.equipoRed.update({
          where: { id: cmdbId },
          data: {
            ip: ipPrincipal || undefined,
            estado: estadoZabbix,
            notasTecnicas: `Actualizado desde Zabbix. Host ID: ${zabbixHost.hostid}. Uptime: ${uptimeSeconds ? `${Math.floor(uptimeSeconds / 86400)} días` : 'N/A'}`
          }
        });
        return res.json({ success: true, equipo: equipoRed, tipo: 'red' });
      } else if (cmdbTipo === 'usuario') {
        const equipoUsuario = await prisma.equipoUsuario.update({
          where: { id: cmdbId },
          data: {
            ip: ipPrincipal || undefined,
            estado: estadoZabbix,
            notasTecnicas: `Actualizado desde Zabbix. Host ID: ${zabbixHost.hostid}. Uptime: ${uptimeSeconds ? `${Math.floor(uptimeSeconds / 86400)} días` : 'N/A'}`
          }
        });
        return res.json({ success: true, equipo: equipoUsuario, tipo: 'usuario' });
      }
    }

    return res.status(400).json({ error: 'Acción o tipo no válido' });
  } catch (error) {
    console.error('Error al sincronizar host:', error);
    res.status(500).json({ error: 'Error al sincronizar host' });
  }
};

// Buscar coincidencias entre Zabbix y CMDB
export const buscarCoincidencias = async (req: Request, res: Response) => {
  try {
    const empresaId = (req as any).empresaId;
    const token = await zabbixLogin();
    const hosts = await getZabbixHostsFull(token);

    const coincidencias = await Promise.all(
      hosts.map(async (host: any) => {
        const ipPrincipal = host.interfaces && host.interfaces.length > 0
          ? host.interfaces[0].ip
          : null;

        // Buscar por IP
        const porIP = ipPrincipal ? await prisma.servidorFisico.findFirst({
          where: { empresaId, ip: ipPrincipal }
        }) : null;

        // Buscar por nombre
        const porNombre = await prisma.servidorFisico.findFirst({
          where: { empresaId, nombre: host.name }
        });

        // Buscar en VMs
        const vmPorIP = ipPrincipal ? await prisma.maquinaVirtual.findFirst({
          where: { empresaId, ip: ipPrincipal }
        }) : null;
        const vmPorNombre = await prisma.maquinaVirtual.findFirst({
          where: { empresaId, nombre: host.name }
        });

        // Buscar en equipos de red
        const redPorIP = ipPrincipal ? await prisma.equipoRed.findFirst({
          where: { empresaId, ip: ipPrincipal }
        }) : null;
        const redPorNombre = await prisma.equipoRed.findFirst({
          where: { empresaId, nombre: host.name }
        });

        return {
          zabbixHost: {
            hostid: host.hostid,
            name: host.name,
            ip: ipPrincipal
          },
          coincidencias: {
            servidor: porIP || porNombre,
            vm: vmPorIP || vmPorNombre,
            red: redPorIP || redPorNombre
          }
        };
      })
    );

    res.json({
      success: true,
      coincidencias
    });
  } catch (error) {
    console.error('Error al buscar coincidencias:', error);
    res.status(500).json({ error: 'Error al buscar coincidencias' });
  }
};



