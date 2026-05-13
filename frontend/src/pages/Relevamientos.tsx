import React, { useState } from "react";
import RelevamientoTable from "../components/RelevamientoTable";
import RelevamientoForm from "../components/RelevamientoForm";
import ManualRelevamientosTable from "../components/ManualRelevamientosTable";

const Relevamientos: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'zabbix' | 'manual'>('zabbix');
  const [showForm, setShowForm] = useState(false);
  const [tableKey, setTableKey] = useState(0);

  const handleFormSuccess = () => {
    setShowForm(false);
    setTableKey(k => k + 1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Relevamientos</h1>
          <p className="text-sm text-slate-500 mt-0.5">Gestión y monitoreo de inventario de dispositivos</p>
        </div>
      </div>

      {/* Pestañas */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <nav className="flex space-x-8 px-6">
          <button
            onClick={() => setActiveTab('zabbix')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
              activeTab === 'zabbix'
                ? 'border-blue-500 text-blue-600 bg-blue-50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <span className="text-lg">🔍</span>
              <span>Inventario automático (Zabbix)</span>
            </div>
          </button>
          <button
            onClick={() => { setActiveTab('manual'); setShowForm(false); }}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
              activeTab === 'manual'
                ? 'border-blue-500 text-blue-600 bg-blue-50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <span className="text-lg">✏️</span>
              <span>Relevamientos manuales</span>
            </div>
          </button>
        </nav>
      </div>

      {/* Contenido */}
      {activeTab === 'zabbix' ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Estado de dispositivos Zabbix</h2>
              <p className="text-gray-600">Monitoreo en tiempo real de la infraestructura</p>
            </div>
          </div>
          <RelevamientoTable />
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Relevamientos manuales</h2>
              <p className="text-gray-600">Gestión de inventario manual y personalizado</p>
            </div>
            <button
              className="btn-success"
              onClick={() => setShowForm(f => !f)}
            >
              <span>{showForm ? "❌" : "➕"}</span>
              <span>{showForm ? "Cancelar" : "Nuevo relevamiento"}</span>
            </button>
          </div>
          {showForm
            ? <RelevamientoForm onSuccess={handleFormSuccess} />
            : <ManualRelevamientosTable key={tableKey} />
          }
        </div>
      )}
    </div>
  );
};

export default Relevamientos;
