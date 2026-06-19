import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Home: React.FC = () => {
  const { user } = useAuth();

  const quickActions = [
    {
      title: "Relevamientos",
      description: "Monitoreo Zabbix y estado de infraestructura",
      icon: "📊",
      link: "/dashboard/relevamientos",
      color: "from-blue-500 to-blue-600"
    },
    {
      title: "Base de Conocimientos",
      description: "Documentación y procedimientos técnicos",
      icon: "📚",
      link: "/dashboard/procedimientos",
      color: "from-emerald-500 to-emerald-600"
    },
    {
      title: "Enlaces Útiles",
      description: "Accesos rápidos a herramientas y servicios",
      icon: "🔗",
      link: "/dashboard/links",
      color: "from-purple-500 to-purple-600"
    },
    {
      title: "Gestión de Tareas",
      description: "Seguimiento de actividades y proyectos",
      icon: "✅",
      link: "/dashboard/tareas",
      color: "from-amber-500 to-amber-600"
    }
  ];

  const stats = [
    { label: "Sistemas Activos", value: "24", icon: "🖥️", color: "text-green-600" },
    { label: "Alertas Activas", value: "3", icon: "⚠️", color: "text-orange-600" },
    { label: "Procedimientos", value: "156", icon: "📋", color: "text-blue-600" },
    { label: "Enlaces", value: "42", icon: "🔗", color: "text-purple-600" }
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="text-center py-12 bg-gradient-to-r from-blue-50 to-purple-50 rounded-3xl border border-blue-100">
        <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-xl">
          <span className="text-white font-bold text-2xl">👋</span>
        </div>
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          ¡Bienvenido, {user?.nombre}!
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Panel de control de Infinity Cloud
        </p>
        <p className="text-gray-500 mt-2">
          Accede a todas las herramientas y recursos del departamento de sistemas
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="card hover:shadow-xl transition-all duration-300">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className={`text-3xl font-bold ${stat.color} mt-1`}>{stat.value}</p>
                </div>
                <div className="text-3xl">{stat.icon}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Accesos Rápidos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {quickActions.map((action, index) => (
            <Link
              key={index}
              to={action.link}
              className="group card hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
            >
              <div className="card-body">
                <div className="flex items-start space-x-4">
                  <div className={`w-12 h-12 bg-gradient-to-r ${action.color} rounded-xl flex items-center justify-center text-white text-xl shadow-lg group-hover:shadow-xl transition-shadow duration-300`}>
                    {action.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                      {action.title}
                    </h3>
                    <p className="text-gray-600 mt-1 text-sm">
                      {action.description}
                    </p>
                  </div>
                  <div className="text-gray-400 group-hover:text-blue-500 transition-colors duration-200">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-900">Actividad Reciente</h3>
        </div>
        <div className="card-body">
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-4 bg-blue-50 rounded-xl">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">📊</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Sistema de monitoreo actualizado</p>
                <p className="text-xs text-gray-500">Hace 2 horas</p>
              </div>
            </div>
            <div className="flex items-center space-x-4 p-4 bg-green-50 rounded-xl">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">✅</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Backup completado exitosamente</p>
                <p className="text-xs text-gray-500">Hace 4 horas</p>
              </div>
            </div>
            <div className="flex items-center space-x-4 p-4 bg-purple-50 rounded-xl">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">📚</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Nuevo procedimiento añadido</p>
                <p className="text-xs text-gray-500">Hace 1 día</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home; 