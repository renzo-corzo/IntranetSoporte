import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useConfiguracion } from "../context/ConfiguracionContext";
import { actualizarConfiguracion } from "../services/configuracion.service";

const ConfiguracionGeneral: React.FC = () => {
  const { token } = useAuth();
  const { configuracion, loading, refrescarConfiguracion } = useConfiguracion();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const toggleRrhh = async () => {
    if (!token || !configuracion) return;
    setSaving(true);
    setError("");
    try {
      await actualizarConfiguracion(token, { rrhhHabilitado: !configuracion.rrhhHabilitado });
      await refrescarConfiguracion();
    } catch (err: any) {
      setError(err.response?.data?.error || "Error al guardar la configuración");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !configuracion) {
    return <div className="text-center py-8 text-gray-400">Cargando...</div>;
  }

  return (
    <div className="max-w-2xl">
      <h3 className="text-lg font-semibold text-gray-800 mb-1">Módulos globales</h3>
      <p className="text-sm text-gray-500 mb-4">
        Esto no es por cliente: afecta a toda la instalación.
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm mb-4">{error}</div>
      )}

      <div className="flex items-center justify-between border border-gray-200 rounded-lg p-4">
        <div>
          <p className="font-medium text-gray-800">RRHH y Vacaciones</p>
          <p className="text-sm text-gray-500">
            Gestión de personal propio (empleados, licencias, vacaciones). Si tu empresa no usa este módulo, podés ocultarlo.
          </p>
        </div>
        <button
          onClick={toggleRrhh}
          disabled={saving}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ml-4 ${
            configuracion.rrhhHabilitado ? "bg-blue-600" : "bg-gray-300"
          } disabled:opacity-50`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              configuracion.rrhhHabilitado ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>
    </div>
  );
};

export default ConfiguracionGeneral;
