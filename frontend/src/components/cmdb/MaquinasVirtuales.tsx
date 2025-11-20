import React, { useState, useEffect } from 'react';
import { PlusIcon, MagnifyingGlassIcon, PencilIcon, TrashIcon, CpuChipIcon } from '@heroicons/react/24/outline';
import {
  getMaquinasVirtuales,
  createMaquinaVirtual,
  updateMaquinaVirtual,
  deleteMaquinaVirtual,
  type MaquinaVirtual
} from '../../services/cmdb.service';
import { useAuth } from '../../context/AuthContext';
import MaquinaVirtualForm from './MaquinaVirtualForm';

const MaquinasVirtuales: React.FC = () => {
  const { token, user } = useAuth();
  const hasPerm = (perm: string) => (user?.permisos || []).includes(perm) || user?.rol === 'admin';
  const canManage = hasPerm('cmdb:manage');
  
  const [maquinas, setMaquinas] = useState<MaquinaVirtual[]>([]);
  const [loading, setLoading] = useState(true);
  const [buscar, setBuscar] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [maquinaEdit, setMaquinaEdit] = useState<MaquinaVirtual | null>(null);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    cargarMaquinas();
  }, [buscar, filtroEstado]);

  const cargarMaquinas = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params: any = { page: 1, limit: 100 };
      if (buscar) params.buscar = buscar;
      if (filtroEstado) params.estado = filtroEstado;
      
      const response = await getMaquinasVirtuales(token, params);
      setMaquinas(response.data || []);
      setTotal(response.total || 0);
    } catch (error) {
      console.error('Error al cargar máquinas virtuales:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCrear = () => {
    setMaquinaEdit(null);
    setShowForm(true);
  };

  const handleEditar = (maquina: MaquinaVirtual) => {
    setMaquinaEdit(maquina);
    setShowForm(true);
  };

  const handleEliminar = async (id: string) => {
    if (!token || !window.confirm('¿Estás seguro de eliminar esta máquina virtual?')) return;
    try {
      await deleteMaquinaVirtual(id, token);
      cargarMaquinas();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al eliminar máquina virtual');
    }
  };

  const handleFormSubmit = () => {
    setShowForm(false);
    setMaquinaEdit(null);
    cargarMaquinas();
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
        <p className="mt-2 text-gray-600">Cargando máquinas virtuales...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Máquinas Virtuales</h2>
          <p className="text-gray-600 text-sm">Total: {total} máquinas</p>
        </div>
        {canManage && (
          <button
            onClick={handleCrear}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Nueva VM</span>
          </button>
        )}
      </div>

      <div className="bg-gray-50 p-4 rounded-lg mb-6 space-y-4 md:space-y-0 md:flex md:space-x-4">
        <div className="flex-1">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, IP, rol..."
              value={buscar}
              onChange={(e) => setBuscar(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SO</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Host</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Servicios</th>
              {canManage && <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {maquinas.length === 0 ? (
              <tr>
                <td colSpan={canManage ? 8 : 7} className="px-6 py-8 text-center text-gray-500">
                  <CpuChipIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>No se encontraron máquinas virtuales</p>
                </td>
              </tr>
            ) : (
              maquinas.map((maquina) => (
                <tr key={maquina.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{maquina.nombre}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{maquina.ip || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{maquina.rol || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{maquina.sistemaOperativo || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{maquina.host?.nombre || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getEstadoColor(maquina.estado)}`}>
                      {maquina.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{maquina._count?.servicios || 0}</td>
                  {canManage && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button onClick={() => handleEditar(maquina)} className="text-blue-600 hover:text-blue-900">
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button onClick={() => handleEliminar(maquina.id)} className="text-red-600 hover:text-red-900">
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

      {showForm && (
        <MaquinaVirtualForm
          maquina={maquinaEdit}
          onClose={() => {
            setShowForm(false);
            setMaquinaEdit(null);
          }}
          onSuccess={handleFormSubmit}
        />
      )}
    </div>
  );
};

export default MaquinasVirtuales;

