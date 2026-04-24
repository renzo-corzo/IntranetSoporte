import React, { createContext, useState, useEffect, useContext } from "react";
import { buildApiUrl } from "../config/api";

interface User {
  id: number;
  email: string;
  nombre: string;
  rol: string;
  permisos?: string[];
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");
    
    if (storedUser && storedToken) {
      try {
        const parsedUser = JSON.parse(storedUser);
        // Verificar que el token no esté vacío y que el user tenga las propiedades necesarias
        if (storedToken.trim() && parsedUser && parsedUser.id && parsedUser.email) {
          setToken(storedToken);
          // Refrescar datos de usuario (incluye permisos) desde /api/auth/me
          fetch(buildApiUrl('/auth/me'), {
            headers: { Authorization: `Bearer ${storedToken}` }
          })
            .then(r => r.ok ? r.json() : null)
            .then(me => {
              if (me) {
                setUser({
                  id: me.id,
                  email: me.email,
                  nombre: me.nombre,
                  rol: me.rol,
                  permisos: me.permisos || []
                });
                localStorage.setItem('user', JSON.stringify({
                  id: me.id,
                  email: me.email,
                  nombre: me.nombre,
                  rol: me.rol,
                  permisos: me.permisos || []
                }));
              } else {
                setUser(parsedUser);
              }
            })
            .catch(() => setUser(parsedUser));
        } else {
          // Si los datos están corruptos, limpiar localStorage
          localStorage.removeItem("user");
          localStorage.removeItem("token");
        }
      } catch (error) {
        console.error("Error parsing stored user data:", error);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
    }
    setLoading(false);
  }, []);

  const login = (user: User, token: string) => {
    setToken(token);
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("token", token);
    // Recuperar permisos actualizados
    fetch(buildApiUrl('/auth/me'), {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.ok ? r.json() : null)
      .then(me => {
        if (me) {
          const enriched = { id: me.id, email: me.email, nombre: me.nombre, rol: me.rol, permisos: me.permisos || [] } as User;
          setUser(enriched);
          localStorage.setItem('user', JSON.stringify(enriched));
        } else {
          setUser(user);
        }
      })
      .catch(() => setUser(user));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return context;
}; 