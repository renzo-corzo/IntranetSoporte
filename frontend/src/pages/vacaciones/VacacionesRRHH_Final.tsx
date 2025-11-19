import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import { useAuth } from "@/context/AuthContext";
import ModalNuevaSolicitud from "@/components/ModalNuevaSolicitud";

type Vacacion = {
  id: number;
  fechaInicio: string;
  fechaFin: string;
  estado: "APROBADA" | "PENDIENTE" | "RECHAZADA" | "CANCELADA";
  solicitante: {
    id: number;
    nombre: string;
    username: string;
    departamento: string;
  };
  empleado?: {
    id: number;
    nombre: string;
    departamento: string;
  };
};

const VacacionesRRHH: React.FC = () => {
  const [vacaciones, setVacaciones] = useState<Vacacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const { token } = useAuth();

  const fetchVacaciones = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000/api'}/vacaciones?limit=1000`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        setVacaciones(data.data || []);
      } else {
        console.error('Error al cargar vacaciones:', res.status);
      }
    } catch (error) {
      console.error("Error al cargar vacaciones:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchVacaciones();
    }
  }, [token]);

  const eventos = vacaciones.map((vac) => {
    // Usar datos de empleado si están disponibles, sino usar solicitante
    const persona = vac.empleado || vac.solicitante;
    const departamento = vac.empleado?.departamento || vac.solicitante.departamento;
    
    return {
      id: String(vac.id),
      title: `${persona.nombre} (${departamento})`,
      start: vac.fechaInicio,
      end: vac.fechaFin,
      backgroundColor: getColor(vac.estado),
      borderColor: getColor(vac.estado),
      extendedProps: {
        estado: vac.estado,
        empleado: persona.nombre,
        departamento: departamento,
        esEmpleado: !!vac.empleado
      }
    };
  });

  function getColor(estado: Vacacion["estado"]) {
    switch (estado) {
      case "APROBADA":
        return "#4ade80"; // verde
      case "PENDIENTE":
        return "#facc15"; // amarillo
      case "RECHAZADA":
        return "#ef4444"; // rojo
      case "CANCELADA":
        return "#94a3b8"; // gris
      default:
        return "#e2e8f0"; // neutro
    }
  }

  const estadisticas = {
    pendientes: vacaciones.filter(v => v.estado === 'PENDIENTE').length,
    aprobadas: vacaciones.filter(v => v.estado === 'APROBADA').length,
    rechazadas: vacaciones.filter(v => v.estado === 'RECHAZADA').length,
    total: vacaciones.length
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Vacaciones - RRHH</h1>
          <p className="text-gray-600">Administra las vacaciones de todos los empleados</p>
        </div>
        <Button 
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Nueva Solicitud
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Vacaciones</p>
                <p className="text-2xl font-bold text-gray-900">{estadisticas.total}</p>
              </div>
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pendientes</p>
                <p className="text-2xl font-bold text-yellow-600">{estadisticas.pendientes}</p>
              </div>
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Aprobadas</p>
                <p className="text-2xl font-bold text-green-600">{estadisticas.aprobadas}</p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Rechazadas</p>
                <p className="text-2xl font-bold text-red-600">{estadisticas.rechazadas}</p>
              </div>
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calendario */}
      <Card>
        <CardHeader>
          <CardTitle>Calendario de Vacaciones</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Cargando calendario...</span>
            </div>
          ) : (
            <div className="mt-4">
              <FullCalendar
                plugins={[dayGridPlugin]}
                initialView="dayGridMonth"
                locale="es"
                events={eventos}
                height="auto"
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: 'dayGridMonth,dayGridWeek'
                }}
                eventDisplay="block"
                dayMaxEvents={3}
                moreLinkClick="popover"
                eventClick={(info) => {
                  const event = info.event;
                  const props = event.extendedProps;
                  alert(`${props.empleado} (${props.departamento})\nEstado: ${props.estado}\nPeríodo: ${event.start?.toLocaleDateString()} - ${event.end?.toLocaleDateString()}`);
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Leyenda */}
      <Card>
        <CardHeader>
          <CardTitle>Leyenda de Estados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-sm">Aprobada</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500 rounded"></div>
              <span className="text-sm">Pendiente</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span className="text-sm">Rechazada</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-500 rounded"></div>
              <span className="text-sm">Cancelada</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal Nueva Solicitud */}
      <ModalNuevaSolicitud
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={() => {
          fetchVacaciones();
          setShowModal(false);
        }}
      />
    </div>
  );
};

export default VacacionesRRHH;