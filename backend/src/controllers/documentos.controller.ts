import { Request, Response } from 'express';
import { upload } from '../middlewares/upload.middleware';
import path from 'path';
import fs from 'fs';
import prisma from '../lib/prisma';


// Obtener documentos de un empleado
export const getDocumentosEmpleado = async (req: Request, res: Response) => {
  try {
    const { empleadoId } = req.params;

    const documentos = await prisma.documentoEmpleado.findMany({
      where: { empleadoId },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: documentos
    });
  } catch (error) {
    console.error('Error al obtener documentos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Subir documento
export const uploadDocumento = async (req: Request, res: Response) => {
  try {
    const empleadoId = req.params.empleadoId;
    const { tipoArchivo } = req.body;

    if (!empleadoId) {
      return res.status(400).json({
        success: false,
        message: 'empleadoId es requerido'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se ha seleccionado ningún archivo'
      });
    }

    // Validar que el empleado existe
    const empleado = await prisma.empleado.findUnique({
      where: { id: empleadoId }
    });

    if (!empleado) {
      return res.status(404).json({
        success: false,
        message: 'Empleado no encontrado'
      });
    }

    // Validar tipo de archivo
    const tiposPermitidos = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'];
    const extension = path.extname(req.file.originalname).toLowerCase().substring(1);
    
    if (!tiposPermitidos.includes(extension)) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de archivo no permitido'
      });
    }

    // Validar tamaño (máximo 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (req.file.size > maxSize) {
      return res.status(400).json({
        success: false,
        message: 'El archivo es demasiado grande (máximo 10MB)'
      });
    }

    const documento = await prisma.documentoEmpleado.create({
      data: {
        empleadoId,
        nombreArchivo: req.file.originalname,
        tipoArchivo: tipoArchivo || 'OTRO',
        urlArchivo: req.file.path
      }
    });

    res.status(201).json({
      success: true,
      data: documento
    });
  } catch (error) {
    console.error('Error al subir documento:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Descargar documento
export const downloadDocumento = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const documento = await prisma.documentoEmpleado.findUnique({
      where: { id }
    });

    if (!documento) {
      return res.status(404).json({
        success: false,
        message: 'Documento no encontrado'
      });
    }

    // Verificar que el archivo existe
    if (!fs.existsSync(documento.urlArchivo)) {
      return res.status(404).json({
        success: false,
        message: 'El archivo no existe en el servidor'
      });
    }

    res.download(documento.urlArchivo, documento.nombreArchivo);
  } catch (error) {
    console.error('Error al descargar documento:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Eliminar documento
export const deleteDocumento = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const documento = await prisma.documentoEmpleado.findUnique({
      where: { id }
    });

    if (!documento) {
      return res.status(404).json({
        success: false,
        message: 'Documento no encontrado'
      });
    }

    // Eliminar archivo del servidor
    if (fs.existsSync(documento.urlArchivo)) {
      fs.unlinkSync(documento.urlArchivo);
    }

    // Eliminar registro de la base de datos
    await prisma.documentoEmpleado.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Documento eliminado correctamente'
    });
  } catch (error) {
    console.error('Error al eliminar documento:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener tipos de documento disponibles
export const getTiposDocumento = async (req: Request, res: Response) => {
  try {
    const tipos = [
      { value: 'DNI', label: 'DNI' },
      { value: 'CONTRATO', label: 'Contrato' },
      { value: 'CERTIFICADO_MEDICO', label: 'Certificado Médico' },
      { value: 'CERTIFICADO_ESTUDIOS', label: 'Certificado de Estudios' },
      { value: 'OTRO', label: 'Otro' }
    ];

    res.json({
      success: true,
      data: tipos
    });
  } catch (error) {
    console.error('Error al obtener tipos de documento:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};



