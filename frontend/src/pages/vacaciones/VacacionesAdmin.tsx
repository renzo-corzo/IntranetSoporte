import React, { useEffect, useState } from 'react';
import { listarTodas, aprobarSolicitud, rechazarSolicitud } from '../../apiVacaciones';

const DecisionModal: React.FC<{ isOpen: boolean; titulo: string; onClose: () => void; onConfirm: (comentario?: string) => void; }> = ({ isOpen, titulo, onClose, onConfirm }) => {
  const [comentario, setComentario] = useState('');
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="p-5 border-b"><h2 className="text-lg font-semibold">{titulo}</h2></div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Comentario (opcional)</label>
            <textarea className="input" rows={3} value={comentario} onChange={e=>setComentario(e.target.value)} />
          </div>
          <div className="flex justify-end space-x-2">
            <button className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button className="btn-primary" onClick={()=>{ onConfirm(comentario || undefined); onClose(); }}>Confirmar</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const VacacionesAdmin: React.FC = () => {
  const [filtros, setFiltros] = useState<{ estado: string; usuarioId: string; desde: string; hasta: string }>({ estado: '', usuarioId: '', desde: '', hasta: '' });
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [modal, setModal] = useState<{ open: boolean; id?: number; tipo?: 'aprobar'|'rechazar' }>(() => ({ open: false }));

  const cargar = async () => {
    setLoading(true);
    try {
      const res = await listarTodas({
        estado: filtros.estado ? (filtros.estado as any) : undefined,
        usuarioId: filtros.usuarioId ? parseInt(filtros.usuarioId) : undefined,
        desde: filtros.desde || undefined,
        hasta: filtros.hasta || undefined,
        page,
        limit: 20,
      });
      setData(res.data);
      setTotal(res.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(()=>{ cargar(); }, [page]);

  const onAprobar = async (id: number, comentario?: string) => { await aprobarSolicitud(id, comentario); cargar(); };
  const onRechazar = async (id: number, comentario?: string) => { await rechazarSolicitud(id, comentario); cargar(); };

  const totalPages = Math.max(1, Math.ceil(total/20));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Administración de Vacaciones</h1>
          <p className="text-gray-600">Aprobación, rechazo y consulta de solicitudes</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border p-4 grid grid-cols-1 md:grid-cols-5 gap-3">
        <select className="input" value={filtros.estado} onChange={e=>setFiltros({...filtros, estado: e.target.value})}>
          <option value="">Todos los estados</option>
          <option value="PENDIENTE">Pendiente</option>
          <option value="APROBADA">Aprobada</option>
          <option value="RECHAZADA">Rechazada</option>
          <option value="CANCELADA">Cancelada</option>
        </select>
        <input className="input" placeholder="Usuario ID (opcional)" value={filtros.usuarioId} onChange={e=>setFiltros({...filtros, usuarioId: e.target.value})} />
        <input type="date" className="input" value={filtros.desde} onChange={e=>setFiltros({...filtros, desde: e.target.value})} />
        <input type="date" className="input" value={filtros.hasta} onChange={e=>setFiltros({...filtros, hasta: e.target.value})} />
        <div className="flex gap-2">
          <button className="btn-secondary w-full" onClick={()=>{ setPage(1); cargar(); }}>Aplicar</button>
          <button className="btn-light w-full" onClick={()=>{ setFiltros({estado:'',usuarioId:'',desde:'',hasta:''}); setPage(1); cargar(); }}>Limpiar</button>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="th">Solicitante</th>
                <th className="th">Departamento</th>
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
                <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">Cargando...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">Sin resultados</td></tr>
              ) : (
                data.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50">
                    <td className="td">{v.solicitante?.nombre || v.solicitanteId}</td>
                    <td className="td">{v.solicitante?.departamento || '-'}</td>
                    <td className="td">{new Date(v.fechaInicio).toLocaleDateString()}</td>
                    <td className="td">{new Date(v.fechaFin).toLocaleDateString()}</td>
                    <td className="td">{v.diasSolicitados}</td>
                    <td className="td"><span className={`badge ${v.estado === 'APROBADA' ? 'badge-success' : v.estado === 'RECHAZADA' ? 'badge-danger' : v.estado === 'CANCELADA' ? 'badge-muted' : 'badge-warning'}`}>{v.estado}</span></td>
                    <td className="td">{v.comentario || '-'}</td>
                    <td className="td text-right space-x-2">
                      {v.estado === 'PENDIENTE' && (
                        <>
                          <button className="btn-success" onClick={()=> setModal({ open: true, id: v.id, tipo: 'aprobar' })}>Aprobar</button>
                          <button className="btn-danger" onClick={()=> setModal({ open: true, id: v.id, tipo: 'rechazar' })}>Rechazar</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Paginación simple */}
        <div className="flex items-center justify-between p-3 border-t text-sm text-gray-600">
          <span>Total: {total}</span>
          <div className="space-x-2">
            <button className="btn-light" disabled={page<=1} onClick={()=> setPage((p)=>Math.max(1,p-1))}>Anterior</button>
            <button className="btn-light" disabled={page>=totalPages} onClick={()=> setPage((p)=>Math.min(totalPages,p+1))}>Siguiente</button>
          </div>
        </div>
      </div>

      <DecisionModal
        isOpen={modal.open}
        titulo={modal.tipo === 'aprobar' ? 'Aprobar solicitud' : 'Rechazar solicitud'}
        onClose={()=> setModal({ open:false })}
        onConfirm={(c)=> {
          if (!modal.id) return;
          if (modal.tipo === 'aprobar') onAprobar(modal.id, c); else onRechazar(modal.id, c);
        }}
      />
    </div>
  );
};

export default VacacionesAdmin;


