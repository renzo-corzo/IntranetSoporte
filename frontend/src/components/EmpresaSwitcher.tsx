import React from "react";
import { BuildingOfficeIcon } from "@heroicons/react/24/outline";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useEmpresa } from "../context/EmpresaContext";

const EmpresaSwitcher: React.FC = () => {
  const { empresas, empresaActiva, setEmpresaActiva, loading } = useEmpresa();

  if (loading) return null;

  if (empresas.length === 0) {
    return (
      <span className="text-xs text-slate-400">Sin clientes configurados</span>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <BuildingOfficeIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />
      <Select
        value={empresaActiva?.id}
        onValueChange={(id) => {
          if (id === empresaActiva?.id) return;
          const empresa = empresas.find(e => e.id === id);
          if (!empresa) return;
          setEmpresaActiva(empresa);
          // Recarga completa: las vistas (CMDB/Stock/Tareas/etc.) hacen fetch en
          // el mount y no escuchan cambios de empresa activa, así que sin esto
          // quedarían mostrando datos del cliente anterior hasta navegar.
          window.location.reload();
        }}
      >
        <SelectTrigger className="h-8 w-44 text-sm border-slate-200">
          <SelectValue placeholder="Seleccionar cliente" />
        </SelectTrigger>
        <SelectContent>
          {empresas.map((empresa) => (
            <SelectItem key={empresa.id} value={empresa.id}>
              {empresa.nombre}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default EmpresaSwitcher;
