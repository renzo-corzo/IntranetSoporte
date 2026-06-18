import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { createServicio, updateServicio, type Servicio } from '../../services/cmdb.service';
import { getServidoresFisicos, getMaquinasVirtuales } from '../../services/cmdb.service';
import { useAuth } from '../../context/AuthContext';

interface Props {
  servicio?: Servicio | null;
  onClose: () => void;
  onSuccess: () => void;
}

const ServicioForm: React.FC<Props> = ({ servicio, onClose, onSuccess }) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [servidores, setServidores] = useState<any[]>([]);
  const [maquinas, setMaquinas] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    nombre: '',
    tipo: 'OTRO' as Servicio['tipo'],
    version: '',
    puerto: '',
    ssid: '',
    estado: 'PRODUCCION' as const,
    fechaAlta: new Date().toISOString().split('T')[0],
    fechaBaja: '',
    notasTecnicas: '',
    tipoEquipo: 'SERVIDOR_FISICO' as Servicio['tipoEquipo'] | '',
    servidorFisicoId: '',
    maquinaVirtualId: ''
  });

  useEffect(() => {
    if (token) {
      Promise.all([
        getServidoresFisicos(token, { limit: 1000 }),
        getMaquinasVirtuales(token, { limit: 1000 })
      ]).then(([servRes, vmRes]) => {
        setServidores(servRes.data || []);
        setMaquinas(vmRes.data || []);
      });
    }
  }, [token]);

  useEffect(() => {
    if (servicio) {
      setFormData({
        nombre: servicio.nombre || '',
        tipo: servicio.tipo,
        version: servicio.version || '',
        puerto: servicio.puerto?.toString() || '',
        ssid: servicio.ssid || '',
        estado: servicio.estado,
        fechaAlta: servicio.fechaAlta ? new Date(servicio.fechaAlta).toISOString().split('T')[0] : '',
        fechaBaja: servicio.fechaBaja ? new Date(servicio.fechaBaja).toISOString().split('T')[0] : '',
        notasTecnicas: servicio.notasTecnicas || '',
        tipoEquipo: servicio.tipoEquipo || '',
        servidorFisicoId: servicio.servidorFisicoId || '',
        maquinaVirtualId: servicio.maquinaVirtualId || ''
      });
    }
  }, [servicio]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    
    setLoading(true);
    setError('');

    try {
      const dataToSend = {
        nombre: formData.nombre,
        tipo: formData.tipo,
        version: formData.version || null,
        puerto: formData.puerto ? Number(formData.puerto) : null,
        ssid: formData.tipo === 'WIFI' ? (formData.ssid || null) : null,
        estado: formData.estado,
        fechaAlta: formData.fechaAlta,
        fechaBaja: formData.fechaBaja || null,
        notasTecnicas: formData.notasTecnicas || null,
        tipoEquipo: formData.tipoEquipo || null,
        servidorFisicoId: formData.tipoEquipo === 'SERVIDOR_FISICO' ? formData.servidorFisicoId || null : null,
        maquinaVirtualId: formData.tipoEquipo === 'MAQUINA_VIRTUAL' ? formData.maquinaVirtualId || null : null
      };

      if (servicio) {
        await updateServicio(servicio.id, dataToSend, token);
      } else {
        await createServicio(dataToSend, token);
      }
      
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al guardar servicio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">
            {servicio ? 'Editar Servicio' : 'Nuevo Servicio'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Información Básica</h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
              <input
                type="text"
                required
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
              <select
                required
                value={formData.tipo}
                onChange={(e) => {
                  const nuevoTipo = e.target.value as Servicio['tipo'];
                  setFormData({
                    ...formData,
                    tipo: nuevoTipo,
                    // Al elegir WiFi, lo independizamos de servidor/VM por defecto
                    tipoEquipo: nuevoTipo === 'WIFI' ? '' : formData.tipoEquipo
                  });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="SQL">SQL Server</option>
                <option value="IIS">IIS</option>
                <option value="ZABBIX">Zabbix</option>
                <option value="PROXY">Proxy</option>
                <option value="NTOPNG">ntopng</option>
                <option value="DC">Domain Controller</option>
                <option value="DNS">DNS</option>
                <option value="DHCP">DHCP</option>
                <option value="FILE_SERVER">File Server</option>
                <option value="WEB_SERVER">Web Server</option>
                <option value="MAIL_SERVER">Mail Server</option>
                <option value="BACKUP_SERVER">Backup Server</option>
                <option value="VEEAM">Veeam</option>
                <option value="VMWARE">VMware</option>
                <option value="HYPER_V">Hyper-V</option>
                <option value="WIFI">WiFi</option>
                <option value="OTRO">Otro</option>
              </select>
            </div>

            {formData.tipo === 'WIFI' ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SSID (nombre de la red)</label>
                  <input
                    type="text"
                    value={formData.ssid}
                    onChange={(e) => setFormData({ ...formData, ssid: e.target.value })}
                    placeholder="Ej: CajaAbogados-Visitas"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="md:col-span-2 -mt-2">
                  <p className="text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                    🔑 La clave de la red WiFi no se guarda aquí — después de crear el servicio, usá el botón
                    "Credenciales" en la lista de Servicios para agregarla cifrada.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Versión</label>
                  <input
                    type="text"
                    value={formData.version}
                    onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Puerto</label>
                  <input
                    type="number"
                    value={formData.puerto}
                    onChange={(e) => setFormData({ ...formData, puerto: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <select
                value={formData.estado}
                onChange={(e) => setFormData({ ...formData, estado: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="PRODUCCION">Producción</option>
                <option value="TEST">Test</option>
                <option value="FUERA_DE_SERVICIO">Fuera de Servicio</option>
                <option value="MANTENIMIENTO">Mantenimiento</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Equipo</h3>
              <p className="text-sm text-gray-500 -mt-3 mb-2">Opcional — un servicio puede ser independiente (ej: WiFi)</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Equipo</label>
              <select
                value={formData.tipoEquipo}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    tipoEquipo: e.target.value as Servicio['tipoEquipo'] | '',
                    servidorFisicoId: '',
                    maquinaVirtualId: ''
                  });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Ninguno (servicio independiente)</option>
                <option value="SERVIDOR_FISICO">Servidor Físico</option>
                <option value="MAQUINA_VIRTUAL">Máquina Virtual</option>
              </select>
            </div>

            {formData.tipoEquipo === 'SERVIDOR_FISICO' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Servidor Físico *</label>
                <select
                  required
                  value={formData.servidorFisicoId}
                  onChange={(e) => setFormData({ ...formData, servidorFisicoId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccionar servidor...</option>
                  {servidores.map(s => (
                    <option key={s.id} value={s.id}>{s.nombre} {s.ip ? `(${s.ip})` : ''}</option>
                  ))}
                </select>
              </div>
            )}

            {formData.tipoEquipo === 'MAQUINA_VIRTUAL' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Máquina Virtual *</label>
                <select
                  required
                  value={formData.maquinaVirtualId}
                  onChange={(e) => setFormData({ ...formData, maquinaVirtualId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccionar VM...</option>
                  {maquinas.map(vm => (
                    <option key={vm.id} value={vm.id}>{vm.nombre} {vm.ip ? `(${vm.ip})` : ''}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Alta</label>
              <input
                type="date"
                value={formData.fechaAlta}
                onChange={(e) => setFormData({ ...formData, fechaAlta: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Baja</label>
              <input
                type="date"
                value={formData.fechaBaja}
                onChange={(e) => setFormData({ ...formData, fechaBaja: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notas Técnicas</label>
              <textarea
                value={formData.notasTecnicas}
                onChange={(e) => setFormData({ ...formData, notasTecnicas: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Guardando...' : servicio ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ServicioForm;

