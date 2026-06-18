import React from 'react';
import { KeyIcon } from '@heroicons/react/24/outline';
import CredencialesPanel from './CredencialesPanel';
import type { TipoEquipoCredencial } from '../../services/cmdb.service';

interface Props {
  tipoEquipo: TipoEquipoCredencial;
  equipoId: string;
  nombre: string;
  canManage: boolean;
  onClose: () => void;
}

const CredencialesModal: React.FC<Props> = ({ tipoEquipo, equipoId, nombre, canManage, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <KeyIcon className="w-5 h-5 text-gray-500" />
            Credenciales — {nombre}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <div className="p-6">
          <CredencialesPanel tipoEquipo={tipoEquipo} equipoId={equipoId} canManage={canManage} />
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

export default CredencialesModal;
