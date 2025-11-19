import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  GlobeAltIcon,
  ComputerDesktopIcon,
  SignalIcon
} from '@heroicons/react/24/outline';
import {
  getInterfaces,
  getInterfaceStats,
  getTopHosts,
  getTopApplications,
  getTopCountries,
  type Interface,
  type InterfaceStats,
  type TopHost,
  type TopApplication,
  type TopCountry
} from '../apiTrafico';
import { useAuth } from '../context/AuthContext';

const Trafico: React.FC = () => {
  const { user } = useAuth();
  const hasPerm = (perm: string) => (user?.permisos || []).includes(perm) || user?.rol === 'admin';
  const canRead = hasPerm('trafico:read') || hasPerm('zabbix:read');

  const [interfaces, setInterfaces] = useState<Interface[]>([]);
  const [selectedInterface, setSelectedInterface] = useState<number>(0);
  const [interfaceStats, setInterfaceStats] = useState<InterfaceStats | null>(null);
  const [topHosts, setTopHosts] = useState<TopHost[]>([]);
  const [topApplications, setTopApplications] = useState<TopApplication[]>([]);
  const [topCountries, setTopCountries] = useState<TopCountry[]>([]);
  const [loading, setLoading] = useState(true);
  const [vistaActual, setVistaActual] = useState<'overview' | 'hosts' | 'applications' | 'countries'>('overview');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  // Cargar interfaces al montar
  useEffect(() => {
    if (!canRead) return;
    cargarInterfaces();
  }, [canRead]);

  // Cargar datos cuando cambia la interfaz seleccionada
  useEffect(() => {
    if (!canRead) return;
    cargarDatos();
  }, [selectedInterface, canRead]);

  // Auto-refresh cada 30 segundos
  useEffect(() => {
    if (autoRefresh && canRead) {
      const interval = setInterval(() => {
        cargarDatos();
      }, 30000); // 30 segundos
      setRefreshInterval(interval);
      return () => {
        if (interval) clearInterval(interval);
      };
    } else {
      if (refreshInterval) {
        clearInterval(refreshInterval);
        setRefreshInterval(null);
      }
    }
  }, [autoRefresh, selectedInterface, canRead]);

  const cargarInterfaces = async () => {
    try {
      const data = await getInterfaces();
      setInterfaces(data);
      if (data.length > 0 && selectedInterface === 0) {
        setSelectedInterface(data[0].id || 0);
      }
    } catch (error) {
      console.error('Error al cargar interfaces:', error);
    }
  };

  const cargarDatos = async () => {
    if (!canRead) return;
    try {
      setLoading(true);
      const [stats, hosts, apps, countries] = await Promise.all([
        getInterfaceStats(selectedInterface),
        getTopHosts({ ifid: selectedInterface, mode: 'bytes', limit: 20 }),
        getTopApplications({ ifid: selectedInterface, limit: 15 }),
        getTopCountries({ ifid: selectedInterface, limit: 15 })
      ]);
      
      setInterfaceStats(stats);
      setTopHosts(hosts);
      setTopApplications(apps);
      setTopCountries(countries);
    } catch (error) {
      console.error('Error al cargar datos de tráfico:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!canRead) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 font-semibold">No tienes permisos para ver el módulo de tráfico</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tráfico de Red</h1>
          <p className="text-gray-600 mt-1">Monitoreo de consumo de internet y rankings</p>
        </div>
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Auto-actualizar (30s)</span>
          </label>
          <button
            onClick={cargarDatos}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            🔄 Actualizar
          </button>
        </div>
      </div>

      {/* Selector de interfaz */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Interfaz de red:
        </label>
        <select
          value={selectedInterface}
          onChange={(e) => setSelectedInterface(parseInt(e.target.value))}
          className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {interfaces.map((iface) => (
            <option key={iface.id} value={iface.id}>
              {iface.name} {iface.description ? `- ${iface.description}` : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Estadísticas generales */}
      {interfaceStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tráfico Total</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {interfaceStats.bytes_total_formatted}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <ChartBarIcon className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center space-x-4 text-sm">
              <div>
                <span className="text-gray-600">Enviado:</span>
                <span className="ml-2 font-semibold text-green-600">
                  {interfaceStats.bytes_sent_formatted}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Recibido:</span>
                <span className="ml-2 font-semibold text-blue-600">
                  {interfaceStats.bytes_rcvd_formatted}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Velocidad Actual</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {interfaceStats.bps_total_formatted}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <SignalIcon className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center space-x-4 text-sm">
              <div>
                <span className="text-gray-600">↑ Enviando:</span>
                <span className="ml-2 font-semibold text-green-600">
                  {interfaceStats.bps_sent_formatted}
                </span>
              </div>
              <div>
                <span className="text-gray-600">↓ Recibiendo:</span>
                <span className="ml-2 font-semibold text-blue-600">
                  {interfaceStats.bps_rcvd_formatted}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Enlace a ntopng</p>
                <a
                  href="http://192.168.123.6:3000/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline text-sm mt-1 inline-block"
                >
                  Abrir ntopng →
                </a>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <GlobeAltIcon className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs de navegación */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {[
              { id: 'overview', label: 'Resumen', icon: ChartBarIcon },
              { id: 'hosts', label: 'Top Hosts', icon: ComputerDesktopIcon },
              { id: 'applications', label: 'Top Aplicaciones', icon: ArrowTrendingUpIcon },
              { id: 'countries', label: 'Top Países', icon: GlobeAltIcon }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setVistaActual(tab.id as any)}
                  className={`
                    flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm
                    ${
                      vistaActual === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Cargando datos de tráfico...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Vista: Resumen */}
              {vistaActual === 'overview' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Top 5 Hosts */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 5 Hosts</h3>
                      <div className="space-y-2">
                        {topHosts.slice(0, 5).map((host, index) => (
                          <div
                            key={host.ip}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center space-x-3">
                              <span className="text-sm font-semibold text-gray-500">#{index + 1}</span>
                              <div>
                                <p className="font-medium text-gray-900">{host.name || host.ip}</p>
                                <p className="text-xs text-gray-500">{host.ip}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-gray-900">
                                {host.bytes_total_formatted}
                              </p>
                              <p className="text-xs text-gray-500">{host.bps_total_formatted}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Top 5 Aplicaciones */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 5 Aplicaciones</h3>
                      <div className="space-y-2">
                        {topApplications.slice(0, 5).map((app, index) => (
                          <div
                            key={app.application}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center space-x-3">
                              <span className="text-sm font-semibold text-gray-500">#{index + 1}</span>
                              <p className="font-medium text-gray-900">{app.application}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-gray-900">
                                {app.bytes_formatted}
                              </p>
                              <p className="text-xs text-gray-500">{app.bps_formatted}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Vista: Top Hosts */}
              {vistaActual === 'hosts' && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          #
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Host
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          IP
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Enviado
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Recibido
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Velocidad
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {topHosts.map((host, index) => (
                        <tr key={host.ip} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500">
                            {index + 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {host.name || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {host.ip}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
                            {host.bytes_total_formatted}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600">
                            {host.bytes_sent_formatted}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-blue-600">
                            {host.bytes_rcvd_formatted}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                            {host.bps_total_formatted}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Vista: Top Aplicaciones */}
              {vistaActual === 'applications' && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          #
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Aplicación
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tráfico Total
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Velocidad
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {topApplications.map((app, index) => (
                        <tr key={app.application} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500">
                            {index + 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {app.application}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
                            {app.bytes_formatted}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                            {app.bps_formatted}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Vista: Top Países */}
              {vistaActual === 'countries' && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          #
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          País
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tráfico Total
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Velocidad
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {topCountries.map((country, index) => (
                        <tr key={country.country} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500">
                            {index + 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {country.country}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
                            {country.bytes_formatted}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                            {country.bps_formatted}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Trafico;

