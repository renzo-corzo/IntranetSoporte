import React, { useState, useEffect } from 'react';
import { PlusIcon, MagnifyingGlassIcon, PencilIcon, TrashIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';
import {
  getEquiposUsuario,
  createEquipoUsuario,
  updateEquipoUsuario,
  deleteEquipoUsuario,
  type EquipoUsuario
} from '../../services/cmdb.service';
import { useAuth } from '../../context/AuthContext';

const EquiposUsuario: React.FC = () => {
  const { token, user } = useAuth();
  const hasPerm = (perm: string) => (user?.permisos || []).includes(perm) || user?.rol === 'admin';
  const canManage = hasPerm('cmdb:manage');
  
  const [equipos, setEquipos] = useState<EquipoUsuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [buscar, setBuscar] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [total, setTotal] = useState(0);

  useEffect(() => {
    cargarEquipos();
  }, [buscar, filtroTipo, filtroEstado]);

  const cargarEquipos = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params: any = { page: 1, limit: 100 };
      if (buscar) params.buscar = buscar;
      if (filtroTipo) params.tipo = filtroTipo;
      if (filtroEstado) params.estado = filtroEstado;
      
      const response = await getEquiposUsuario(token, params);
      setEquipos(response.data || []);
      setTotal(response.total || 0);
    } catch (error) {
      console.error('Error al cargar equipos de usuario:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async (id: string) => {
    if (!token || !window.confirm('¿Estás seguro de eliminar este equipo?')) return;
    try {
      await deleteEquipoUsuario(id, token);
      cargarEquipos();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al eliminar equipo');
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

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-gray-600">Cargando equipos de usuario...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Equipos de Usuario</h2>
          <p className="text-gray-600 text-sm">Total: {total} equipos</p>
        </div>
        {canManage && (
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <PlusIcon className="h-5 w-5" />
            <span>Nuevo Equipo</span>
          </button>
        )}
      </div>

      <div className="bg-gray-50 p-4 rounded-lg mb-6 space-y-4 md:space-y-0 md:flex md:space-x-4">
        <div className="flex-1">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar..."
              value={buscar}
              onChange={(e) => setBuscar(e.target.value)}
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
            <option value="PC">PC</option>
            <option value="NOTEBOOK">Notebook</option>
            <option value="IMPRESORA">Impresora</option>
            <option value="MONITOR">Monitor</option>
            <option value="TECLADO">Teclado</option>
            <option value="MOUSE">Mouse</option>
            <option value="OTRO">Otro</option>
          </select>
        </div>
        <div className="md:w-48">
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los estados</option>
            <option value="PRODUCCION">Producción</option>
            <option value="TEST">Test</option>
            <option value="FUERA_DE_SERVICIO">Fuera de Servicio</option>
            <option value="MANTENIMIENTO">Mantenimiento</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Área</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              {canManage && <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {equipos.length === 0 ? (
              <tr>
                <td colSpan={canManage ? 7 : 6} className="px-6 py-8 text-center text-gray-500">
                  <ComputerDesktopIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>No se encontraron equipos de usuario</p>
                </td>
              </tr>
            ) : (
              equipos.map((equipo) => (
                <tr key={equipo.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{equipo.nombre}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{equipo.tipo}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {equipo.usuario ? `${equipo.usuario.nombre} ${equipo.usuario.apellido}` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{equipo.area || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{equipo.ip || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getEstadoColor(equipo.estado)}`}>
                      {equipo.estado}
                    </span>
                  </td>
                  {canManage && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button className="text-blue-600 hover:text-blue-900">
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button onClick={() => handleEliminar(equipo.id)} className="text-red-600 hover:text-red-900">
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EquiposUsuario;

