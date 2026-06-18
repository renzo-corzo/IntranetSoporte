import React, { useMemo, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import EmpresaSwitcher from "../components/EmpresaSwitcher";
import {
  HomeIcon,
  ClipboardDocumentListIcon,
  LinkIcon,
  CubeIcon,
  CheckCircleIcon,
  Cog6ToothIcon,
  ClipboardDocumentCheckIcon,
  CalendarDaysIcon,
  ServerIcon,
  BuildingOfficeIcon,
  Bars3Icon,
  ArrowRightOnRectangleIcon,
  UserGroupIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";

type NavItem = {
  to: string;
  label: string;
  icon: React.ElementType;
  permission: string | string[] | null;
};

const NAV_ITEMS: NavItem[] = [
  { to: "/dashboard/home",           label: "Inicio",          icon: HomeIcon,                    permission: null },
  { to: "/dashboard/relevamientos",  label: "Relevamientos",   icon: ClipboardDocumentListIcon,   permission: "ver_monitor" },
  { to: "/dashboard/links",          label: "Links",            icon: LinkIcon,                    permission: "ver_documentos" },
  { to: "/dashboard/stock",          label: "Stock",            icon: CubeIcon,                    permission: ["stock:read", "ver_stock"] },
  { to: "/dashboard/cmdb",           label: "CMDB",             icon: ServerIcon,                  permission: ["cmdb:read", "cmdb:manage"] },
  { to: "/dashboard/tareas",         label: "Tareas",           icon: CheckCircleIcon,             permission: null },
  { to: "/dashboard/procedimientos", label: "Procedimientos",   icon: ClipboardDocumentCheckIcon,  permission: "ver_documentos" },
  { to: "/dashboard/vacaciones/mis", label: "Vacaciones",       icon: CalendarDaysIcon,            permission: "ver_vacaciones" },
  { to: "/dashboard/admin",          label: "Admin",            icon: Cog6ToothIcon,               permission: ["ver_roles", "asignar_permisos"] },
];

const ROUTE_LABELS: Record<string, string> = {
  home: "Inicio",
  relevamientos: "Relevamientos",
  links: "Links Útiles",
  stock: "Stock",
  cmdb: "CMDB",
  empresas: "Clientes",
  tareas: "Tareas",
  procedimientos: "Procedimientos",
  admin: "Administración",
  rrhh: "RRHH",
  vacaciones: "Vacaciones",
  mis: "Mis Solicitudes",
  permisos: "Permisos",
  roles: "Roles y Permisos",
};

function useBreadcrumb(): string[] {
  const { pathname } = useLocation();
  const segments = pathname.replace(/^\/dashboard\/?/, "").split("/").filter(Boolean);
  return segments.map(s => ROUTE_LABELS[s] ?? s);
}

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const breadcrumb = useBreadcrumb();

  const hasPerm = (p: string) =>
    (user?.permisos || []).includes(p) || user?.rol === "admin";

  const items = useMemo(() => {
    return NAV_ITEMS.filter(({ permission }) => {
      if (!permission) return true;
      const list = Array.isArray(permission) ? permission : [permission];
      return list.some(hasPerm);
    });
  }, [user]);

  const showRRHH =
    hasPerm("rrhh:ver") ||
    user?.rol === "admin_rrhh" ||
    user?.rol === "rrhh";

  const initials = user?.nombre?.charAt(0).toUpperCase() ?? "U";

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* ─── Sidebar ─────────────────────────────────────────────── */}
      <aside
        className={`flex flex-col bg-slate-900 text-slate-100 flex-shrink-0 transition-all duration-300 ease-in-out ${
          isCollapsed ? "w-16" : "w-64"
        }`}
      >
        {/* Logo */}
        <div
          className={`h-14 flex items-center border-b border-slate-700/50 flex-shrink-0 ${
            isCollapsed ? "justify-center px-2" : "px-5"
          }`}
        >
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
            <span className="text-white font-bold text-xs">IC</span>
          </div>
          {!isCollapsed && (
            <div className="ml-3 min-w-0">
              <p className="text-white font-semibold text-sm leading-tight truncate">
                Infraestructura
              </p>
              <p className="text-slate-400 text-xs truncate">Caja de Abogados</p>
            </div>
          )}
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto overflow-x-hidden">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              title={isCollapsed ? label : undefined}
              className={({ isActive }) =>
                `flex items-center py-2.5 rounded-lg transition-colors duration-150 ${
                  isCollapsed ? "justify-center px-2" : "px-3 gap-3"
                } ${
                  isActive
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && (
                <span className="text-sm font-medium">{label}</span>
              )}
            </NavLink>
          ))}

          {showRRHH && (
            <NavLink
              to="/dashboard/rrhh"
              title={isCollapsed ? "RRHH" : undefined}
              className={({ isActive }) =>
                `flex items-center py-2.5 rounded-lg transition-colors duration-150 ${
                  isCollapsed ? "justify-center px-2" : "px-3 gap-3"
                } ${
                  isActive
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`
              }
            >
              <UserGroupIcon className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && (
                <span className="text-sm font-medium">RRHH</span>
              )}
            </NavLink>
          )}

          {user?.rol === "admin" && (
            <NavLink
              to="/dashboard/empresas"
              title={isCollapsed ? "Clientes" : undefined}
              className={({ isActive }) =>
                `flex items-center py-2.5 rounded-lg transition-colors duration-150 ${
                  isCollapsed ? "justify-center px-2" : "px-3 gap-3"
                } ${
                  isActive
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`
              }
            >
              <BuildingOfficeIcon className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && (
                <span className="text-sm font-medium">Clientes</span>
              )}
            </NavLink>
          )}
        </nav>

        {/* User / Logout */}
        <div className="flex-shrink-0 p-2 border-t border-slate-700/50 space-y-0.5">
          {!isCollapsed && (
            <div className="px-3 py-2">
              <p className="text-slate-200 text-sm font-medium truncate">
                {user?.nombre}
              </p>
              <p className="text-slate-500 text-xs capitalize">{user?.rol}</p>
            </div>
          )}
          <button
            onClick={logout}
            title={isCollapsed ? "Cerrar sesión" : undefined}
            className={`w-full flex items-center py-2.5 rounded-lg text-slate-300 hover:bg-red-500/10 hover:text-red-400 transition-colors duration-150 ${
              isCollapsed ? "justify-center px-2" : "px-3 gap-3"
            }`}
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && (
              <span className="text-sm font-medium">Cerrar sesión</span>
            )}
          </button>
        </div>
      </aside>

      {/* ─── Main area ───────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center px-4 flex-shrink-0 gap-3">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            title={isCollapsed ? "Expandir menú" : "Colapsar menú"}
          >
            <Bars3Icon className="w-5 h-5" />
          </button>

          {/* Breadcrumb */}
          <nav className="flex items-center gap-1 text-sm min-w-0">
            <span className="text-slate-400 flex-shrink-0">Infra</span>
            {breadcrumb.map((crumb, i) => (
              <React.Fragment key={i}>
                <ChevronRightIcon className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                <span
                  className={`truncate ${
                    i === breadcrumb.length - 1
                      ? "text-slate-700 font-medium"
                      : "text-slate-400"
                  }`}
                >
                  {crumb}
                </span>
              </React.Fragment>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3 flex-shrink-0">
            <EmpresaSwitcher />

            {/* User chip */}
            <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shadow-sm">
              <span className="text-white text-xs font-semibold">{initials}</span>
            </div>
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-slate-700 leading-tight">
                {user?.nombre}
              </p>
              <p className="text-xs text-slate-400 capitalize">{user?.rol}</p>
            </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
