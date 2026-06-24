import axios from "axios";
import prisma from "../lib/prisma";
import { decrypt } from "../utils/crypto";

export interface ZabbixConfig {
  url: string;
  usuario: string;
  password: string;
}

// Resuelve la config de Zabbix del cliente activo (cada empresa tiene su
// propio servidor). Devuelve null si el cliente no la completó todavía.
export async function getZabbixConfigForEmpresa(empresaId: string): Promise<ZabbixConfig | null> {
  const empresa = await prisma.empresa.findUnique({ where: { id: empresaId } });

  if (!empresa?.zabbixUrl || !empresa.zabbixUsuario || !empresa.zabbixPasswordCifrada || !empresa.zabbixIv || !empresa.zabbixAuthTag) {
    return null;
  }

  return {
    url: empresa.zabbixUrl,
    usuario: empresa.zabbixUsuario,
    password: decrypt(empresa.zabbixPasswordCifrada, empresa.zabbixIv, empresa.zabbixAuthTag)
  };
}

// Interfaces para tipado de respuestas de Zabbix
interface ZabbixResponse {
  result: any;
  error?: any;
}

interface ZabbixAxiosResponse {
  data: ZabbixResponse;
}

// 1. Autenticación y obtención de token
export async function zabbixLogin(config: ZabbixConfig) {
  const response = await axios.post(config.url, {
    jsonrpc: "2.0",
    method: "user.login",
    params: {
      user: config.usuario,
      password: config.password
    },
    id: 1
  }) as ZabbixAxiosResponse;
  if (response.data.error) {
    throw new Error(response.data.error.data || response.data.error.message || "Error de autenticación en Zabbix");
  }
  return response.data.result; // token
}

// 2. Obtener hosts (equipos) con inventario, estado, interfaces, etiquetas y grupos
export async function getZabbixHostsFull(url: string, authToken: string) {
  const response = await axios.post(url, {
    jsonrpc: "2.0",
    method: "host.get",
    params: {
      output: "extend",
      selectInventory: "extend",
      selectInterfaces: "extend",
      selectTags: "extend",
      selectGroups: "extend"
    },
    auth: authToken,
    id: 2
  }) as ZabbixAxiosResponse;
  return response.data.result;
}

// 3. Obtener problemas activos por host
export async function getProblemsByHost(url: string, authToken: string, hostid: string) {
  try {
    // Primero intentamos obtener problemas activos usando triggers
    const triggerResponse = await axios.post(url, {
      jsonrpc: "2.0",
      method: "trigger.get",
      params: {
        output: ["triggerid", "description", "value", "lastchange", "priority", "state"],
        hostids: [hostid],
        filter: {
          value: 1, // Solo triggers en estado de problema (activo)
          status: 0, // Solo triggers habilitados
          state: 0 // Solo triggers en estado normal (no en mantenimiento)
        },
        selectHosts: ["hostid", "name"],
        sortfield: ["priority", "lastchange"],
        sortorder: "DESC"
      },
      auth: authToken,
      id: 3
    }) as ZabbixAxiosResponse;
    
    console.log(`Respuesta de triggers ACTIVOS para host ${hostid}:`, JSON.stringify(triggerResponse.data, null, 2));
    
    if (triggerResponse.data.result && triggerResponse.data.result.length > 0) {
      console.log(`Triggers encontrados ANTES del filtrado: ${triggerResponse.data.result.length}`);
      
      // Filtrar triggers por severidad (solo Warning y superiores) y estado
      const filteredTriggers = triggerResponse.data.result.filter((trigger: any) => {
        const priority = parseInt(trigger.priority || "0");
        const isHighPriority = priority >= 2; // 2=Warning, 3=Average, 4=High, 5=Disaster
        const isActiveState = trigger.value === "1" || trigger.value === 1;
        
        console.log(`Trigger: ${trigger.description}, Priority: ${priority}, Value: ${trigger.value}, Include: ${isHighPriority && isActiveState}`);
        
        return isHighPriority && isActiveState;
      });
      
      // Agrupar triggers similares y mantener solo el de mayor prioridad
      const groupedTriggers = new Map();
      
      filteredTriggers.forEach((trigger: any) => {
        // Crear una clave para agrupar triggers similares (por ejemplo, problemas de disco)
        const key = trigger.description.includes('Disk space') ? 'disk_space' : trigger.description;
        
        if (!groupedTriggers.has(key)) {
          groupedTriggers.set(key, trigger);
        } else {
          // Si ya existe un trigger de este tipo, mantener el de mayor prioridad
          const existing = groupedTriggers.get(key);
          const currentPriority = parseInt(trigger.priority || "0");
          const existingPriority = parseInt(existing.priority || "0");
          
          if (currentPriority > existingPriority) {
            groupedTriggers.set(key, trigger);
            console.log(`Reemplazando trigger de menor prioridad: ${existing.description} (${existingPriority}) por ${trigger.description} (${currentPriority})`);
          }
        }
      });
      
      const uniqueTriggers = Array.from(groupedTriggers.values());
      
      console.log(`Triggers después del filtrado: ${filteredTriggers.length}`);
      console.log(`Triggers únicos después de agrupar: ${uniqueTriggers.length}`);
      
      // Convertir triggers únicos a formato de problemas
      const activeProblems = uniqueTriggers.map((trigger: any) => ({
        eventid: trigger.triggerid,
        name: trigger.description,
        severity: trigger.priority || "2",
        acknowledged: "0",
        clock: trigger.lastchange,
        r_eventid: "0",
        hosts: trigger.hosts || []
      }));
      
      console.log(`Problemas activos finales para host ${hostid}: ${activeProblems.length}`);
      activeProblems.forEach((problem, index) => {
        console.log(`Problema activo ${index + 1}:`, {
          name: problem.name,
          severity: problem.severity,
          eventid: problem.eventid
        });
      });
      
      return activeProblems;
    }
    
    console.log(`No se encontraron triggers activos para host ${hostid}`);
    return [];
  } catch (error) {
    console.error(`Error obteniendo problemas para host ${hostid}:`, error);
    return [];
  }
}

// 4. Obtener gráficos por host
export async function getGraphsByHost(url: string, authToken: string, hostid: string) {
  const response = await axios.post(url, {
    jsonrpc: "2.0",
    method: "graph.get",
    params: {
      output: ["graphid", "name"],
      hostids: hostid
    },
    auth: authToken,
    id: 4
  }) as ZabbixAxiosResponse;
  return response.data.result;
}

// 5. Obtener tableros por host (si aplica)
export async function getDashboardsByHost(url: string, authToken: string, hostid: string) {
  const response = await axios.post(url, {
    jsonrpc: "2.0",
    method: "dashboard.get",
    params: {
      output: ["dashboardid", "name"],
      filter: { hostids: hostid }
    },
    auth: authToken,
    id: 5
  }) as ZabbixAxiosResponse;
  return response.data.result;
}

// 6. Obtener web monitoring por host (si aplica)
export async function getWebMonitoringByHost(url: string, authToken: string, hostid: string) {
  const response = await axios.post(url, {
    jsonrpc: "2.0",
    method: "httptest.get",
    params: {
      output: ["httptestid", "name"],
      hostids: hostid
    },
    auth: authToken,
    id: 6
  }) as ZabbixAxiosResponse;
  return response.data.result;
} 