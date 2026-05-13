import React, { useState } from 'react';
import { ServerIcon, CpuChipIcon, WifiIcon, ComputerDesktopIcon, CogIcon, ChartBarIcon, MagnifyingGlassIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import ServidoresFisicos from '../components/cmdb/ServidoresFisicos';
import MaquinasVirtuales from '../components/cmdb/MaquinasVirtuales';
import EquiposRed from '../components/cmdb/EquiposRed';
import EquiposUsuario from '../components/cmdb/EquiposUsuario';
import Servicios from '../components/cmdb/Servicios';
import CMDBDashboard from '../components/cmdb/CMDBDashboard';
import BusquedaGlobal from '../components/cmdb/BusquedaGlobal';
import ZabbixSync from '../components/cmdb/ZabbixSync';
import { useAuth } from '../context/AuthContext';

const CMDB: React.FC = () => {
  const { user } = useAuth();
  const hasPerm = (perm: string) => (user?.permisos || []).includes(perm) || user?.rol === 'admin';
  const canRead = hasPerm('cmdb:read') || hasPerm('cmdb:manage');
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'busqueda' | 'zabbix' | 'servidores' | 'vms' | 'red' | 'usuario' | 'servicios'>('dashboard');

  if (!canRead) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Acceso Denegado</h2>
          <p className="text-gray-600">No tienes permisos para acceder al módulo CMDB</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: ChartBarIcon },
    { id: 'busqueda', label: 'Búsqueda Global', icon: MagnifyingGlassIcon },
    { id: 'zabbix', label: 'Sincronización Zabbix', icon: ArrowPathIcon },
    { id: 'servidores', label: 'Servidores Físicos', icon: ServerIcon },
    { id: 'vms', label: 'Máquinas Virtuales', icon: CpuChipIcon },
    { id: 'red', label: 'Equipos de Red', icon: WifiIcon },
    { id: 'usuario', label: 'Equipos de Usuario', icon: ComputerDesktopIcon },
    { id: 'servicios', label: 'Servicios', icon: CogIcon }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <ServerIcon className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">CMDB — Inventario de Infraestructura</h1>
          <p className="text-sm text-slate-500">Gestión centralizada de activos de TI</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-1 px-4" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`
                    flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors
                    ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600 bg-blue-50'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {activeTab === 'dashboard' && <CMDBDashboard />}
        {activeTab === 'busqueda' && <BusquedaGlobal />}
        {activeTab === 'zabbix' && <ZabbixSync />}
        {activeTab === 'servidores' && <ServidoresFisicos />}
        {activeTab === 'vms' && <MaquinasVirtuales />}
        {activeTab === 'red' && <EquiposRed />}
        {activeTab === 'usuario' && <EquiposUsuario />}
        {activeTab === 'servicios' && <Servicios />}
      </div>
    </div>
  );
};

export default CMDB;

