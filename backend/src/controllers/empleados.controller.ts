import { Request, Response } from 'express';
import prisma from '../lib/prisma';


// Función helper para convertir fecha YYYY-MM-DD a Date sin problemas de zona horaria
const parseDateString = (dateString: string): Date => {
  // Si la fecha viene como YYYY-MM-DD, la parseamos manualmente
  // para evitar problemas de zona horaria
  const [yearRaw, monthRaw, dayRaw] = dateString.split('-').map(Number);
  const year = Number.isFinite(yearRaw) ? (yearRaw as number) : 1970;
  const month = Number.isFinite(monthRaw) ? (monthRaw as number) : 1;
  const day = Number.isFinite(dayRaw) ? (dayRaw as number) : 1;
  return new Date(year, month - 1, day); // month es 0-indexed en JavaScript
};

// Función para calcular años de antigüedad desde la fecha de ingreso
const calcularAniosAntiguedad = (fechaIngreso: Date): number => {
  const hoy = new Date();
  const anios = hoy.getFullYear() - fechaIngreso.getFullYear();
  const meses = hoy.getMonth() - fechaIngreso.getMonth();
  // Si aún no cumplió años este año, restar 1
  if (meses < 0 || (meses === 0 && hoy.getDate() < fechaIngreso.getDate())) {
    return anios - 1;
  }
  return anios;
};

// Función para calcular días de vacaciones según el convenio
// < 5 años: 15 días hábiles
// >= 5 años y < 10 años: 21 días hábiles
// >= 10 años: 27 días hábiles
const calcularDiasSegunConvenio = (fechaIngreso: Date): number => {
  const anios = calcularAniosAntiguedad(fechaIngreso);
  if (anios < 5) {
    return 15;
  } else if (anios < 10) {
    return 21;
  } else {
    return 27;
  }
};

// Función para calcular días acumulados desde 2023
// diasBase2023: días que el empleado tenía disponibles al inicio de 2023
// A partir de ahí, se suman los días por cada año según el convenio
const calcularDiasAcumuladosDesde2023 = (fechaIngreso: Date, diasBase2023: number): number => {
  const anioInicio = 2023;
  const anioActual = new Date().getFullYear();
  let diasAcumulados = diasBase2023; // Días base al inicio de 2023
  
  // Calcular días por cada año desde 2023 hasta el año actual
  for (let anio = anioInicio; anio <= anioActual; anio++) {
    // Calcular años de antigüedad al 1 de enero de ese año
    const fechaReferencia = new Date(anio, 0, 1); // 1 de enero del año
    
    // Solo sumar si el empleado ya había ingresado para esa fecha
    if (fechaIngreso <= fechaReferencia) {
      // Calcular años de antigüedad al 1 de enero de ese año
      const aniosAntiguedad = anio - fechaIngreso.getFullYear();
      
      // Si el empleado ingresó después del 1 de enero, los años de antigüedad son menores
      // Por ejemplo, si ingresó el 15/06/2020, al 1/01/2023 tiene 2 años (no 3)
      const fechaIngresoAnio = fechaIngreso.getFullYear();
      const fechaIngresoMes = fechaIngreso.getMonth();
      const fechaIngresoDia = fechaIngreso.getDate();
      
      let aniosReales = aniosAntiguedad;
      // Si ingresó después del 1 de enero, restar 1 año
      if (anio > fechaIngresoAnio && (fechaIngresoMes > 0 || fechaIngresoDia > 1)) {
        aniosReales = aniosAntiguedad - 1;
      }
      
      // Calcular días según convenio: < 5 años = 15 días, >= 5 y < 10 años = 21 días, >= 10 años = 27 días
      let diasAnuales: number;
      if (aniosReales < 5) {
        diasAnuales = 15;
      } else if (aniosReales < 10) {
        diasAnuales = 21;
      } else {
        diasAnuales = 27;
      }
      diasAcumulados += diasAnuales;
    }
  }
  
  return diasAcumulados;
};

