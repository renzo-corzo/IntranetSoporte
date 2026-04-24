import React, { useState, useEffect } from 'react';
import {
  ServerIcon,
  CpuChipIcon,
  WifiIcon,
  ComputerDesktopIcon,
  CogIcon,
  ExclamationTriangleIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';

const API_URL = API_BASE_URL;

interface DashboardStats {
  totales: {
    servidores: number;
    vms: number;
    equiposRed: number;
    equiposUsuario: number;
    servicios: number;
    total: number;
  };
  enProduccion: {
    servidores: number;
    vms: number;
    equiposRed: number;
    equiposUsuario: number;
    servicios: number;
  };
  alertas: {
    garantiasProximas: Array<{
      id: string;
      nombre: string;
      garantia: string;
      serie?: string;
      diasRestantes: number | null;
    }>;
    equiposFueraServicio: number;
  };
  distribucion: {
    porEstado: Record<string, number>;
    porTipo: Record<string, number>;
    porUbicacion: Record<string, number>;
  };
}

const CMDBDashboard: React.FC = () => {
  const { token } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarStats();
  }, []);

  const cargarStats = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/cmdb/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-gray-600">Cargando dashboard...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6 text-center text-gray-500">
        <p>No se pudieron cargar las estadísticas</p>
      </div>
    );
  }

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'PRODUCCION': return 'bg-green-500';
      case 'TEST': return 'bg-yellow-500';
      case 'FUERA_DE_SERVICIO': return 'bg-red-500';
      case 'MANTENIMIENTO': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Dashboard CMDB</h2>
        <p className="text-gray-600 text-sm">Vista general del inventario de infraestructura</p>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Equipos</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totales.total}</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <ChartBarIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Servidores</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totales.servidores}</p>
              <p className="text-xs text-green-600">{stats.enProduccion.servidores} en producción</p>
            </div>
            <ServerIcon className="h-8 w-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Máquinas Virtuales</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totales.vms}</p>
              <p className="text-xs text-green-600">{stats.enProduccion.vms} en producción</p>
            </div>
            <CpuChipIcon className="h-8 w-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Equipos de Red</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totales.equiposRed}</p>
              <p className="text-xs text-green-600">{stats.enProduccion.equiposRed} en producción</p>
            </div>
            <WifiIcon className="h-8 w-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Equipos Usuario</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totales.equiposUsuario}</p>
              <p className="text-xs text-green-600">{stats.enProduccion.equiposUsuario} en producción</p>
            </div>
            <ComputerDesktopIcon className="h-8 w-8 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Alertas */}
      {(stats.alertas.garantiasProximas.length > 0 || stats.alertas.equiposFueraServicio > 0) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
            <h3 className="text-lg font-semibold text-yellow-900">Alertas</h3>
          </div>
          <div className="space-y-2">
            {stats.alertas.garantiasProximas.length > 0 && (
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  Garantías próximas a vencer ({stats.alertas.garantiasProximas.length}):
                </p>
                <ul className="mt-1 space-y-1">
                  {stats.alertas.garantiasProximas.slice(0, 5).map((item) => (
                    <li key={item.id} className="text-sm text-yellow-700">
                      • {item.nombre} - {item.diasRestantes !== null ? `${item.diasRestantes} días restantes` : 'Fecha próxima'}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {stats.alertas.equiposFueraServicio > 0 && (
              <p className="text-sm text-yellow-700">
                ⚠️ {stats.alertas.equiposFueraServicio} equipos fuera de servicio
              </p>
            )}
          </div>
        </div>
      )}

      {/* Distribución por estado */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Distribución por Estado</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(stats.distribucion.porEstado).map(([estado, cantidad]) => (
            <div key={estado} className="text-center">
              <div className={`h-3 rounded-full ${getEstadoColor(estado)} mb-2`}></div>
              <p className="text-sm text-gray-600">{estado}</p>
              <p className="text-2xl font-bold text-gray-900">{cantidad}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Distribución por tipo */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Distribución por Tipo</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center">
            <ServerIcon className="h-8 w-8 mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-gray-600">Servidores</p>
            <p className="text-xl font-bold text-gray-900">{stats.distribucion.porTipo.servidores}</p>
          </div>
          <div className="text-center">
            <CpuChipIcon className="h-8 w-8 mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-gray-600">VMs</p>
            <p className="text-xl font-bold text-gray-900">{stats.distribucion.porTipo.vms}</p>
          </div>
          <div className="text-center">
            <WifiIcon className="h-8 w-8 mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-gray-600">Red</p>
            <p className="text-xl font-bold text-gray-900">{stats.distribucion.porTipo.equiposRed}</p>
          </div>
          <div className="text-center">
            <ComputerDesktopIcon className="h-8 w-8 mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-gray-600">Usuario</p>
            <p className="text-xl font-bold text-gray-900">{stats.distribucion.porTipo.equiposUsuario}</p>
          </div>
          <div className="text-center">
            <CogIcon className="h-8 w-8 mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-gray-600">Servicios</p>
            <p className="text-xl font-bold text-gray-900">{stats.distribucion.porTipo.servicios}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CMDBDashboard;



