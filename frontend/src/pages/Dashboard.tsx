import React, { useMemo } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  HomeIcon,
  ClipboardDocumentListIcon,
  LinkIcon,
  CubeIcon,
  CheckCircleIcon,
  DeviceTabletIcon,
  Cog6ToothIcon,
  ClipboardDocumentCheckIcon,
  CalendarDaysIcon,
  ServerIcon
} from "@heroicons/react/24/outline";

const navItems = [
  { to: "/dashboard/home", label: "Inicio", icon: HomeIcon },
  { to: "/dashboard/relevamientos", label: "Relevamientos", icon: ClipboardDocumentListIcon },
  { to: "/dashboard/links", label: "Links", icon: LinkIcon },
  { to: "/dashboard/stock", label: "Stock", icon: CubeIcon },
  { to: "/dashboard/cmdb", label: "CMDB", icon: ServerIcon },
  { to: "/dashboard/tareas", label: "Tareas", icon: CheckCircleIcon },
  { to: "/dashboard/procedimientos", label: "Procedimientos", icon: ClipboardDocumentCheckIcon },
  { to: "/dashboard/diagramas", label: "Diagramas", icon: DeviceTabletIcon },
  { to: "/dashboard/vacaciones/mis", label: "Vacaciones", icon: CalendarDaysIcon },
  { to: "/dashboard/admin", label: "Admin", icon: Cog6ToothIcon },
];

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const hasPerm = (p: string) => (user?.permisos || []).includes(p) || user?.rol === 'admin';
  const items = useMemo(() => {
    // Mapa de permisos requeridos por ruta
    const permissionMap: Record<string, string | string[] | null> = {
      "/dashboard/home": null,
      "/dashboard/relevamientos": "ver_monitor",
      "/dashboard/links": "ver_documentos",
      "/dashboard/stock": ["stock:read", "ver_stock"],
      "/dashboard/cmdb": ["cmdb:read", "cmdb:manage"],
      "/dashboard/tareas": null,
      "/dashboard/procedimientos": "ver_documentos",
      "/dashboard/diagramas": "ver_documentos",
      "/dashboard/vacaciones/mis": "ver_vacaciones",
      "/dashboard/admin": "ver_roles",
    };

    return navItems.filter((it) => {
      const required = permissionMap[it.to];
      if (it.to === '/dashboard/admin') return hasPerm('ver_roles') || hasPerm('asignar_permisos');
      if (!required) return true; // público
      const requiredList = Array.isArray(required) ? required : [required];
      return requiredList.some(hasPerm);
    });
  }, [user]);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Sidebar Moderno */}
      <aside className="min-w-[280px] w-80 bg-white/80 backdrop-blur-xl border-r border-gray-200/50 flex flex-col justify-between py-8 px-6 shadow-2xl">
        <div>
          {/* Logo y Header */}
          <div className="mb-12 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">IC</span>
            </div>
            <h1 className="text-lg font-bold text-gray-800 tracking-tight leading-tight">Infraestructura</h1>
            <p className="text-sm text-gray-500 font-medium">Caja de Abogados</p>
          </div>
          
          {/* Navigation */}
          <nav className="space-y-2">
            {items.map((item) => {
              const Icon = item.icon;
              // Mostrar Admin Vacaciones sólo a admin se hará con item.to === '/dashboard/vacaciones/admin'
              if (item.to === '/dashboard/vacaciones/admin') return null;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `nav-link ${isActive ? "nav-link-active" : ""}`
                  }
                >
                  <Icon className="w-5 h-5 mr-3" />
                  <span className="font-medium">{item.label}</span>
                </NavLink>
              );
            })}
            {/* Enlace RRHH: requiere permiso o rol dedicado */}
            {(hasPerm('rrhh:ver') || user?.rol === 'admin_rrhh' || user?.rol === 'rrhh') && (
              <NavLink
                to="/dashboard/rrhh"
                className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
              >
                <CalendarDaysIcon className="w-5 h-5 mr-3" />
                <span className="font-medium">🧑‍💼 RRHH</span>
              </NavLink>
            )}
          </nav>
        </div>
        
        {/* User Section */}
        <div className="space-y-4">
          <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">{user?.nombre?.charAt(0)}</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">{user?.nombre}</p>
                <p className="text-xs text-gray-600 capitalize">{user?.rol}</p>
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            className="btn-danger w-full"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Cerrar sesión
          </button>
        </div>
      </aside>
      
      {/* Main content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Dashboard; 