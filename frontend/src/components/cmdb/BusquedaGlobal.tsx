import React, { useState } from 'react';
import { MagnifyingGlassIcon, ServerIcon, CpuChipIcon, WifiIcon, ComputerDesktopIcon, CogIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

interface ResultadoBusqueda {
  id: string;
  nombre: string;
  ip?: string;
  estado: string;
  tipo: string;
  tipoLabel: string;
  usuarioNombre?: string;
}

const BusquedaGlobal: React.FC = () => {
  const { token } = useAuth();
  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState<ResultadoBusqueda[]>([]);
  const [loading, setLoading] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState('');

  const handleBuscar = async () => {
    if (!busqueda.trim() || !token) return;
    
    setLoading(true);
    try {
      const params: any = { q: busqueda, limit: 50 };
      if (filtroTipo) params.tipo = filtroTipo;
      
      const response = await axios.get(`${API_URL}/cmdb/busqueda`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      setResultados(response.data.resultados || []);
    } catch (error) {
      console.error('Error en búsqueda:', error);
      setResultados([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBuscar();
    }
  };

  const getIcono = (tipo: string) => {
    switch (tipo) {
      case 'servidor': return <ServerIcon className="h-5 w-5" />;
      case 'vm': return <CpuChipIcon className="h-5 w-5" />;
      case 'red': return <WifiIcon className="h-5 w-5" />;
      case 'usuario': return <ComputerDesktopIcon className="h-5 w-5" />;
      case 'servicio': return <CogIcon className="h-5 w-5" />;
      default: return null;
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'PRODUCCION': return 'bg-green-100 text-green-800';
      case 'TEST': return 'bg-yellow-100 text-yellow-800';
      case 'FUERA_DE_SERVICIO': return 'bg-red-100 text-red-800';
      case 'MANTENIMIENTO': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Búsqueda Global</h2>
        <p className="text-gray-600 text-sm">Busca en todos los activos del CMDB</p>
      </div>

      {/* Barra de búsqueda */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6 space-y-4 md:space-y-0 md:flex md:space-x-4">
        <div className="flex-1">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, IP, serie, fabricante, modelo..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="md:w-48">
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los tipos</option>
            <option value="servidores">Servidores Físicos</option>
            <option value="vms">Máquinas Virtuales</option>
            <option value="red">Equipos de Red</option>
            <option value="usuario">Equipos de Usuario</option>
            <option value="servicios">Servicios</option>
          </select>
        </div>
        <button
          onClick={handleBuscar}
          disabled={loading || !busqueda.trim()}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Buscando...' : 'Buscar'}
        </button>
      </div>

      {/* Resultados */}
      {resultados.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">
              {resultados.length} resultado{resultados.length !== 1 ? 's' : ''} encontrado{resultados.length !== 1 ? 's' : ''}
            </h3>
          </div>
          <div className="divide-y divide-gray-200">
            {resultados.map((resultado) => (
              <div key={`${resultado.tipo}-${resultado.id}`} className="p-4 hover:bg-gray-50">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    <div className="h-8 w-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600">
                      {getIcono(resultado.tipo)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-gray-900">{resultado.nombre}</p>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getEstadoColor(resultado.estado)}`}>
                        {resultado.estado}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{resultado.tipoLabel}</p>
                    {resultado.ip && (
                      <p className="text-sm text-gray-600 mt-1">IP: {resultado.ip}</p>
                    )}
                    {resultado.usuarioNombre && (
                      <p className="text-sm text-gray-600 mt-1">Usuario: {resultado.usuarioNombre}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && busqueda && resultados.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <MagnifyingGlassIcon className="h-12 w-12 mx-auto text-gray-300 mb-2" />
          <p className="text-gray-600">No se encontraron resultados para "{busqueda}"</p>
        </div>
      )}

      {!busqueda && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <MagnifyingGlassIcon className="h-12 w-12 mx-auto text-gray-300 mb-2" />
          <p className="text-gray-600">Ingresa un término de búsqueda para comenzar</p>
        </div>
      )}
    </div>
  );
};

export default BusquedaGlobal;



