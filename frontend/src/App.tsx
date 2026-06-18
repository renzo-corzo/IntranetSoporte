import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import PrivateRoute from "./components/PrivateRoute";
import Home from "./pages/Home";
import Relevamientos from "./pages/Relevamientos";
import Links from "./pages/Links";
import Tareas from "./pages/Tareas";
import Admin from "./pages/Admin";
import Procedimientos from "./pages/Procedimientos";
import Stock from "./pages/Stock";
import MisVacaciones from "./pages/vacaciones/MisVacaciones";
import VacacionesAdmin from "./pages/vacaciones/VacacionesAdmin";
import VacacionesRRHH from "./pages/vacaciones/VacacionesRRHH_Final";
import DashboardRRHH from "./pages/rrhh/DashboardRRHH";
import RolesPermisosPage from "./pages/RolesPermisos";
import CMDB from "./pages/CMDB";
import Empresas from "./pages/Empresas";

const App: React.FC = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<PrivateRoute />}>
        <Route element={<Dashboard />}>
          <Route index element={<Navigate to="home" replace />} />
          <Route path="home" element={<Home />} />
          <Route path="relevamientos" element={<Relevamientos />} />
          <Route path="links" element={<Links />} />
          <Route path="tareas" element={<Tareas />} />
          <Route path="procedimientos" element={<Procedimientos />} />
          <Route path="stock" element={<Stock />} />
          <Route path="vacaciones/mis" element={<MisVacaciones />} />
          <Route path="vacaciones/admin" element={<VacacionesAdmin />} />
          <Route path="vacaciones/rrhh" element={<VacacionesRRHH />} />
          <Route path="rrhh" element={<DashboardRRHH />} />
          <Route path="admin" element={<Admin />} />
          <Route path="roles/permisos" element={<RolesPermisosPage />} />
          <Route path="cmdb" element={<CMDB />} />
          <Route path="empresas" element={<Empresas />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  </BrowserRouter>
);

export default App;
