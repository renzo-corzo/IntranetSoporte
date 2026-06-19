import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { getConfiguracion, type ConfiguracionSistema } from "../services/configuracion.service";

interface ConfiguracionContextType {
  configuracion: ConfiguracionSistema | null;
  loading: boolean;
  refrescarConfiguracion: () => Promise<void>;
}

const ConfiguracionContext = createContext<ConfiguracionContextType | undefined>(undefined);

export const ConfiguracionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuth();
  const [configuracion, setConfiguracion] = useState<ConfiguracionSistema | null>(null);
  const [loading, setLoading] = useState(true);

  const cargar = useCallback(async () => {
    if (!token) return;
    const config = await getConfiguracion(token);
    setConfiguracion(config);
  }, [token]);

  useEffect(() => {
    setLoading(true);
    cargar().finally(() => setLoading(false));
  }, [cargar]);

  return (
    <ConfiguracionContext.Provider value={{ configuracion, loading, refrescarConfiguracion: cargar }}>
      {children}
    </ConfiguracionContext.Provider>
  );
};

export const useConfiguracion = () => {
  const context = useContext(ConfiguracionContext);
  if (!context) throw new Error("useConfiguracion debe usarse dentro de ConfiguracionProvider");
  return context;
};
