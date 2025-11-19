import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Listar todos los empleados
export const listarEmpleados = async (req: Request, res: Response) => {
  try {
    const { departamento, estado } = req.query;
    
    const where: any = {};
    if (departamento) where.departamento = departamento;
    if (estado) where.estado = estado;

    const empleados = await prisma.empleado.findMany({
      where,
      orderBy: [
        { departamento: 'asc' },
        { nombre: 'asc' }
      ]
    });

    res.json({
      success: true,
      data: empleados,
      total: empleados.length
    });
  } catch (error: any) {
    console.error('Error listarEmpleados:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener empleado por ID
export const obtenerEmpleado = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const empleado = await prisma.empleado.findUnique({
      where: { id: id },
      include: {
        vacaciones: {
          orderBy: { fechaInicio: 'desc' }
        }
      }
    });

    if (!empleado) {
      return res.status(404).json({
        success: false,
        message: 'Empleado no encontrado'
      });
    }

    res.json({
      success: true,
      data: empleado
    });
  } catch (error: any) {
    console.error('Error obtenerEmpleado:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Crear nuevo empleado
export const crearEmpleado = async (req: Request, res: Response) => {
  try {
    const { nombre, departamento, estado = 'ACTIVO' } = req.body;

    if (!nombre || !departamento) {
      return res.status(400).json({
        success: false,
        message: 'Nombre y departamento son obligatorios'
      });
    }

    const empleado = await prisma.empleado.create({
      data: {
        nombre,
        departamento,
        estado
      }
    });

    res.status(201).json({
      success: true,
      data: empleado,
      message: 'Empleado creado exitosamente'
    });
  } catch (error: any) {
    console.error('Error crearEmpleado:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Actualizar empleado
export const actualizarEmpleado = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nombre, departamento, estado } = req.body;

    const empleado = await prisma.empleado.findUnique({
      where: { id: id }
    });

    if (!empleado) {
      return res.status(404).json({
        success: false,
        message: 'Empleado no encontrado'
      });
    }

    const empleadoActualizado = await prisma.empleado.update({
      where: { id: id },
      data: {
        ...(nombre && { nombre }),
        ...(departamento && { departamento }),
        ...(estado !== undefined && { estado })
      }
    });

    res.json({
      success: true,
      data: empleadoActualizado,
      message: 'Empleado actualizado exitosamente'
    });
  } catch (error: any) {
    console.error('Error actualizarEmpleado:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Eliminar empleado (soft delete)
export const eliminarEmpleado = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const empleado = await prisma.empleado.findUnique({
      where: { id: id }
    });

    if (!empleado) {
      return res.status(404).json({
        success: false,
        message: 'Empleado no encontrado'
      });
    }

    // Soft delete - marcar como inactivo
    await prisma.empleado.update({
      where: { id: id },
      data: { estado: 'INACTIVO' }
    });

    res.json({
      success: true,
      message: 'Empleado eliminado exitosamente'
    });
  } catch (error: any) {
    console.error('Error eliminarEmpleado:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener departamentos únicos
export const obtenerDepartamentos = async (req: Request, res: Response) => {
  try {
    const departamentos = await prisma.empleado.findMany({
      select: { departamento: true },
      distinct: ['departamento'],
      where: { estado: 'ACTIVO' },
      orderBy: { departamento: 'asc' }
    });

    const departamentosList = departamentos.map(d => d.departamento);

    res.json({
      success: true,
      data: departamentosList
    });
  } catch (error: any) {
    console.error('Error obtenerDepartamentos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};