// Función helper para recalcular días disponibles de un empleado
// Basándose en diasBase2023 + días acumulados - días usados
export const recalcularDiasDisponibles = async (empleadoId: string): Promise<number> => {
  const empleado = await prisma.empleado.findUnique({
    where: { id: empleadoId },
    select: {
      fechaIngreso: true,
      diasBase2023: true
    }
  });

  if (!empleado) {
    throw new Error('Empleado no encontrado');
  }

  // Si no tiene diasBase2023, no recalcular (mantener valor actual)
  if (empleado.diasBase2023 === null || empleado.diasBase2023 === undefined) {
    const empleadoCompleto = await prisma.empleado.findUnique({
      where: { id: empleadoId },
      select: { diasDisponibles: true }
    });
    return empleadoCompleto?.diasDisponibles || 0;
  }

  // Calcular días acumulados desde 2023
  const diasAcumulados = calcularDiasAcumuladosDesde2023(empleado.fechaIngreso, empleado.diasBase2023);

  // Obtener días usados (vacaciones aprobadas)
  const vacacionesAprobadas = await prisma.vacacion.findMany({
    where: {
      empleadoId,
      estado: 'APROBADA'
    },
    select: {
      diasSolicitados: true
    }
  });

  const diasUsados = vacacionesAprobadas.reduce((sum, v) => sum + v.diasSolicitados, 0);

  // Días disponibles = días acumulados - días usados
  return diasAcumulados - diasUsados;
};

