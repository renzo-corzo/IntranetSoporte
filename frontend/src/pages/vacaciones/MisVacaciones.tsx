import React, { useEffect, useState } from 'react';
import { crearSolicitud, listarMias, cancelarSolicitud, type Vacacion } from '../../apiVacaciones';

const NuevaSolicitudModal: React.FC<{ isOpen: boolean; onClose: () => void; onSuccess: () => void; }> = ({ isOpen, onClose, onSuccess }) => {
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [comentario, setComentario] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setFechaInicio('');
      setFechaFin('');
      setComentario('');
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!fechaInicio || !fechaFin) { setError('Debe seleccionar ambas fechas'); return; }
    if (new Date(fechaFin) < new Date(fechaInicio)) { setError('La fecha fin no puede ser anterior a inicio'); return; }
    setLoading(true);
    try {
      await crearSolicitud({ fechaInicio, fechaFin, comentario: comentario || undefined });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Error al crear la solicitud');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="p-5 border-b">
          <h2 className="text-lg font-semibold">Nueva Solicitud de Vacaciones</h2>
        </div>
        <form className="p-5 space-y-4" onSubmit={handleSubmit}>
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Fecha inicio</label>
              <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Fecha fin</label>
              <input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)} className="input" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Comentario (opcional)</label>
            <textarea value={comentario} onChange={e => setComentario(e.target.value)} className="input" rows={3} />
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cerrar</button>
            <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Guardando...' : 'Crear'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const MisVacaciones: React.FC = () => {
  const [data, setData] = useState<Vacacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  const cargar = async () => {
    setLoading(true);
    try {
      const res = await listarMias({ limit: 50 });
      setData(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const onCancelar = async (id: number) => {
    if (!confirm('¿Cancelar esta solicitud?')) return;
    await cancelarSolicitud(id);
    cargar();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Mis Vacaciones</h1>
          <p className="text-sm text-slate-500 mt-0.5">Solicitudes propias, pasadas y futuras</p>
        </div>
        <button className="btn-primary" onClick={() => setIsOpen(true)}>Nueva Solicitud</button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="th">Inicio</th>
                <th className="th">Fin</th>
                <th className="th">Días</th>
                <th className="th">Estado</th>
                <th className="th">Comentario</th>
                <th className="th text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">Cargando...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">Sin solicitudes</td></tr>
              ) : (
                data.map(v => (
                  <tr key={v.id} className="hover:bg-gray-50">
                    <td className="td">{new Date(v.fechaInicio).toLocaleDateString()}</td>
                    <td className="td">{new Date(v.fechaFin).toLocaleDateString()}</td>
                    <td className="td">{v.diasSolicitados}</td>
                    <td className="td">
                      <span className={`badge ${v.estado === 'APROBADA' ? 'badge-success' : v.estado === 'RECHAZADA' ? 'badge-danger' : v.estado === 'CANCELADA' ? 'badge-muted' : 'badge-warning'}`}>{v.estado}</span>
                    </td>
                    <td className="td">{v.comentario || '-'}</td>
                    <td className="td text-right">
                      {v.estado === 'PENDIENTE' && (
                        <button onClick={() => onCancelar(v.id)} className="btn-danger">Cancelar</button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <NuevaSolicitudModal isOpen={isOpen} onClose={() => setIsOpen(false)} onSuccess={cargar} />
    </div>
  );
};

export default MisVacaciones;


