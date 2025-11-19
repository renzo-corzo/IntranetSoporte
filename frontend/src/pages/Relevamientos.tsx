import React, { useState } from "react";
import RelevamientoTable from "../components/RelevamientoTable";
import RelevamientoForm from "../components/RelevamientoForm";
// import RelevamientoDetail from "../components/RelevamientoDetail";

const Relevamientos: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'zabbix' | 'manual'>('zabbix');
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="max-w-7xl mx-auto mt-4">
      <div className="mb-6">
        <div className="flex items-center space-x-3 mb-2">
          <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">📊</span>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Relevamientos
          </h1>
        </div>
        <p className="text-gray-600 text-lg">Gestión y monitoreo de inventario de dispositivos</p>
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
            onClick={() => setActiveTab('manual')}
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

      {/* Contenido de las pestañas */}
      {activeTab === 'zabbix' ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Estado de dispositivos Zabbix</h2>
              <p className="text-gray-600">Monitoreo en tiempo real de la infraestructura</p>
            </div>
            <button
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg flex items-center space-x-2"
              onClick={() => {/* Función para refrescar datos */}}
            >
              <span>🔄</span>
              <span>Actualizar</span>
            </button>
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
              className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-md hover:shadow-lg flex items-center space-x-2"
              onClick={() => setShowForm(!showForm)}
            >
              <span>{showForm ? "❌" : "➕"}</span>
              <span>{showForm ? "Cancelar" : "Nuevo relevamiento"}</span>
            </button>
          </div>
          {showForm ? <RelevamientoForm /> : <RelevamientoTable />}
        </div>
      )}
    </div>
  );
};

export default Relevamientos; 