export const getEmpleados = async (req: Request, res: Response) => {
  try {
    const { departamento, estado, search } = req.query;

    // Construir filtros
    const where: any = {};
    
    // Solo aplicar filtro de departamento si no es "todos" o vacío
    if (departamento && departamento !== '' && departamento !== 'todos') {
      where.departamento = departamento;
    }
    
    // Solo aplicar filtro de estado si no es "todos" o vacío
    if (estado && estado !== '' && estado !== 'todos') {
      where.estado = estado;
    }
    
    if (search && search !== '') {
      where.OR = [
        { nombre: { contains: search as string, mode: 'insensitive' } },
        { apellido: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { dni: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    // Obtener empleados de la base de datos real
    const empleados = await prisma.empleado.findMany({
      where,
      orderBy: [
        { departamento: 'asc' },
        { apellido: 'asc' },
        { nombre: 'asc' }
      ]
    });

    // Obtener vacaciones, licencias y documentos para cada empleado
    const empleadosConRelaciones = await Promise.all(
      empleados.map(async (empleado) => {
        const [vacaciones, licencias, documentos] = await Promise.all([
          prisma.vacacion.findMany({
            where: { empleadoId: empleado.id },
            select: {
              id: true,
              estado: true,
              fechaInicio: true,
              fechaFin: true
            }
          }),
          prisma.licencia.findMany({
            where: { empleadoId: empleado.id },
            select: {
              id: true,
              tipo: true,
              fechaInicio: true,
              fechaFin: true
            }
          }),
          prisma.documentoEmpleado.findMany({
            where: { empleadoId: empleado.id },
            select: {
              id: true,
              nombreArchivo: true,
              tipoArchivo: true
            }
          })
        ]);

        return {
          empleado,
          vacaciones,
          licencias,
          documentos
        };
      })
    );

    // Formatear datos para el frontend
    const empleadosFormateados = empleadosConRelaciones.map(({ empleado, vacaciones, licencias, documentos }) => ({
      id: empleado.id,
      nombre: empleado.nombre,
      apellido: empleado.apellido,
      dni: empleado.dni,
      email: empleado.email,
      estado: empleado.estado,
      departamento: empleado.departamento,
      fechaIngreso: empleado.fechaIngreso.toISOString(),
      diasDisponibles: empleado.diasDisponibles,
      diasBase2023: empleado.diasBase2023,
      vacaciones: vacaciones.map(v => ({
        id: v.id,
        estado: v.estado,
        fechaInicio: v.fechaInicio.toISOString(),
        fechaFin: v.fechaFin.toISOString()
      })),
      licencias: licencias.map(l => ({
        id: l.id,
        tipo: l.tipo,
        fechaInicio: l.fechaInicio.toISOString(),
        fechaFin: l.fechaFin.toISOString()
      })),
      documentos: documentos.map(d => ({
        id: d.id,
        nombreArchivo: d.nombreArchivo,
        tipoArchivo: d.tipoArchivo
      }))
    }));

    res.json(empleadosFormateados);
  } catch (error) {
    console.error('Error al obtener empleados:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const createEmpleado = async (req: Request, res: Response) => {
  try {
    const { nombre, apellido, dni, email, departamento, fechaIngreso, diasDisponibles, diasBase2023 } = req.body;

    // Validar datos requeridos
    if (!nombre || !apellido || !dni || !email || !departamento || !fechaIngreso) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    // Verificar si ya existe un empleado con el mismo DNI o email
    const empleadoExistente = await prisma.empleado.findFirst({
      where: {
        OR: [
          { dni: dni },
          { email: email }
        ]
      }
    });

    if (empleadoExistente) {
      return res.status(409).json({ 
        error: 'Ya existe un empleado con este DNI o email',
        conflicto: empleadoExistente.dni === dni ? 'DNI' : 'Email'
      });
    }

    // Si se proporciona diasBase2023, calcular días disponibles automáticamente
    let diasDisponiblesCalculados = diasDisponibles;
    if (diasBase2023 !== undefined && diasBase2023 !== null) {
      const fechaIngresoDate = parseDateString(fechaIngreso);
      const diasAcumulados = calcularDiasAcumuladosDesde2023(fechaIngresoDate, diasBase2023);
      
      // Obtener días usados (vacaciones aprobadas) - en este caso será 0 porque es un empleado nuevo
      diasDisponiblesCalculados = diasAcumulados;
    }

    // Crear el empleado en la base de datos
    const nuevoEmpleado = await prisma.empleado.create({
      data: {
        nombre,
        apellido,
        dni,
        email,
        departamento,
        estado: 'ACTIVO',
        fechaIngreso: parseDateString(fechaIngreso),
        diasDisponibles: diasDisponiblesCalculados || 20,
        diasBase2023: diasBase2023 !== undefined ? diasBase2023 : null
      }
    });

    console.log(`✅ Empleado creado: ${nuevoEmpleado.nombre} ${nuevoEmpleado.apellido}`);

    res.status(201).json({ 
      message: 'Empleado creado exitosamente', 
      data: {
        id: nuevoEmpleado.id,
        nombre: nuevoEmpleado.nombre,
        apellido: nuevoEmpleado.apellido,
        dni: nuevoEmpleado.dni,
        email: nuevoEmpleado.email,
        departamento: nuevoEmpleado.departamento,
        estado: nuevoEmpleado.estado,
        fechaIngreso: nuevoEmpleado.fechaIngreso.toISOString(),
        diasDisponibles: nuevoEmpleado.diasDisponibles,
        diasBase2023: nuevoEmpleado.diasBase2023
      }
    });
  } catch (error) {
    console.error('Error al crear empleado:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const updateEmpleado = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nombre, apellido, dni, email, departamento, estado, fechaIngreso, diasDisponibles, diasBase2023 } = req.body;

    // Verificar si el empleado existe
    const empleadoExistente = await prisma.empleado.findUnique({
      where: { id }
    });

    if (!empleadoExistente) {
      return res.status(404).json({ error: 'Empleado no encontrado' });
    }

    // Verificar si hay conflictos con DNI o email de otros empleados
    if (dni || email) {
      const conflicto = await prisma.empleado.findFirst({
        where: {
          id: { not: id },
          OR: [
            ...(dni ? [{ dni }] : []),
            ...(email ? [{ email }] : [])
          ]
        }
      });

      if (conflicto) {
        return res.status(409).json({ 
          error: 'Ya existe otro empleado con este DNI o email',
          conflicto: conflicto.dni === dni ? 'DNI' : 'Email'
        });
      }
    }

    // Si se actualiza diasBase2023 o fechaIngreso, recalcular días disponibles
    const fechaIngresoFinal = fechaIngreso ? parseDateString(fechaIngreso) : empleadoExistente.fechaIngreso;
    const diasBase2023Final = diasBase2023 !== undefined ? diasBase2023 : empleadoExistente.diasBase2023;
    
    let diasDisponiblesCalculados = diasDisponibles;
    if (diasBase2023Final !== null && diasBase2023Final !== undefined) {
      const diasAcumulados = calcularDiasAcumuladosDesde2023(fechaIngresoFinal, diasBase2023Final);
      
      // Obtener días usados (vacaciones aprobadas)
      const vacacionesAprobadas = await prisma.vacacion.findMany({
        where: {
          empleadoId: id,
          estado: 'APROBADA'
        },
        select: {
          diasSolicitados: true
        }
      });
      
      const diasUsados = vacacionesAprobadas.reduce((sum, v) => sum + v.diasSolicitados, 0);
      diasDisponiblesCalculados = diasAcumulados - diasUsados;
    }

    // Actualizar el empleado
    const empleadoActualizado = await prisma.empleado.update({
      where: { id },
      data: {
        ...(nombre && { nombre }),
        ...(apellido && { apellido }),
        ...(dni && { dni }),
        ...(email && { email }),
        ...(departamento && { departamento }),
        ...(estado && { estado }),
        ...(fechaIngreso && { fechaIngreso: parseDateString(fechaIngreso) }),
        ...(diasBase2023 !== undefined && { diasBase2023 }),
        ...(diasDisponiblesCalculados !== undefined && { diasDisponibles: diasDisponiblesCalculados })
      }
    });

    console.log(`✅ Empleado actualizado: ${empleadoActualizado.nombre} ${empleadoActualizado.apellido}`);

    res.json({ 
      message: 'Empleado actualizado exitosamente', 
      data: {
        id: empleadoActualizado.id,
        nombre: empleadoActualizado.nombre,
        apellido: empleadoActualizado.apellido,
        dni: empleadoActualizado.dni,
        email: empleadoActualizado.email,
        departamento: empleadoActualizado.departamento,
        estado: empleadoActualizado.estado,
        fechaIngreso: empleadoActualizado.fechaIngreso.toISOString(),
        diasDisponibles: empleadoActualizado.diasDisponibles,
        diasBase2023: empleadoActualizado.diasBase2023
      }
    });
  } catch (error) {
    console.error('Error al actualizar empleado:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const deleteEmpleado = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Verificar si el empleado existe
    const empleadoExistente = await prisma.empleado.findUnique({
      where: { id }
    });

    if (!empleadoExistente) {
      return res.status(404).json({ error: 'Empleado no encontrado' });
    }

    // Eliminar el empleado
    await prisma.empleado.delete({
      where: { id }
    });

    console.log(`✅ Empleado eliminado: ${empleadoExistente.nombre} ${empleadoExistente.apellido}`);

    res.json({ message: 'Empleado eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar empleado:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getDepartamentos = async (_req: Request, res: Response) => {
  try {
    // Obtener departamentos únicos de la base de datos real
    const departamentos = await prisma.empleado.findMany({
      select: {
        departamento: true
      },
      distinct: ['departamento'],
      orderBy: {
        departamento: 'asc'
      }
    });

    // Formatear para el frontend
    const departamentosFormateados = departamentos.map((dept, index) => ({
      id: index + 1,
      nombre: dept.departamento
    }));

    res.json(departamentosFormateados);
  } catch (error) {
    console.error('Error al obtener departamentos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getEstadisticas = async (_req: Request, res: Response) => {
  try {
    // Obtener estadísticas reales de la base de datos
    const totalEmpleados = await prisma.empleado.count();
    const empleadosActivos = await prisma.empleado.count({
      where: { estado: 'ACTIVO' }
    });
    const empleadosInactivos = await prisma.empleado.count({
      where: { estado: 'INACTIVO' }
    });

    // Estadísticas por departamento
    const estadisticasPorDepartamento = await prisma.empleado.groupBy({
      by: ['departamento'],
      _count: {
        id: true,
      },
      orderBy: {
        departamento: 'asc'
      }
    });

    // Formatear estadísticas por departamento
    const porDepartamento = estadisticasPorDepartamento.reduce((acc, stat) => {
      acc[stat.departamento] = stat._count.id;
      return acc;
    }, {} as Record<string, number>);

    res.json({
      total: totalEmpleados,
      activos: empleadosActivos,
      inactivos: empleadosInactivos,
      porDepartamento: porDepartamento
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Calcular días sugeridos según el convenio
// Endpoint: GET /api/empleados/:id/calcular-dias
export const calcularDiasSugeridos = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { diasBase2023 } = req.query; // Días base 2023 (opcional, si no se proporciona usa el del empleado)

    // Obtener el empleado
    const empleado = await prisma.empleado.findUnique({
      where: { id }
    });

    if (!empleado) {
      return res.status(404).json({ error: 'Empleado no encontrado' });
    }

    // Usar el valor del query si se proporciona, sino usar el del empleado
    const diasBase = diasBase2023 ? parseInt(diasBase2023 as string) : (empleado.diasBase2023 || 0);
    const aniosAntiguedad = calcularAniosAntiguedad(empleado.fechaIngreso);
    const diasSegunConvenio = calcularDiasSegunConvenio(empleado.fechaIngreso);
    const diasAcumulados = calcularDiasAcumuladosDesde2023(empleado.fechaIngreso, diasBase);

    // Obtener días ya usados (vacaciones aprobadas)
    const vacacionesAprobadas = await prisma.vacacion.findMany({
      where: {
        empleadoId: id,
        estado: 'APROBADA'
      },
      select: {
        diasSolicitados: true
      }
    });

    const diasUsados = vacacionesAprobadas.reduce((sum, v) => sum + v.diasSolicitados, 0);
    const diasDisponiblesCalculados = diasAcumulados - diasUsados;

    res.json({
      aniosAntiguedad,
      diasSegunConvenio, // Días anuales según convenio (15 o 21)
      diasBase2023: diasBase,
      diasAcumuladosDesde2023: diasAcumulados,
      diasUsados,
      diasDisponiblesSugeridos: diasDisponiblesCalculados,
      diasDisponiblesActuales: empleado.diasDisponibles
    });
  } catch (error) {
    console.error('Error al calcular días sugeridos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};