import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useAuth } from "./AuthContext";
import { getEmpresas, type Empresa } from "../services/empresa.service";

interface EmpresaContextType {
  empresas: Empresa[];
  empresaActiva: Empresa | null;
  loading: boolean;
  setEmpresaActiva: (empresa: Empresa) => void;
  refrescarEmpresas: () => Promise<void>;
}

const EmpresaContext = createContext<EmpresaContextType | undefined>(undefined);

const STORAGE_KEY = "empresaActivaId";

export const EmpresaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuth();
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [empresaActiva, setEmpresaActivaState] = useState<Empresa | null>(null);
  const [loading, setLoading] = useState(true);

  const setEmpresaActiva = (empresa: Empresa) => {
    setEmpresaActivaState(empresa);
    localStorage.setItem(STORAGE_KEY, empresa.id);
    axios.defaults.headers.common["X-Empresa-Id"] = empresa.id;
  };

  const cargarEmpresas = useCallback(async () => {
    if (!token) return;
    const lista = await getEmpresas(token);
    setEmpresas(lista);

    const idGuardado = localStorage.getItem(STORAGE_KEY);
    const actual = lista.find(e => e.id === idGuardado) || lista[0] || null;
    if (actual) {
      setEmpresaActiva(actual);
    } else {
      setEmpresaActivaState(null);
      delete axios.defaults.headers.common["X-Empresa-Id"];
    }
  }, [token]);

  useEffect(() => {
    setLoading(true);
    cargarEmpresas().finally(() => setLoading(false));
  }, [cargarEmpresas]);

  return (
    <EmpresaContext.Provider
      value={{ empresas, empresaActiva, loading, setEmpresaActiva, refrescarEmpresas: cargarEmpresas }}
    >
      {children}
    </EmpresaContext.Provider>
  );
};

export const useEmpresa = () => {
  const context = useContext(EmpresaContext);
  if (!context) throw new Error("useEmpresa debe usarse dentro de EmpresaProvider");
  return context;
};
