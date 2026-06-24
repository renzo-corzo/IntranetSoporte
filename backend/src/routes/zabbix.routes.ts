import { Router } from "express";
import { getZabbixHostsFull, getProblemsByHost, getGraphsByHost, getDashboardsByHost, getWebMonitoringByHost, resolverContextoZabbix } from "../services/zabbixService";
import axios from "axios";
import { verifyToken } from "../middlewares/auth.middleware";
import { requireEmpresa, requireModulo } from "../middlewares/empresa.middleware";

const router = Router();

router.use(verifyToken);
router.use(requireEmpresa);
router.use(requireModulo("relevamientos"));

router.get("/hosts", async (req, res) => {
  try {
    const empresaId = (req as any).empresaId;
    const ctx = await resolverContextoZabbix(empresaId);
    if ("error" in ctx) {
      return res.status(400).json({ error: ctx.error });
    }
    const { config, token, groupIds } = ctx;
    const webBase = config.url.replace(/\/api_jsonrpc\.php$/, "");

    const hosts = await getZabbixHostsFull(config.url, token, groupIds);
    
    const formatUptime = (seconds: number) => {
      if (!seconds || Number.isNaN(seconds)) return null;
      const days = Math.floor(seconds / 86400);
      const hours = Math.floor((seconds % 86400) / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const parts = [];
      if (days > 0) parts.push(`${days}d`);
      if (hours > 0) parts.push(`${hours}h`);
      if (minutes > 0) parts.push(`${minutes}m`);
      if (parts.length === 0) parts.push(`${Math.floor(seconds)}s`);
      return parts.join(" ");
    };

    const hostsFull = await Promise.all(
      hosts.map(async (host: any) => {
        const problems = await getProblemsByHost(config.url, token, host.hostid);
        console.log(`\n=== HOST: ${host.name} ===`);
        console.log(`Host ID: ${host.hostid}`);
        console.log(`Problemas encontrados: ${problems?.length || 0}`);
        if (problems && problems.length > 0) {
          problems.forEach((p, index) => {
            console.log(`Problema ${index + 1}:`, {
              name: p.name,
              severity: p.severity,
              eventid: p.eventid,
              clock: p.clock,
              hosts: p.hosts ? p.hosts.map((h: any) => h.name) : 'no hosts info'
            });
          });
        }
        console.log(`ProblemsCount asignado: ${problems ? problems.length : 0}`);
        console.log(`========================\n`);
        const graphs = await getGraphsByHost(config.url, token, host.hostid);
        const dashboards = await getDashboardsByHost(config.url, token, host.hostid);
        const webMonitoring = await getWebMonitoringByHost(config.url, token, host.hostid);
        // Obtener cantidad de ítems (datos recientes)
        let lastDataCount = null;
        try {
          const itemsResp: any = await axios.post(
            config.url,
            {
              jsonrpc: "2.0",
              method: "item.get",
              params: {
                hostids: host.hostid,
                output: ["itemid"]
              },
              auth: token,
              id: 7
            }
          );
          lastDataCount = itemsResp.data.result ? itemsResp.data.result.length : 0;
        } catch (e) {
          lastDataCount = 0;
        }
        // Obtener uptime del host
        let uptimeSeconds: number | null = null;
        let uptimeFormatted: string | null = null;
        let uptimeLastClock: number | null = null;
        try {
          const uptimeResp: any = await axios.post(
            config.url,
            {
              jsonrpc: "2.0",
              method: "item.get",
              params: {
                hostids: host.hostid,
                filter: { key_: "system.uptime" },
                output: ["itemid", "lastvalue", "lastclock", "name", "units"]
              },
              auth: token,
              id: 8
            }
          );
          if (Array.isArray(uptimeResp.data.result) && uptimeResp.data.result.length > 0) {
            const uptimeItem = uptimeResp.data.result[0];
            const seconds = parseInt(uptimeItem.lastvalue, 10);
            if (!Number.isNaN(seconds)) {
              uptimeSeconds = seconds;
              uptimeFormatted = formatUptime(seconds);
            }
            uptimeLastClock = uptimeItem.lastclock ? parseInt(uptimeItem.lastclock, 10) : null;
          }
        } catch (e) {
          uptimeSeconds = null;
          uptimeFormatted = null;
          uptimeLastClock = null;
        }

        // Interfaz principal (la primera)
        const mainInterface = host.interfaces && host.interfaces.length > 0 ? host.interfaces[0] : null;
        
        // Determinar disponibilidad real basada en el estado de la interfaz
        let availability = "Desconocido";
        if (mainInterface) {
          const interfaceType = mainInterface.type === "2" ? "SNMP" : "ZBX";
          const availableStatus = mainInterface.available || "0";
          
          // 0 = Desconocido, 1 = Disponible, 2 = No disponible
          if (availableStatus === "1") {
            availability = `${interfaceType} - Disponible`;
          } else if (availableStatus === "2") {
            availability = `${interfaceType} - No disponible`;
          } else {
            availability = `${interfaceType} - Desconocido`;
          }
        }
        
        // Estado administrativo del host
        let estado = "Desconocido";
        if (host.status === "0" || host.status === 0) { estado = "Activado"; }
        else if (host.status === "1" || host.status === 1) { estado = "Deshabilitado"; }
        
        // Obtener nombres de grupos
        const grupos = (host.groups || []).map((g: any) => g.name || g.groupid).join(", ") || "Sin grupo";
        const gruposArray = (host.groups || []).map((g: any) => g.name || g.groupid) || [];

        // Obtener evaluación de Windows desde el inventario o items
        let windowsEvaluation: string | null = null;
        let windowsEvaluationSource: string | null = null;
        try {
          // Verificar si es un sistema Windows
          const isWindows = host.inventory?.os?.toLowerCase().includes('windows') || 
                           host.inventory?.os_full?.toLowerCase().includes('windows') ||
                           false;

          if (isWindows) {
            // Estrategia 1: Buscar items WMI específicos de evaluación
            try {
              const evalResp: any = await axios.post(
                config.url,
                {
                  jsonrpc: "2.0",
                  method: "item.get",
                  params: {
                    hostids: host.hostid,
                    search: { 
                      key_: ["wmi.get", "perf_counter", "system.windows"]
                    },
                    searchWildcards: true,
                    filter: { 
                      name: ["Windows Experience Index", "Windows Assessment", "WinSAT", "WEI", "Performance Index"]
                    },
                    output: ["name", "lastvalue", "lastclock", "key_"],
                    limit: 5
                  },
                  auth: token,
                  id: 9
                }
              );
              
              if (evalResp.data.result && evalResp.data.result.length > 0) {
                const item = evalResp.data.result[0];
                windowsEvaluation = item.lastvalue || null;
                windowsEvaluationSource = `Item: ${item.name}`;
              }
            } catch (e) {
              console.log(`No se encontraron items WMI de evaluación para ${host.name}`);
            }

            // Estrategia 2: Buscar en items con nombres relacionados
            if (!windowsEvaluation) {
              try {
                const evalResp2: any = await axios.post(
                  config.url,
                  {
                    jsonrpc: "2.0",
                    method: "item.get",
                    params: {
                      hostids: host.hostid,
                      search: { 
                        name: ["evaluation", "assessment", "index", "score", "rating", "benchmark"]
                      },
                      searchWildcards: true,
                      output: ["name", "lastvalue", "key_"],
                      limit: 5
                    },
                    auth: token,
                    id: 10
                  }
                );
                
                if (evalResp2.data.result && evalResp2.data.result.length > 0) {
                  const item = evalResp2.data.result[0];
                  windowsEvaluation = item.lastvalue || null;
                  windowsEvaluationSource = `Item: ${item.name}`;
                }
              } catch (e) {
                console.log(`No se encontraron items de evaluación genéricos para ${host.name}`);
              }
            }

            // Estrategia 3: Buscar en el inventario de Zabbix
            if (!windowsEvaluation && host.inventory) {
              // Buscar en campos del inventario que puedan contener evaluación
              const inv = host.inventory;
              if (inv.os_full) {
                windowsEvaluation = inv.os_full;
                windowsEvaluationSource = "Inventario: OS Full";
              } else if (inv.os) {
                windowsEvaluation = inv.os;
                windowsEvaluationSource = "Inventario: OS";
              } else if (inv.software) {
                windowsEvaluation = inv.software;
                windowsEvaluationSource = "Inventario: Software";
              }
            }

            // Estrategia 4: Buscar items de rendimiento del sistema
            if (!windowsEvaluation) {
              try {
                const perfResp: any = await axios.post(
                  config.url,
                  {
                    jsonrpc: "2.0",
                    method: "item.get",
                    params: {
                      hostids: host.hostid,
                      search: { 
                        key_: ["perf_counter", "system.cpu", "system.memory"]
                      },
                      searchWildcards: true,
                      filter: {
                        name: ["Performance", "Rating", "Score"]
                      },
                      output: ["name", "lastvalue"],
                      limit: 3
                    },
                    auth: token,
                    id: 11
                  }
                );
                
                if (perfResp.data.result && perfResp.data.result.length > 0) {
                  const item = perfResp.data.result[0];
                  windowsEvaluation = item.lastvalue || null;
                  windowsEvaluationSource = `Performance: ${item.name}`;
                }
              } catch (e) {
                console.log(`No se encontraron items de rendimiento para ${host.name}`);
              }
            }
          }
        } catch (e) {
          console.error(`Error obteniendo evaluación Windows para host ${host.name}:`, e);
          windowsEvaluation = null;
          windowsEvaluationSource = null;
        }

        const hostData = {
          hostid: host.hostid,
          name: host.name || host.host,
          description: host.description || null,
          interface: mainInterface ? `${mainInterface.ip}:${mainInterface.port}` : null,
          availability: availability,
          tags: host.tags || [],
          grupos: grupos,
          gruposArray: gruposArray,
          status: estado,
          lastDataUrl: `${webBase}/zabbix.php?name=&evaltype=0&tags%5B0%5D%5Btag%5D=&tags%5B0%5D%5Boperator%5D=0&tags%5B0%5D%5Bvalue%5D=&show_tags=3&tag_name_format=0&tag_priority=&filter_name=&filter_show_counter=0&filter_custom_time=0&sort=name&sortorder=ASC&show_details=0&action=latest.view&hostids%5B%5D=${host.hostid}`,
          lastDataCount,
          problems: problems || [],
          problemsCount: problems ? problems.length : 0,
          problemsUrl: `${webBase}/zabbix.php?show=1&name=&inventory%5B0%5D%5Bfield%5D=type&inventory%5B0%5D%5Bvalue%5D=&evaltype=0&tags%5B0%5D%5Btag%5D=&tags%5B0%5D%5Boperator%5D=0&tags%5B0%5D%5Bvalue%5D=&show_tags=3&tag_name_format=0&tag_priority=&show_opdata=0&show_timeline=1&filter_name=&filter_show_counter=0&filter_custom_time=0&sort=clock&sortorder=DESC&age_state=0&show_suppressed=0&unacknowledged=0&compact_view=0&details=0&highlight_row=0&action=problem.view&hostids%5B%5D=${host.hostid}`,
          graphsUrl: graphs && graphs.length > 0 ? `${webBase}/zabbix.php?action=charts.view&filter_hostids%5B%5D=${host.hostid}&filter_set=1` : null,
          graphsCount: graphs ? graphs.length : 0,
          dashboardsUrl: `${webBase}/zabbix.php?action=host.edit&hostid=${host.hostid}`,
          dashboardsCount: dashboards ? dashboards.length : 0,
          hostViewUrl: `${webBase}/zabbix.php?action=host.dashboard.view&hostid=${host.hostid}`,
          webUrl: webMonitoring && webMonitoring.length > 0 ? `${webBase}/zabbix.php?action=web.view&httptestid=${webMonitoring[0].httptestid}` : null,
          uptimeSeconds,
          uptimeFormatted,
          uptimeLastClock,
          windowsEvaluation,
          windowsEvaluationSource
        };
        
        return hostData;
      })
    );
    res.json(hostsFull);
  } catch (err: any) {
    res.status(500).json({ error: "Error al consultar Zabbix", details: err.message });
  }
});

export default router; 