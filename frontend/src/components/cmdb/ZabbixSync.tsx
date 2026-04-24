import React, { useState, useEffect } from 'react';
import { ArrowPathIcon, CheckCircleIcon, XCircleIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

interface ZabbixHost {
  hostid: string;
  name: string;
  ip: string | null;
  status: string;
  uptime: string | null;
  uptimeSeconds: number | null;
  groups: string[];
}

interface Coincidencia {
  zabbixHost: ZabbixHost;
  coincidencias: {
    servidor: any;
    vm: any;
    red: any;
  };
}

const ZabbixSync: React.FC = () => {
  const { token } = useAuth();
  const [hosts, setHosts] = useState<ZabbixHost[]>([]);
  const [coincidencias, setCoincidencias] = useState<Coincidencia[]>([]);
  const [loading, setLoading] = useState(false);
  const [sincronizando, setSincronizando] = useState<string | null>(null);

  useEffect(() => {
    cargarHosts();
    cargarCoincidencias();
  }, []);

  const cargarHosts = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/cmdb/zabbix/hosts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHosts(response.data.hosts || []);
    } catch (error) {
      console.error('Error al cargar hosts:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarCoincidencias = async () => {
    if (!token) return;
    try {
      const response = await axios.get(`${API_URL}/cmdb/zabbix/coincidencias`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCoincidencias(response.data.coincidencias || []);
    } catch (error) {
      console.error('Error al cargar coincidencias:', error);
    }
  };

  const handleSincronizar = async (host: ZabbixHost, tipo: 'servidor' | 'vm' | 'red' | 'usuario', accion: 'crear' | 'actualizar', cmdbId?: string) => {
    if (!token) return;
    setSincronizando(host.hostid);
    try {
      await axios.post(
        `${API_URL}/cmdb/zabbix/sincronizar`,
        {
          zabbixHostId: host.hostid,
          cmdbTipo: tipo,
          cmdbId: accion === 'actualizar' ? cmdbId : undefined,
          accion
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await cargarCoincidencias();
      alert('Sincronización exitosa');
    } catch (error) {
      console.error('Error al sincronizar:', error);
      alert('Error al sincronizar');
    } finally {
      setSincronizando(null);
    }
  };

  const tieneCoincidencia = (host: ZabbixHost) => {
    const coincidencia = coincidencias.find(c => c.zabbixHost.hostid === host.hostid);
    return coincidencia && (coincidencia.coincidencias.servidor || coincidencia.coincidencias.vm || coincidencia.coincidencias.red || coincidencia.coincidencias.usuario);
  };

  const getCoincidencia = (host: ZabbixHost) => {
    return coincidencias.find(c => c.zabbixHost.hostid === host.hostid);
  };

  // Detectar tipo de equipo basado en el nombre
  const detectarTipoEquipo = (nombre: string): 'servidor' | 'vm' | 'red' | 'usuario' => {
    const nombreUpper = nombre.toUpperCase();
    
    // Detectar equipos de usuario (impresoras, escáneres, etc.)
    if (nombreUpper.includes('IMPRESORA') || 
        nombreUpper.includes('PRINTER') ||
        nombreUpper.includes('ESCANER') ||
        nombreUpper.includes('SCANNER') ||
        nombreUpper.includes('MULTIFUNCION') ||
        nombreUpper.includes('MULTIFUNCTION')) {
      return 'usuario';
    }
    
    // Detectar equipos de red
    if (nombreUpper.includes('MIKROTIK') || 
        nombreUpper.includes('PFSENSE') || 
        nombreUpper.includes('GATEWAY') ||
        nombreUpper.includes('ROUTER') ||
        nombreUpper.includes('SWITCH') ||
        nombreUpper.includes('FIREWALL') ||
        nombreUpper.includes('AP ') ||
        nombreUpper.includes('ACCESS POINT')) {
      return 'red';
    }
    
    // Detectar VMs (comúnmente tienen nombres como VM-, vSphere, etc.)
    if (nombreUpper.includes('VM-') || 
        nombreUpper.includes('VM_') ||
        nombreUpper.includes('VSPHERE') ||
        nombreUpper.includes('HYPER-V')) {
      return 'vm';
    }
    
    // Por defecto, asumir servidor físico
    return 'servidor';
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Sincronización con Zabbix</h2>
        <p className="text-gray-600 text-sm">Sincroniza hosts de Zabbix con el CMDB</p>
        <button
          onClick={() => { cargarHosts(); cargarCoincidencias(); }}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <ArrowPathIcon className="h-5 w-5 inline mr-2" />
          Actualizar
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Cargando hosts...</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Host Zabbix
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IP
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Uptime
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Coincidencias
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {hosts.map((host) => {
                  const coincidencia = getCoincidencia(host);
                  const yaSincronizado = tieneCoincidencia(host);
                  
                  return (
                    <tr key={host.hostid} className={yaSincronizado ? 'bg-green-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{host.name}</div>
                        <div className="text-xs text-gray-500">ID: {host.hostid}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {host.ip || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          host.status === 'ACTIVO' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {host.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {host.uptime || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {coincidencia && (
                          <div className="space-y-1">
                            {coincidencia.coincidencias.servidor && (
                              <div className="text-green-600">
                                <CheckCircleIcon className="h-4 w-4 inline mr-1" />
                                Servidor: {coincidencia.coincidencias.servidor.nombre}
                              </div>
                            )}
                            {coincidencia.coincidencias.vm && (
                              <div className="text-green-600">
                                <CheckCircleIcon className="h-4 w-4 inline mr-1" />
                                VM: {coincidencia.coincidencias.vm.nombre}
                              </div>
                            )}
                            {coincidencia.coincidencias.red && (
                              <div className="text-green-600">
                                <CheckCircleIcon className="h-4 w-4 inline mr-1" />
                                Red: {coincidencia.coincidencias.red.nombre}
                              </div>
                            )}
                            {coincidencia.coincidencias.usuario && (
                              <div className="text-green-600">
                                <CheckCircleIcon className="h-4 w-4 inline mr-1" />
                                Usuario: {coincidencia.coincidencias.usuario.nombre}
                              </div>
                            )}
                            {!yaSincronizado && (
                              <div className="text-gray-500 text-xs">Sin coincidencias</div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex flex-col space-y-1">
                          {!yaSincronizado ? (() => {
                            const tipoDetectado = detectarTipoEquipo(host.name);
                            return (
                              <>
                                {tipoDetectado === 'usuario' ? (
                                  <button
                                    onClick={() => handleSincronizar(host, 'usuario', 'crear')}
                                    disabled={sincronizando === host.hostid}
                                    className="text-blue-600 hover:text-blue-900 disabled:opacity-50 text-left font-semibold"
                                  >
                                    ✓ Crear Equipo de Usuario
                                  </button>
                                ) : tipoDetectado === 'red' ? (
                                  <button
                                    onClick={() => handleSincronizar(host, 'red', 'crear')}
                                    disabled={sincronizando === host.hostid}
                                    className="text-blue-600 hover:text-blue-900 disabled:opacity-50 text-left font-semibold"
                                  >
                                    ✓ Crear Equipo de Red
                                  </button>
                                ) : tipoDetectado === 'vm' ? (
                                  <button
                                    onClick={() => handleSincronizar(host, 'vm', 'crear')}
                                    disabled={sincronizando === host.hostid}
                                    className="text-blue-600 hover:text-blue-900 disabled:opacity-50 text-left font-semibold"
                                  >
                                    ✓ Crear VM
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleSincronizar(host, 'servidor', 'crear')}
                                    disabled={sincronizando === host.hostid}
                                    className="text-blue-600 hover:text-blue-900 disabled:opacity-50 text-left font-semibold"
                                  >
                                    ✓ Crear Servidor
                                  </button>
                                )}
                                <div className="text-xs text-gray-400 mt-1 mb-1">O crear como:</div>
                                {tipoDetectado !== 'servidor' && (
                                  <button
                                    onClick={() => handleSincronizar(host, 'servidor', 'crear')}
                                    disabled={sincronizando === host.hostid}
                                    className="text-gray-600 hover:text-gray-900 disabled:opacity-50 text-left text-xs"
                                  >
                                    Servidor
                                  </button>
                                )}
                                {tipoDetectado !== 'vm' && (
                                  <button
                                    onClick={() => handleSincronizar(host, 'vm', 'crear')}
                                    disabled={sincronizando === host.hostid}
                                    className="text-gray-600 hover:text-gray-900 disabled:opacity-50 text-left text-xs"
                                  >
                                    VM
                                  </button>
                                )}
                                {tipoDetectado !== 'red' && (
                                  <button
                                    onClick={() => handleSincronizar(host, 'red', 'crear')}
                                    disabled={sincronizando === host.hostid}
                                    className="text-gray-600 hover:text-gray-900 disabled:opacity-50 text-left text-xs"
                                  >
                                    Equipo de Red
                                  </button>
                                )}
                                {tipoDetectado !== 'usuario' && (
                                  <button
                                    onClick={() => handleSincronizar(host, 'usuario', 'crear')}
                                    disabled={sincronizando === host.hostid}
                                    className="text-gray-600 hover:text-gray-900 disabled:opacity-50 text-left text-xs"
                                  >
                                    Equipo de Usuario
                                  </button>
                                )}
                              </>
                            );
                          })(                          ) : (
                            <>
                              {coincidencia?.coincidencias.servidor && (
                                <button
                                  onClick={() => handleSincronizar(host, 'servidor', 'actualizar', coincidencia.coincidencias.servidor.id)}
                                  disabled={sincronizando === host.hostid}
                                  className="text-green-600 hover:text-green-900 disabled:opacity-50 text-left"
                                >
                                  Actualizar Servidor
                                </button>
                              )}
                              {coincidencia?.coincidencias.vm && (
                                <button
                                  onClick={() => handleSincronizar(host, 'vm', 'actualizar', coincidencia.coincidencias.vm.id)}
                                  disabled={sincronizando === host.hostid}
                                  className="text-green-600 hover:text-green-900 disabled:opacity-50 text-left"
                                >
                                  Actualizar VM
                                </button>
                              )}
                              {coincidencia?.coincidencias.red && (
                                <button
                                  onClick={() => handleSincronizar(host, 'red', 'actualizar', coincidencia.coincidencias.red.id)}
                                  disabled={sincronizando === host.hostid}
                                  className="text-green-600 hover:text-green-900 disabled:opacity-50 text-left"
                                >
                                  Actualizar Equipo de Red
                                </button>
                              )}
                              {coincidencia?.coincidencias.usuario && (
                                <button
                                  onClick={() => handleSincronizar(host, 'usuario', 'actualizar', coincidencia.coincidencias.usuario.id)}
                                  disabled={sincronizando === host.hostid}
                                  className="text-green-600 hover:text-green-900 disabled:opacity-50 text-left"
                                >
                                  Actualizar Equipo de Usuario
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ZabbixSync;



