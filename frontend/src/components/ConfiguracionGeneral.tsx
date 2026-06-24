import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useConfiguracion } from "../context/ConfiguracionContext";
import { actualizarConfiguracion, probarConexionZabbix } from "../services/configuracion.service";

const ConfiguracionGeneral: React.FC = () => {
  const { token } = useAuth();
  const { configuracion, loading, refrescarConfiguracion } = useConfiguracion();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [zabbixUrl, setZabbixUrl] = useState("");
  const [zabbixUsuario, setZabbixUsuario] = useState("");
  const [zabbixPassword, setZabbixPassword] = useState("");
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [testing, setTesting] = useState(false);
  const [savingZabbix, setSavingZabbix] = useState(false);
  const [errorZabbix, setErrorZabbix] = useState("");

  React.useEffect(() => {
    if (configuracion) {
      setZabbixUrl(configuracion.zabbixUrl || "");
      setZabbixUsuario(configuracion.zabbixUsuario || "");
    }
  }, [configuracion]);

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

  const handleProbarConexion = async () => {
    if (!token) return;
    setTesting(true);
    setTestResult(null);
    try {
      await probarConexionZabbix(token, { url: zabbixUrl, usuario: zabbixUsuario, password: zabbixPassword });
      setTestResult({ ok: true, msg: "Conexión exitosa" });
    } catch (err: any) {
      setTestResult({ ok: false, msg: err.response?.data?.error || "Error al probar la conexión" });
    } finally {
      setTesting(false);
    }
  };

  const handleGuardarZabbix = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSavingZabbix(true);
    setErrorZabbix("");
    try {
      await actualizarConfiguracion(token, {
        zabbixUrl,
        zabbixUsuario,
        ...(zabbixPassword && { zabbixPassword })
      });
      setZabbixPassword("");
      await refrescarConfiguracion();
    } catch (err: any) {
      setErrorZabbix(err.response?.data?.error || "Error al guardar la configuración de Zabbix");
    } finally {
      setSavingZabbix(false);
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

      <h3 className="text-lg font-semibold text-gray-800 mb-1 mt-8">Integración Zabbix</h3>
      <p className="text-sm text-gray-500 mb-4">
        Un único servidor Zabbix para toda la instalación {configuracion.zabbixConfigurado && <span className="text-green-600">(configurado)</span>}.
        Cada cliente se distingue por su grupo de hosts, configurable en Clientes.
      </p>

      <form onSubmit={handleGuardarZabbix} className="border border-gray-200 rounded-lg p-4 space-y-2">
        {errorZabbix && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">{errorZabbix}</div>
        )}
        <input
          type="text"
          placeholder="URL (ej: http://192.168.1.10/zabbix/api_jsonrpc.php)"
          value={zabbixUrl}
          onChange={(e) => setZabbixUrl(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
        />
        <input
          type="text"
          placeholder="Usuario"
          value={zabbixUsuario}
          onChange={(e) => setZabbixUsuario(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
        />
        <input
          type="password"
          placeholder={configuracion.zabbixConfigurado ? "Contraseña (dejar vacío para no cambiar)" : "Contraseña"}
          value={zabbixPassword}
          onChange={(e) => setZabbixPassword(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
        />
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleProbarConexion}
            disabled={testing || !zabbixUrl || !zabbixUsuario || !zabbixPassword}
            className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {testing ? "Probando..." : "Probar conexión"}
          </button>
          <button
            type="submit"
            disabled={savingZabbix}
            className="text-sm px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {savingZabbix ? "Guardando..." : "Guardar"}
          </button>
        </div>
        {!zabbixPassword && configuracion.zabbixConfigurado && (
          <p className="text-xs text-gray-500">Para probar la conexión actual, volvé a escribir la contraseña.</p>
        )}
        {testResult && (
          <p className={`text-xs ${testResult.ok ? "text-green-600" : "text-red-600"}`}>{testResult.msg}</p>
        )}
      </form>
    </div>
  );
};

export default ConfiguracionGeneral;
