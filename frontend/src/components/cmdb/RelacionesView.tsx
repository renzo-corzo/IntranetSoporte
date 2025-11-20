import React, { useState, useEffect } from 'react';
import { LinkIcon, ServerIcon, CpuChipIcon, ComputerDesktopIcon, CogIcon } from '@heroicons/react/24/outline';
import {
  getServidorFisico,
  getMaquinaVirtual,
  getEquipoUsuario,
  type ServidorFisico,
  type MaquinaVirtual,
  type EquipoUsuario
} from '../../services/cmdb.service';
import { useAuth } from '../../context/AuthContext';

interface Props {
  tipo: 'servidor' | 'vm' | 'equipo-usuario';
  id: string;
  onClose: () => void;
}

const RelacionesView: React.FC<Props> = ({ tipo, id, onClose }) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    cargarRelaciones();
  }, [tipo, id]);

  const cargarRelaciones = async () => {
    if (!token) return;
    setLoading(true);
    try {
      if (tipo === 'servidor') {
        const servidor = await getServidorFisico(id, token);
        setData(servidor);
      } else if (tipo === 'vm') {
        const vm = await getMaquinaVirtual(id, token);
        setData(vm);
      } else if (tipo === 'equipo-usuario') {
        const equipo = await getEquipoUsuario(id, token);
        setData(equipo);
      }
    } catch (error) {
      console.error('Error al cargar relaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando relaciones...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <p className="text-gray-600">No se encontraron datos</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-gray-200 rounded-lg">
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Relaciones y Vínculos</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Información Principal */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              {tipo === 'servidor' && <ServerIcon className="h-5 w-5 inline mr-2" />}
              {tipo === 'vm' && <CpuChipIcon className="h-5 w-5 inline mr-2" />}
              {tipo === 'equipo-usuario' && <ComputerDesktopIcon className="h-5 w-5 inline mr-2" />}
              {data.nombre}
            </h3>
            <p className="text-sm text-blue-700">{data.ip && `IP: ${data.ip}`}</p>
          </div>

          {/* Relaciones según el tipo */}
          {tipo === 'servidor' && (
            <>
              {/* VMs en este servidor */}
              {data.maquinasVirtuales && data.maquinasVirtuales.length > 0 && (
                <div>
                  <h4 className="text-md font-semibold text-gray-700 mb-3 flex items-center">
                    <CpuChipIcon className="h-5 w-5 mr-2" />
                    Máquinas Virtuales ({data.maquinasVirtuales.length})
                  </h4>
                  <div className="space-y-2">
                    {data.maquinasVirtuales.map((vm: MaquinaVirtual) => (
                      <div key={vm.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-900">{vm.nombre}</p>
                            <p className="text-sm text-gray-600">
                              {vm.rol && `Rol: ${vm.rol} • `}
                              {vm.sistemaOperativo && `SO: ${vm.sistemaOperativo} • `}
                              {vm.ip && `IP: ${vm.ip}`}
                            </p>
                            <span className={`inline-block mt-1 px-2 py-1 text-xs font-semibold rounded-full ${
                              vm.estado === 'PRODUCCION' ? 'bg-green-100 text-green-800' :
                              vm.estado === 'TEST' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {vm.estado}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Servicios en este servidor */}
              {data.servicios && data.servicios.length > 0 && (
                <div>
                  <h4 className="text-md font-semibold text-gray-700 mb-3 flex items-center">
                    <CogIcon className="h-5 w-5 mr-2" />
                    Servicios ({data.servicios.length})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {data.servicios.map((servicio: any) => (
                      <div key={servicio.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <p className="font-medium text-gray-900">{servicio.nombre}</p>
                        <p className="text-sm text-gray-600">
                          {servicio.tipo}
                          {servicio.version && ` • v${servicio.version}`}
                          {servicio.puerto && ` • Puerto: ${servicio.puerto}`}
                        </p>
                        <span className={`inline-block mt-1 px-2 py-1 text-xs font-semibold rounded-full ${
                          servicio.estado === 'PRODUCCION' ? 'bg-green-100 text-green-800' :
                          servicio.estado === 'TEST' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {servicio.estado}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {tipo === 'vm' && (
            <>
              {/* Host del servidor físico */}
              {data.host && (
                <div>
                  <h4 className="text-md font-semibold text-gray-700 mb-3 flex items-center">
                    <ServerIcon className="h-5 w-5 mr-2" />
                    Servidor Físico (Host)
                  </h4>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <p className="font-medium text-gray-900">{data.host.nombre}</p>
                    <p className="text-sm text-gray-600">
                      {data.host.rol && `Rol: ${data.host.rol} • `}
                      {data.host.ip && `IP: ${data.host.ip} • `}
                      {data.host.ubicacion && `Ubicación: ${data.host.ubicacion}`}
                    </p>
                  </div>
                </div>
              )}

              {/* Servicios en esta VM */}
              {data.servicios && data.servicios.length > 0 && (
                <div>
                  <h4 className="text-md font-semibold text-gray-700 mb-3 flex items-center">
                    <CogIcon className="h-5 w-5 mr-2" />
                    Servicios ({data.servicios.length})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {data.servicios.map((servicio: any) => (
                      <div key={servicio.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <p className="font-medium text-gray-900">{servicio.nombre}</p>
                        <p className="text-sm text-gray-600">
                          {servicio.tipo}
                          {servicio.version && ` • v${servicio.version}`}
                          {servicio.puerto && ` • Puerto: ${servicio.puerto}`}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {tipo === 'equipo-usuario' && data.usuario && (
            <div>
              <h4 className="text-md font-semibold text-gray-700 mb-3 flex items-center">
                <ComputerDesktopIcon className="h-5 w-5 mr-2" />
                Usuario Asignado
              </h4>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <p className="font-medium text-gray-900">
                  {data.usuario.nombre} {data.usuario.apellido}
                </p>
                {data.area && (
                  <p className="text-sm text-gray-600">Área: {data.area}</p>
                )}
              </div>
            </div>
          )}

          {/* Mensaje si no hay relaciones */}
          {tipo === 'servidor' && (!data.maquinasVirtuales || data.maquinasVirtuales.length === 0) && 
           (!data.servicios || data.servicios.length === 0) && (
            <div className="text-center py-8 text-gray-500">
              <p>No hay relaciones registradas para este servidor</p>
            </div>
          )}

          {tipo === 'vm' && !data.host && (!data.servicios || data.servicios.length === 0) && (
            <div className="text-center py-8 text-gray-500">
              <p>No hay relaciones registradas para esta máquina virtual</p>
            </div>
          )}

          {tipo === 'equipo-usuario' && !data.usuario && (
            <div className="text-center py-8 text-gray-500">
              <p>Este equipo no tiene usuario asignado</p>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default RelacionesView;

