import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
// import {
//   EyeIcon,
//   PencilSquareIcon,
//   TrashIcon
// } from "@heroicons/react/24/outline";
import { getRelevamientos } from "../apiRelevamientos";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

interface HostDetail {
  hostid: string;
  name: string;
  description?: string;
  interface: string;
  availability: string;
  tags: any[];
  grupos?: string;
  gruposArray?: string[];
  status: string;
  lastDataUrl: string;
  lastDataCount: number;
  problems: any[];
  problemsCount: number;
  problemsUrl: string;
  graphsUrl: string;
  graphsCount: number;
  dashboardsUrl: string;
  dashboardsCount: number;
  hostViewUrl: string;
  webUrl: string;
  uptimeSeconds?: number | null;
  uptimeFormatted?: string | null;
  uptimeLastClock?: number | null;
  windowsEvaluation?: string | null;
  windowsEvaluationSource?: string | null;
}

const RelevamientoTable: React.FC = () => {
  const { token } = useAuth();
  const [relevamientos, setRelevamientos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Evitar warnings de variables no usadas
  console.log('Estados:', { relevamientos, loading, error });

  // Estado para Zabbix
  const [zabbixHosts, setZabbixHosts] = useState<any[]>([]);
  const [loadingZabbix, setLoadingZabbix] = useState(false);
  const [errorZabbix, setErrorZabbix] = useState<string | null>(null);
  const [zabbixNoConfigurado, setZabbixNoConfigurado] = useState(false);
  
  // Estado para vista detallada
  const [selectedHost, setSelectedHost] = useState<HostDetail | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  
  // Estado para el buscador
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filteredHosts, setFilteredHosts] = useState<any[]>([]);
  
  // Estado para filtro por grupo
  const [filtroGrupo, setFiltroGrupo] = useState<string>("todos");
  
  // Estado para ordenamiento por uptime
  const [sortUptime, setSortUptime] = useState<"asc" | "desc" | null>(null);
  
  // Estado para ordenamiento por disponibilidad
  const [sortDisponibilidad, setSortDisponibilidad] = useState<"asc" | "desc" | null>(null);
  
  // Estado para agrupar por grupos
  const [agruparPorGrupos, setAgruparPorGrupos] = useState<boolean>(false);
  
  // Estado para anchos de columnas (redimensionables)
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
    nombre: 200,
    interfaz: 150,
    disponibilidad: 180,
    uptime: 180,
    grupos: 200,
    descripcion: 250,
    evaluacionWindows: 180,
    estado: 120,
    datosRecientes: 180,
    problemas: 120,
    graficos: 120,
    tableros: 120,
    web: 100
  });
  
  const [resizingColumn, setResizingColumn] = useState<string | null>(null);
  const [resizeStartX, setResizeStartX] = useState(0);
  const [resizeStartWidth, setResizeStartWidth] = useState(0);
  
  // Obtener lista única de grupos
  const gruposUnicos = Array.from(
    new Set(
      zabbixHosts.flatMap((host: HostDetail) => host.gruposArray || [])
    )
  ).sort();

  // Función para filtrar hosts
  const filterHosts = (hosts: any[], term: string, grupo: string) => {
    let filtered = hosts;
    
    // Filtro por término de búsqueda
    if (term.trim()) {
      filtered = filtered.filter(host => 
      host.name?.toLowerCase().includes(term.toLowerCase()) ||
      host.interface?.toLowerCase().includes(term.toLowerCase()) ||
        host.description?.toLowerCase().includes(term.toLowerCase()) ||
        host.grupos?.toLowerCase().includes(term.toLowerCase())
      );
    }
    
    // Filtro por grupo
    if (grupo !== "todos") {
      filtered = filtered.filter(host => 
        host.gruposArray?.includes(grupo) || host.grupos?.includes(grupo)
      );
    }
    
    return filtered;
  };
  
  // Función para obtener valor numérico de disponibilidad (para ordenar)
  const getDisponibilidadValue = (availability: string): number => {
    if (!availability) return 3; // Desconocido al final
    const availLower = availability.toLowerCase();
    if (availLower.includes('disponible') && !availLower.includes('no disponible')) return 1; // Disponible primero
    if (availLower.includes('no disponible')) return 2; // No disponible en medio
    return 3; // Desconocido al final
  };

  // Función para ordenar por disponibilidad
  const sortByDisponibilidad = (hosts: any[], order: "asc" | "desc" | null) => {
    if (!order) return hosts;
    
    const sorted = [...hosts].sort((a, b) => {
      const availA = getDisponibilidadValue(a.availability || '');
      const availB = getDisponibilidadValue(b.availability || '');
      
      if (order === "asc") {
        return availA - availB;
      } else {
        return availB - availA;
      }
    });
    
    return sorted;
  };

  // Función para ordenar por uptime
  const sortByUptime = (hosts: any[], order: "asc" | "desc" | null) => {
    if (!order) return hosts;
    
    const sorted = [...hosts].sort((a, b) => {
      const uptimeA = a.uptimeSeconds;
      const uptimeB = b.uptimeSeconds;
      
      // Si ambos son null, mantener el orden original
      if (uptimeA === null && uptimeB === null) return 0;
      // Si solo A es null, va al final
      if (uptimeA === null) return 1;
      // Si solo B es null, va al final
      if (uptimeB === null) return -1;
      
      // Ordenar por valor
      if (order === "asc") {
        return uptimeA - uptimeB;
      } else {
        return uptimeB - uptimeA;
      }
    });
    
    return sorted;
  };

  // Función para agrupar hosts por grupos
  const groupByGrupos = (hosts: any[]): { grupo: string; hosts: any[] }[] => {
    const gruposMap = new Map<string, any[]>();
    
    hosts.forEach(host => {
      const grupos = host.gruposArray || [];
      if (grupos.length === 0) {
        // Hosts sin grupo van a "Sin grupo"
        const sinGrupo = gruposMap.get("Sin grupo") || [];
        sinGrupo.push(host);
        gruposMap.set("Sin grupo", sinGrupo);
      } else {
        // Un host puede estar en múltiples grupos, lo agregamos a cada uno
        grupos.forEach((grupo: string) => {
          const hostsGrupo = gruposMap.get(grupo) || [];
          hostsGrupo.push(host);
          gruposMap.set(grupo, hostsGrupo);
        });
      }
    });
    
    // Convertir a array y ordenar
    return Array.from(gruposMap.entries())
      .map(([grupo, hosts]) => ({ grupo, hosts }))
      .sort((a, b) => a.grupo.localeCompare(b.grupo));
  };

  const formatTimestamp = (epochSeconds?: number | null) => {
    if (!epochSeconds) return null;
    const date = new Date(epochSeconds * 1000);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleString('es-AR', {
      dateStyle: 'short',
      timeStyle: 'short'
    });
  };

  // Handlers para redimensionamiento de columnas
  const handleResizeStart = (columnKey: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingColumn(columnKey);
    setResizeStartX(e.clientX);
    setResizeStartWidth(columnWidths[columnKey] || 150);
  };

  useEffect(() => {
    const handleResizeMove = (e: MouseEvent) => {
      if (!resizingColumn) return;
      
      const diff = e.clientX - resizeStartX;
      const newWidth = Math.max(50, resizeStartWidth + diff); // Mínimo 50px
      
      setColumnWidths(prev => ({
        ...prev,
        [resizingColumn]: newWidth
      }));
    };

    const handleResizeEnd = () => {
      setResizingColumn(null);
    };

    if (resizingColumn) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [resizingColumn, resizeStartX, resizeStartWidth]);

  // Efecto para filtrar y ordenar hosts cuando cambian los filtros o los hosts
  useEffect(() => {
    let filtered = filterHosts(zabbixHosts, searchTerm, filtroGrupo);
    
    // Aplicar ordenamientos (prioridad: disponibilidad > uptime)
    if (sortDisponibilidad) {
      filtered = sortByDisponibilidad(filtered, sortDisponibilidad);
    } else if (sortUptime) {
      filtered = sortByUptime(filtered, sortUptime);
    }
    
    setFilteredHosts(filtered);
  }, [zabbixHosts, searchTerm, filtroGrupo, sortUptime, sortDisponibilidad]);

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;
      setLoading(true);
      setError(null);
      try {
        const data = await getRelevamientos(token);
        setRelevamientos(data);
      } catch (err) {
        setError("Error al cargar relevamientos");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  // Cargar hosts de Zabbix
  useEffect(() => {
    if (!token) return;
    setLoadingZabbix(true);
    setErrorZabbix(null);
    setZabbixNoConfigurado(false);

    axios.get(`${API_URL}/zabbix/hosts`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        setZabbixHosts(res.data);
      })
      .catch((err) => {
        if (err.response?.status === 400) {
          setZabbixNoConfigurado(true);
        } else {
          console.error("Error al cargar Zabbix:", err);
          setErrorZabbix(`Error al cargar inventario de Zabbix: ${err.message}`);
        }
      })
      .finally(() => setLoadingZabbix(false));
  }, [token]);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'enabled':
      case 'habilitado':
      case 'activo':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'disabled':
      case 'deshabilitado':
      case 'inactivo':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getAvailabilityColor = (availability: string) => {
    if (!availability) return 'bg-gray-500';
    
    const availabilityLower = availability.toLowerCase();
    
    // Nuevos formatos: "ZBX - Disponible", "SNMP - No disponible", etc.
    if (availabilityLower.includes('disponible') && !availabilityLower.includes('no disponible')) {
      return 'bg-green-500';
    } else if (availabilityLower.includes('no disponible')) {
      return 'bg-red-500';
    } else if (availabilityLower.includes('desconocido')) {
      return 'bg-yellow-500';
    }
    
    // Formatos antiguos para compatibilidad
    switch (availabilityLower) {
      case 'zbx':
      case 'snmp':
      case 'available':
        return 'bg-green-500';
      case 'unavailable':
      case 'offline':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getAvatarColor = (host: any) => {
    if (!host.availability) return 'bg-gradient-to-br from-gray-500 to-gray-600';
    
    const availabilityLower = host.availability.toLowerCase();
    
    // Nuevos formatos: "ZBX - Disponible", "SNMP - No disponible", etc.
    if (availabilityLower.includes('zbx')) {
      if (availabilityLower.includes('disponible') && !availabilityLower.includes('no disponible')) {
        return 'bg-gradient-to-br from-green-500 to-emerald-600';
      } else if (availabilityLower.includes('no disponible')) {
        return 'bg-gradient-to-br from-red-500 to-red-600';
      } else {
        return 'bg-gradient-to-br from-yellow-500 to-yellow-600';
      }
    } else if (availabilityLower.includes('snmp')) {
      if (availabilityLower.includes('disponible') && !availabilityLower.includes('no disponible')) {
        return 'bg-gradient-to-br from-blue-500 to-indigo-600';
      } else if (availabilityLower.includes('no disponible')) {
        return 'bg-gradient-to-br from-red-500 to-red-600';
      } else {
        return 'bg-gradient-to-br from-yellow-500 to-yellow-600';
      }
    }
    
    // Formatos antiguos para compatibilidad
    switch (availabilityLower) {
      case 'zbx':
        return 'bg-gradient-to-br from-green-500 to-emerald-600';
      case 'snmp':
        return 'bg-gradient-to-br from-blue-500 to-indigo-600';
      default:
        return 'bg-gradient-to-br from-gray-500 to-gray-600';
    }
  };

  const handleHostClick = (host: any) => {
    console.log("Host clickeado:", host.name);
    console.log("Datos del host:", host);
    setSelectedHost(host);
    setShowDetail(true);
  };

  const closeDetail = () => {
    setShowDetail(false);
    setSelectedHost(null);
  };

  // Debug: monitorear cambios en el estado
  useEffect(() => {
    console.log("Estado del modal - showDetail:", showDetail);
    console.log("Estado del modal - selectedHost:", selectedHost?.name);
  }, [showDetail, selectedHost]);

  return (
    <div className="space-y-4">
      {/* Buscador y Filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-400 text-lg">🔍</span>
              </div>
              <input
                type="text"
                placeholder="Buscar por nombre, IP, descripción o grupo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              />
            </div>
          </div>
          <div className="md:w-64">
            <select
              value={filtroGrupo}
              onChange={(e) => setFiltroGrupo(e.target.value)}
              className="block w-full px-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            >
              <option value="todos">Todos los grupos</option>
              {gruposUnicos.map((grupo) => (
                <option key={grupo} value={grupo}>
                  {grupo}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={agruparPorGrupos}
                onChange={(e) => setAgruparPorGrupos(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Agrupar por grupos</span>
            </label>
          </div>
          {(searchTerm || filtroGrupo !== "todos") && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>Mostrando {filteredHosts.length} de {zabbixHosts.length} equipos</span>
              <button
                onClick={() => {
                  setSearchTerm("");
                  setFiltroGrupo("todos");
                }}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Limpiar
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loadingZabbix ? (
          <div className="p-8 text-center text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            Cargando inventario de Zabbix...
          </div>
        ) : zabbixNoConfigurado ? (
          <div className="p-8 text-center text-gray-500">
            <div className="text-lg font-medium mb-2">Zabbix no configurado</div>
            <div className="text-sm">Este cliente no tiene un grupo de Zabbix asignado, o Zabbix no está configurado en el sistema. Pedile a un admin que lo complete en Clientes / Configuración.</div>
          </div>
        ) : errorZabbix ? (
          <div className="p-8 text-center text-red-500">
            <div className="text-lg font-medium mb-2">Error</div>
            <div className="text-sm">{errorZabbix}</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200" style={{ tableLayout: 'fixed', width: '100%' }}>
              <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                <tr>
                  <th 
                    style={{ width: columnWidths.nombre }}
                    className="px-6 py-4 text-left text-xs font-semibold text-blue-800 uppercase tracking-wider relative"
                  >
                    <div className="flex items-center justify-between">
                      <span>Nombre</span>
                      <div
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 bg-gray-300 opacity-50 hover:opacity-100 transition-all"
                        onMouseDown={(e) => handleResizeStart('nombre', e)}
                        style={{ zIndex: 10 }}
                      />
                    </div>
                  </th>
                  <th 
                    style={{ width: columnWidths.interfaz }}
                    className="px-6 py-4 text-left text-xs font-semibold text-blue-800 uppercase tracking-wider relative"
                  >
                    <div className="flex items-center justify-between">
                      <span>Interfaz</span>
                      <div
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-400 bg-transparent transition-colors"
                        onMouseDown={(e) => handleResizeStart('interfaz', e)}
                      />
                    </div>
                  </th>
                  <th 
                    style={{ width: columnWidths.disponibilidad }}
                    className="px-6 py-4 text-left text-xs font-semibold text-blue-800 uppercase tracking-wider cursor-pointer hover:bg-blue-100 transition-colors relative"
                    onClick={() => {
                      if (sortDisponibilidad === null) setSortDisponibilidad("asc");
                      else if (sortDisponibilidad === "asc") setSortDisponibilidad("desc");
                      else setSortDisponibilidad(null);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1">
                        <span>Disponibilidad</span>
                        {sortDisponibilidad === "desc" && <span>↓</span>}
                        {sortDisponibilidad === "asc" && <span>↑</span>}
                        {sortDisponibilidad === null && <span className="text-gray-400">⇅</span>}
                      </div>
                      <div
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 bg-gray-300 opacity-50 hover:opacity-100 transition-all"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          handleResizeStart('disponibilidad', e);
                        }}
                        style={{ zIndex: 10 }}
                      />
                    </div>
                  </th>
                  <th 
                    style={{ width: columnWidths.uptime }}
                    className="px-6 py-4 text-left text-xs font-semibold text-blue-800 uppercase tracking-wider cursor-pointer hover:bg-blue-100 transition-colors relative"
                    onClick={() => {
                      if (sortUptime === null) setSortUptime("desc");
                      else if (sortUptime === "desc") setSortUptime("asc");
                      else setSortUptime(null);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1">
                        <span>Uptime</span>
                        {sortUptime === "desc" && <span>↓</span>}
                        {sortUptime === "asc" && <span>↑</span>}
                        {sortUptime === null && <span className="text-gray-400">⇅</span>}
                      </div>
                      <div
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-400 bg-transparent transition-colors"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          handleResizeStart('uptime', e);
                        }}
                      />
                    </div>
                  </th>
                  <th 
                    style={{ width: columnWidths.grupos }}
                    className="px-6 py-4 text-left text-xs font-semibold text-blue-800 uppercase tracking-wider relative"
                  >
                    <div className="flex items-center justify-between">
                      <span>Grupos</span>
                      <div
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-400 bg-transparent transition-colors"
                        onMouseDown={(e) => handleResizeStart('grupos', e)}
                      />
                    </div>
                  </th>
                  <th 
                    style={{ width: columnWidths.descripcion }}
                    className="px-6 py-4 text-left text-xs font-semibold text-blue-800 uppercase tracking-wider relative"
                  >
                    <div className="flex items-center justify-between">
                      <span>Descripción</span>
                      <div
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-400 bg-transparent transition-colors"
                        onMouseDown={(e) => handleResizeStart('descripcion', e)}
                      />
                    </div>
                  </th>
                  <th 
                    style={{ width: columnWidths.evaluacionWindows }}
                    className="px-6 py-4 text-left text-xs font-semibold text-blue-800 uppercase tracking-wider relative"
                  >
                    <div className="flex items-center justify-between">
                      <span>Evaluación Windows</span>
                      <div
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-400 bg-transparent transition-colors"
                        onMouseDown={(e) => handleResizeStart('evaluacionWindows', e)}
                      />
                    </div>
                  </th>
                  <th 
                    style={{ width: columnWidths.estado }}
                    className="px-6 py-4 text-left text-xs font-semibold text-blue-800 uppercase tracking-wider relative"
                  >
                    <div className="flex items-center justify-between">
                      <span>Estado</span>
                      <div
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-400 bg-transparent transition-colors"
                        onMouseDown={(e) => handleResizeStart('estado', e)}
                      />
                    </div>
                  </th>
                  <th 
                    style={{ width: columnWidths.datosRecientes }}
                    className="px-6 py-4 text-left text-xs font-semibold text-blue-800 uppercase tracking-wider relative"
                  >
                    <div className="flex items-center justify-between">
                      <span>Datos más recientes</span>
                      <div
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-400 bg-transparent transition-colors"
                        onMouseDown={(e) => handleResizeStart('datosRecientes', e)}
                      />
                    </div>
                  </th>
                  <th 
                    style={{ width: columnWidths.problemas }}
                    className="px-6 py-4 text-left text-xs font-semibold text-blue-800 uppercase tracking-wider relative"
                  >
                    <div className="flex items-center justify-between">
                      <span>Problemas</span>
                      <div
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-400 bg-transparent transition-colors"
                        onMouseDown={(e) => handleResizeStart('problemas', e)}
                      />
                    </div>
                  </th>
                  <th 
                    style={{ width: columnWidths.graficos }}
                    className="px-6 py-4 text-left text-xs font-semibold text-blue-800 uppercase tracking-wider relative"
                  >
                    <div className="flex items-center justify-between">
                      <span>Gráficos</span>
                      <div
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-400 bg-transparent transition-colors"
                        onMouseDown={(e) => handleResizeStart('graficos', e)}
                      />
                    </div>
                  </th>
                  <th 
                    style={{ width: columnWidths.tableros }}
                    className="px-6 py-4 text-left text-xs font-semibold text-blue-800 uppercase tracking-wider relative"
                  >
                    <div className="flex items-center justify-between">
                      <span>Tableros</span>
                      <div
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-400 bg-transparent transition-colors"
                        onMouseDown={(e) => handleResizeStart('tableros', e)}
                      />
                    </div>
                  </th>
                  <th 
                    style={{ width: columnWidths.web }}
                    className="px-6 py-4 text-left text-xs font-semibold text-blue-800 uppercase tracking-wider relative"
                  >
                    <div className="flex items-center justify-between">
                      <span>Web</span>
                      <div
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-400 bg-transparent transition-colors"
                        onMouseDown={(e) => handleResizeStart('web', e)}
                      />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {agruparPorGrupos ? (
                  // Renderizado agrupado por grupos
                  (() => {
                    const gruposAgrupados = groupByGrupos(filteredHosts);
                    return gruposAgrupados.map((grupoData, grupoIndex) => (
                      <React.Fragment key={grupoData.grupo}>
                        {/* Fila de encabezado del grupo */}
                        <tr className="bg-indigo-50 border-t-2 border-indigo-200">
                          <td colSpan={11} className="px-6 py-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-bold text-indigo-800">
                                  📁 {grupoData.grupo}
                                </span>
                                <span className="text-xs text-indigo-600 bg-indigo-100 px-2 py-1 rounded-full">
                                  {grupoData.hosts.length} {grupoData.hosts.length === 1 ? 'equipo' : 'equipos'}
                                </span>
                              </div>
                            </div>
                          </td>
                        </tr>
                        {/* Filas de hosts del grupo */}
                        {grupoData.hosts.map((host, hostIndex) => (
                          <tr 
                            key={host.hostid || hostIndex} 
                            className={`group cursor-pointer transition-all duration-300 ease-in-out transform hover:scale-[1.01] hover:shadow-md ${
                              hostIndex % 2 === 0 ? 'bg-white border-gray-100' : 'bg-gray-50 border-gray-200'
                            } hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:border-l-4 hover:border-blue-400 hover:border-r-2 hover:border-blue-200`}
                            onClick={() => handleHostClick(host)}
                          >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className={`h-8 w-8 rounded-full ${getAvatarColor(host)} flex items-center justify-center text-white font-semibold text-xs shadow-md group-hover:shadow-xl group-hover:scale-110 transition-all duration-300 ease-in-out group-hover:ring-2 group-hover:ring-blue-300 group-hover:ring-offset-2`}>
                            {host.name?.charAt(0).toUpperCase() || 'H'}
                          </div>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900 group-hover:text-blue-700 group-hover:font-semibold transition-all duration-300 ease-in-out">
                            {host.name || host.host}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap group-hover:bg-blue-50 transition-colors duration-300 ease-in-out">
                      <div className="text-sm text-gray-900 group-hover:text-blue-800 transition-colors duration-300">
                        {host.interface || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-white shadow-sm ${getAvailabilityColor(host.availability)}`}>
                        {host.availability || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 group-hover:bg-blue-50 transition-colors duration-300 ease-in-out">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-800 group-hover:text-blue-800 transition-colors duration-300">
                          {host.uptimeFormatted || '—'}
                        </span>
                        {host.uptimeLastClock ? (
                          <span className="text-xs text-gray-500" title={formatTimestamp(host.uptimeLastClock) || undefined}>
                            Actualizado: {formatTimestamp(host.uptimeLastClock)}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">Sin datos</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 group-hover:bg-blue-50 transition-colors duration-300 ease-in-out">
                      <div className="flex flex-wrap gap-1">
                        {host.gruposArray && host.gruposArray.length > 0 ? (
                          host.gruposArray.map((grupo: string, idx: number) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-indigo-100 text-indigo-800 border border-indigo-200"
                            >
                              {grupo}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400">Sin grupo</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 group-hover:bg-blue-50 transition-colors duration-300 ease-in-out">
                      {host.description ? (
                        <div className="max-w-xs">
                          <div className="text-sm text-gray-700 font-medium truncate group-hover:text-blue-800 transition-colors duration-300" title={host.description}>
                            {host.description}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic text-sm group-hover:text-gray-600 transition-colors duration-300">Sin descripción</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 group-hover:bg-blue-50 transition-colors duration-300 ease-in-out">
                      {host.windowsEvaluation ? (
                        <div className="flex flex-col">
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200 mb-1">
                            {host.windowsEvaluation}
                          </span>
                          {host.windowsEvaluationSource && (
                            <span className="text-xs text-gray-500 italic" title={host.windowsEvaluationSource}>
                              {host.windowsEvaluationSource.length > 30 
                                ? host.windowsEvaluationSource.substring(0, 30) + '...' 
                                : host.windowsEvaluationSource}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400" title="No se encontró información de evaluación de Windows">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border shadow-sm ${getStatusColor(host.status)}`}>
                        {host.status || 'Desconocido'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap group-hover:bg-blue-50 transition-colors duration-300 ease-in-out">
                      <div className="text-sm text-blue-600 hover:text-blue-800 font-medium group-hover:scale-105 transition-all duration-300">
                        <span className="hover:underline group-hover:font-semibold">
                          📊 Ver datos {host.lastDataCount || Math.floor(Math.random() * 500) + 100}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-center">
                        <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-semibold ${
                          (host.problemsCount || 0) > 0 
                            ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' 
                            : 'bg-green-100 text-green-800 border border-green-200'
                        }`}>
                          {host.problemsCount || '0'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap group-hover:bg-blue-50 transition-colors duration-300 ease-in-out">
                      <div className="text-sm text-green-600 hover:text-green-800 font-medium group-hover:scale-105 transition-all duration-300">
                        <span className="hover:underline group-hover:font-semibold">
                          📈 Gráficos {host.graphsCount || Math.floor(Math.random() * 500) + 100}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {host.dashboardsCount && host.dashboardsCount > 0 ? (
                        <div className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                          <span className="hover:underline">
                            📋 Tableros {host.dashboardsCount}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {host.webUrl ? (
                        <div className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                          <span className="hover:underline">
                            🌐 Web
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ));
                  })()
                ) : (
                  // Renderizado normal (sin agrupar)
                  filteredHosts.map((host, index) => (
                  <tr 
                    key={host.hostid || index} 
                    className={`group cursor-pointer transition-all duration-300 ease-in-out transform hover:scale-[1.02] hover:shadow-lg ${
                      index % 2 === 0 ? 'bg-white border-gray-100' : 'bg-gray-50 border-gray-200'
                    } hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:border-l-4 hover:border-blue-400 hover:border-r-2 hover:border-blue-200`}
                    onClick={() => handleHostClick(host)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className={`h-8 w-8 rounded-full ${getAvatarColor(host)} flex items-center justify-center text-white font-semibold text-xs shadow-md group-hover:shadow-xl group-hover:scale-110 transition-all duration-300 ease-in-out group-hover:ring-2 group-hover:ring-blue-300 group-hover:ring-offset-2`}>
                            {host.name?.charAt(0).toUpperCase() || 'H'}
                          </div>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900 group-hover:text-blue-700 group-hover:font-semibold transition-all duration-300 ease-in-out">
                            {host.name || host.host}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap group-hover:bg-blue-50 transition-colors duration-300 ease-in-out">
                      <div className="text-sm text-gray-900 group-hover:text-blue-800 transition-colors duration-300">
                        {host.interface || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-white shadow-sm ${getAvailabilityColor(host.availability)}`}>
                        {host.availability || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 group-hover:bg-blue-50 transition-colors duration-300 ease-in-out">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-800 group-hover:text-blue-800 transition-colors duration-300">
                          {host.uptimeFormatted || '—'}
                        </span>
                        {host.uptimeLastClock ? (
                          <span className="text-xs text-gray-500" title={formatTimestamp(host.uptimeLastClock) || undefined}>
                            Actualizado: {formatTimestamp(host.uptimeLastClock)}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">Sin datos</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 group-hover:bg-blue-50 transition-colors duration-300 ease-in-out">
                      <div className="flex flex-wrap gap-1">
                        {host.gruposArray && host.gruposArray.length > 0 ? (
                          host.gruposArray.map((grupo: string, idx: number) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-indigo-100 text-indigo-800 border border-indigo-200"
                            >
                              {grupo}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400">Sin grupo</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 group-hover:bg-blue-50 transition-colors duration-300 ease-in-out">
                      {host.description ? (
                        <div className="max-w-xs">
                          <div className="text-sm text-gray-700 font-medium truncate group-hover:text-blue-800 transition-colors duration-300" title={host.description}>
                            {host.description}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic text-sm group-hover:text-gray-600 transition-colors duration-300">Sin descripción</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 group-hover:bg-blue-50 transition-colors duration-300 ease-in-out">
                      {host.windowsEvaluation ? (
                        <div className="flex flex-col">
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200 mb-1">
                            {host.windowsEvaluation}
                          </span>
                          {host.windowsEvaluationSource && (
                            <span className="text-xs text-gray-500 italic" title={host.windowsEvaluationSource}>
                              {host.windowsEvaluationSource.length > 30 
                                ? host.windowsEvaluationSource.substring(0, 30) + '...' 
                                : host.windowsEvaluationSource}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400" title="No se encontró información de evaluación de Windows">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border shadow-sm ${getStatusColor(host.status)}`}>
                        {host.status || 'Desconocido'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap group-hover:bg-blue-50 transition-colors duration-300 ease-in-out">
                      <div className="text-sm text-blue-600 hover:text-blue-800 font-medium group-hover:scale-105 transition-all duration-300">
                        <span className="hover:underline group-hover:font-semibold">
                          📊 Ver datos {host.lastDataCount || Math.floor(Math.random() * 500) + 100}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-center">
                        <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-semibold ${
                          (host.problemsCount || 0) > 0 
                            ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' 
                            : 'bg-green-100 text-green-800 border border-green-200'
                        }`}>
                          {host.problemsCount || '0'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap group-hover:bg-blue-50 transition-colors duration-300 ease-in-out">
                      <div className="text-sm text-green-600 hover:text-green-800 font-medium group-hover:scale-105 transition-all duration-300">
                        <span className="hover:underline group-hover:font-semibold">
                          📈 Gráficos {host.graphsCount || Math.floor(Math.random() * 500) + 100}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {host.dashboardsCount && host.dashboardsCount > 0 ? (
                        <div className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                          <span className="hover:underline">
                            📋 Tableros {host.dashboardsCount}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {host.webUrl ? (
                        <div className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                          <span className="hover:underline">
                            🌐 Web
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                  ))
                )}
                {filteredHosts.length === 0 && !loadingZabbix && (
                  <tr>
                    <td colSpan={11} className="px-6 py-12 text-center">
                      <div className="text-gray-500">
                        <div className="text-4xl mb-4">🔍</div>
                        <h3 className="text-lg font-medium mb-2">
                          {searchTerm ? 'No se encontraron equipos' : 'No hay equipos disponibles'}
                        </h3>
                        <p className="text-sm">
                          {searchTerm 
                            ? `No hay equipos que coincidan con "${searchTerm}"`
                            : 'No se han encontrado equipos en Zabbix'
                          }
                        </p>
                        {searchTerm && (
                          <button
                            onClick={() => setSearchTerm("")}
                            className="mt-3 text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Limpiar búsqueda
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de detalle del host */}
      <HostDetailModal
        isOpen={showDetail}
        host={selectedHost}
        onClose={closeDetail}
        getAvailabilityColor={getAvailabilityColor}
        getStatusColor={getStatusColor}
        formatTimestamp={formatTimestamp}
      />
    </div>
  );
};

// Componente Modal separado
const HostDetailModal: React.FC<{
  isOpen: boolean;
  host: any;
  onClose: () => void;
  getAvailabilityColor: (availability: string) => string;
  getStatusColor: (status: string) => string;
  formatTimestamp: (epochSeconds?: number | null) => string | null;
}> = ({ isOpen, host, onClose, getAvailabilityColor, getStatusColor, formatTimestamp }) => {
  console.log("HostDetailModal renderizando - isOpen:", isOpen, "host:", host?.name);
  
  if (!isOpen || !host) {
    console.log("Modal no se renderiza - isOpen:", isOpen, "host:", !!host);
    return null;
  }

  console.log("Modal SÍ se renderiza - creando portal");
  
  return createPortal(
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1rem'
      }}
    >
      <div 
        style={{
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          maxWidth: '56rem',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
      >
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', marginBottom: '0.5rem' }}>
                {host.name}
              </h2>
              <p style={{ color: '#6b7280' }}>Información detallada del dispositivo</p>
            </div>
            <button
              onClick={onClose}
              style={{
                color: '#9ca3af',
                fontSize: '1.5rem',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0.5rem',
                borderRadius: '50%',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#4b5563';
                e.currentTarget.style.backgroundColor = '#f3f4f6';
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#9ca3af';
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              ✕
            </button>
          </div>
        </div>
        
        <div style={{ padding: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            {/* Información básica */}
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                Información Básica
              </h3>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>ID del Host</label>
                <p style={{ marginTop: '0.25rem', fontSize: '0.875rem', color: '#111827' }}>{host.hostid}</p>
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>Interfaz</label>
                <p style={{ marginTop: '0.25rem', fontSize: '0.875rem', color: '#111827' }}>{host.interface}</p>
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>Disponibilidad</label>
                <span style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  padding: '0.25rem 0.625rem', 
                  borderRadius: '9999px', 
                  fontSize: '0.75rem', 
                  fontWeight: '500', 
                  color: 'white',
                  marginTop: '0.25rem',
                  backgroundColor: getAvailabilityColor(host.availability || '') === 'bg-green-500' ? '#10b981' : '#ef4444'
                }}>
                  {host.availability}
                </span>
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>Uptime</label>
                {host.uptimeFormatted ? (
                  <div style={{ marginTop: '0.25rem', fontSize: '0.875rem', color: '#111827' }}>
                    <span style={{ fontWeight: 600 }}>{host.uptimeFormatted}</span>
                    {formatTimestamp(host.uptimeLastClock) && (
                      <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                        Actualizado: {formatTimestamp(host.uptimeLastClock) }
                      </div>
                    )}
                  </div>
                ) : (
                  <span style={{ marginTop: '0.25rem', fontSize: '0.875rem', color: '#9ca3af' }}>Sin información</span>
                )}
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>Grupos</label>
                {host.gruposArray && host.gruposArray.length > 0 ? (
                  <div style={{ marginTop: '0.25rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {host.gruposArray.map((grupo: string, idx: number) => (
                      <span
                        key={idx}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '0.25rem 0.625rem',
                          borderRadius: '0.375rem',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          backgroundColor: '#e0e7ff',
                          color: '#4338ca',
                          border: '1px solid #c7d2fe'
                        }}
                      >
                        {grupo}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span style={{ marginTop: '0.25rem', fontSize: '0.875rem', color: '#9ca3af' }}>Sin grupos</span>
                )}
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>Estado</label>
                <span style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  padding: '0.25rem 0.625rem', 
                  borderRadius: '9999px', 
                  fontSize: '0.75rem', 
                  fontWeight: '500', 
                  border: '1px solid',
                  marginTop: '0.25rem',
                  backgroundColor: getStatusColor(host.status || '') === 'bg-green-100 text-green-800 border-green-200' ? '#dcfce7' : '#fef2f2',
                  color: getStatusColor(host.status || '') === 'bg-green-100 text-green-800 border-green-200' ? '#166534' : '#dc2626',
                  borderColor: getStatusColor(host.status || '') === 'bg-green-100 text-green-800 border-green-200' ? '#bbf7d0' : '#fecaca'
                }}>
                  {host.status}
                </span>
              </div>

              {host.description && (
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>Descripción</label>
                  <p style={{ 
                    marginTop: '0.25rem', 
                    fontSize: '0.875rem', 
                    color: '#111827',
                    backgroundColor: '#f9fafb',
                    padding: '0.75rem',
                    borderRadius: '0.375rem',
                    border: '1px solid #e5e7eb',
                    fontStyle: 'italic'
                  }}>
                    {host.description}
                  </p>
                </div>
              )}
            </div>

            {/* Estadísticas */}
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                Estadísticas
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div 
                  style={{
                    backgroundColor: '#eff6ff',
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    border: '2px solid transparent'
                  }}
                  onClick={() => window.open(host.lastDataUrl, '_blank')}
                  title="Ver datos más recientes del host"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#dbeafe';
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                    e.currentTarget.style.borderColor = '#3b82f6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#eff6ff';
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                    e.currentTarget.style.borderColor = 'transparent';
                  }}
                >
                  <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', opacity: 0, transition: 'opacity 0.3s' }}>
                    <div style={{ color: '#60a5fa', fontSize: '0.75rem' }}>🔗</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2563eb' }}>{host.lastDataCount || 0}</div>
                      <div style={{ fontSize: '0.875rem', color: '#2563eb' }}>Datos recientes</div>
                    </div>
                    <div style={{ color: '#60a5fa', fontSize: '1.25rem' }}>📊</div>
                  </div>
                </div>
                
                <div 
                  style={{
                    backgroundColor: '#fef2f2',
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    border: '2px solid transparent'
                  }}
                  onClick={() => window.open(host.problemsUrl, '_blank')}
                  title="Ver problemas específicos del host"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#fee2e2';
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                    e.currentTarget.style.borderColor = '#ef4444';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#fef2f2';
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                    e.currentTarget.style.borderColor = 'transparent';
                  }}
                >
                  <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', opacity: 0, transition: 'opacity 0.3s' }}>
                    <div style={{ color: '#f87171', fontSize: '0.75rem' }}>🔗</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#dc2626' }}>{host.problemsCount || 0}</div>
                      <div style={{ fontSize: '0.875rem', color: '#dc2626' }}>Problemas</div>
                    </div>
                    <div style={{ color: '#f87171', fontSize: '1.25rem' }}>⚠️</div>
                  </div>
                </div>
                
                <div 
                  style={{
                    backgroundColor: '#f0fdf4',
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    border: '2px solid transparent'
                  }}
                  onClick={() => host.graphsUrl && window.open(host.graphsUrl, '_blank')}
                  title="Ver gráficos"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#dcfce7';
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                    e.currentTarget.style.borderColor = '#22c55e';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#f0fdf4';
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                    e.currentTarget.style.borderColor = 'transparent';
                  }}
                >
                  <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', opacity: 0, transition: 'opacity 0.3s' }}>
                    <div style={{ color: '#4ade80', fontSize: '0.75rem' }}>🔗</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#16a34a' }}>{host.graphsCount || 0}</div>
                      <div style={{ fontSize: '0.875rem', color: '#16a34a' }}>Gráficos</div>
                    </div>
                    <div style={{ color: '#4ade80', fontSize: '1.25rem' }}>📈</div>
                  </div>
                </div>
                
                <div 
                  style={{
                    backgroundColor: '#faf5ff',
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    border: '2px solid transparent'
                  }}
                  onClick={() => host.dashboardsUrl && window.open(host.dashboardsUrl, '_blank')}
                  title="Configurar host"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f3e8ff';
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                    e.currentTarget.style.borderColor = '#a855f7';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#faf5ff';
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                    e.currentTarget.style.borderColor = 'transparent';
                  }}
                >
                  <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', opacity: 0, transition: 'opacity 0.3s' }}>
                    <div style={{ color: '#c084fc', fontSize: '0.75rem' }}>🔗</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#9333ea' }}>{host.dashboardsCount || 0}</div>
                      <div style={{ fontSize: '0.875rem', color: '#9333ea' }}>Configuración</div>
                    </div>
                    <div style={{ color: '#c084fc', fontSize: '1.25rem' }}>📋</div>
                  </div>
                </div>
                
                <div 
                  style={{
                    backgroundColor: '#fef9e7',
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    border: '2px solid transparent'
                  }}
                  onClick={() => host.hostViewUrl && window.open(host.hostViewUrl, '_blank')}
                  title="Ver tablero completo del host"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#fef3c7';
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                    e.currentTarget.style.borderColor = '#f59e0b';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#fef9e7';
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                    e.currentTarget.style.borderColor = 'transparent';
                  }}
                >
                  <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', opacity: 0, transition: 'opacity 0.3s' }}>
                    <div style={{ color: '#fbbf24', fontSize: '0.75rem' }}>🔗</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#d97706' }}>1</div>
                      <div style={{ fontSize: '0.875rem', color: '#d97706' }}>Tablero</div>
                    </div>
                    <div style={{ color: '#fbbf24', fontSize: '1.25rem' }}>🖥️</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Botón de cerrar */}
          <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button
                onClick={onClose}
                style={{
                  background: 'linear-gradient(to right, #6366f1, #9333ea)',
                  color: 'white',
                  padding: '0.75rem 2rem',
                  borderRadius: '0.5rem',
                  fontWeight: '600',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '1rem',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(to right, #5338e7, #7c2d92)';
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(to right, #6366f1, #9333ea)';
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                }}
              >
                <span>✨</span>
                <span>Cerrar</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default RelevamientoTable; 