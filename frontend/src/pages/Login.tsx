import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  ServerIcon,
  CheckCircleIcon,
  CalendarDaysIcon,
  CubeIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
import logoBlanco from "../assets/logo-alt1.png";
import logoColor from "../assets/logo.png";

const API_URL = `${import.meta.env.VITE_API_URL || "http://localhost:4002/api"}/auth/login`;

const FEATURES = [
  { icon: ServerIcon,        text: "Gestión CMDB y servidores" },
  { icon: CheckCircleIcon,   text: "Control de tareas y proyectos" },
  { icon: CalendarDaysIcon,  text: "RRHH: licencias y vacaciones" },
  { icon: CubeIcon,          text: "Inventario y stock de equipos" },
];

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMensaje("");
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok && data.token && data.usuario) {
        login(data.usuario, data.token);
        setTimeout(() => navigate("/dashboard"), 400);
      } else {
        setMensaje(data.message || "Usuario o contraseña incorrectos");
      }
    } catch {
      setMensaje(
        import.meta.env.DEV
          ? "No se pudo conectar con el backend. ¿Está en ejecución?"
          : "Error de conexión. Contactá al administrador."
      );
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* ─── Panel izquierdo (branding) ──────────────────────────── */}
      <div className="hidden lg:flex lg:w-5/12 xl:w-2/5 bg-slate-900 flex-col items-center justify-center p-12 relative overflow-hidden">
        {/* Dot grid decorativo */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle, #ffffff 1.5px, transparent 1.5px)",
            backgroundSize: "28px 28px",
          }}
        />
        {/* Glow azul de fondo */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl" />

        <div className="relative z-10 w-full max-w-xs">
          {/* Logo */}
          <div className="mb-10">
            <img src={logoBlanco} alt="Infinity Cloud" className="h-20 w-auto mb-6" />
            <p className="text-slate-400 mt-1">Intranet de Soporte</p>
          </div>

          {/* Feature list */}
          <div className="space-y-3">
            {FEATURES.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-500/15 border border-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-blue-400" />
                </div>
                <span className="text-slate-300 text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Panel derecho (formulario) ──────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-sm">
          {/* Logo mobile */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <img src={logoColor} alt="Infinity Cloud" className="h-14 w-auto" />
            <p className="text-slate-400 text-xs">Intranet de Soporte</p>
          </div>

          <h2 className="text-2xl font-bold text-slate-800 mb-1">
            Iniciar sesión
          </h2>
          <p className="text-slate-500 text-sm mb-8">
            Ingresá tus credenciales para acceder al sistema
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="form-label">Usuario</label>
              <input
                type="text"
                className="form-input"
                placeholder="Nombre de usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
            </div>

            <div>
              <label className="form-label">Contraseña</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            <button
              type="submit"
              className="btn-primary w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin w-4 h-4 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Ingresando...
                </>
              ) : (
                <>
                  Ingresar
                  <ArrowRightIcon className="w-4 h-4 ml-2" />
                </>
              )}
            </button>

            {mensaje && (
              <div
                className={`p-3.5 rounded-xl text-sm font-medium flex items-start gap-2.5 ${
                  mensaje.toLowerCase().includes("exitoso")
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {mensaje}
              </div>
            )}
          </form>

          <p className="mt-10 text-center text-xs text-slate-400">
            © {new Date().getFullYear()} Infinity Cloud &mdash; Intranet de Soporte
          </p>
        </div>
      </div>
    </div>
  );
}
