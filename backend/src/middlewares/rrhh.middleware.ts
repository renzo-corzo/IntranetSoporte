import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';


// Middleware para verificar permisos de RRHH
export const verificarPermisosRRHH = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    // Obtener usuario con su rol
    const usuario = await prisma.usuario.findUnique({
      where: { id: userId },
      include: { rol: true }
    });

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Verificar permisos según el rol
    const rol = usuario.rol.nombre.toLowerCase();
    
    // admin_rrhh: acceso completo al módulo RRHH
    if (rol === 'admin_rrhh') {
      (req as any).rrhhPermissions = {
        canView: true,
        canCreate: true,
        canEdit: true,
        canDelete: true,
        canApprove: true,
        canReject: true
      };
      return next();
    }

    // admin: acceso completo (incluyendo RRHH)
    if (rol === 'admin') {
      (req as any).rrhhPermissions = {
        canView: true,
        canCreate: true,
        canEdit: true,
        canDelete: true,
        canApprove: true,
        canReject: true
      };
      return next();
    }

    // usuario: solo puede ver su propia información
    if (rol === 'usuario') {
      (req as any).rrhhPermissions = {
        canView: true,
        canCreate: false,
        canEdit: false,
        canDelete: false,
        canApprove: false,
        canReject: false,
        ownDataOnly: true
      };
      return next();
    }

    // admin_sistemas: no tiene acceso al módulo RRHH
    if (rol === 'admin_sistemas') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para acceder al módulo RRHH'
      });
    }

    // Por defecto, denegar acceso
    return res.status(403).json({
      success: false,
      message: 'No tienes permisos para acceder a esta funcionalidad'
    });

  } catch (error) {
    console.error('Error al verificar permisos RRHH:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Middleware para verificar permisos de solo lectura
export const verificarPermisosLecturaRRHH = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id: userId },
      include: { rol: true }
    });

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    const rol = usuario.rol.nombre.toLowerCase();
    
    // Solo admin_rrhh y admin pueden ver datos de RRHH
    if (rol === 'admin_rrhh' || rol === 'admin') {
      (req as any).rrhhPermissions = {
        canView: true,
        canCreate: false,
        canEdit: false,
        canDelete: false,
        canApprove: false,
        canReject: false
      };
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'No tienes permisos para ver datos de RRHH'
    });

  } catch (error) {
    console.error('Error al verificar permisos de lectura RRHH:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Middleware para verificar permisos de aprobación
export const verificarPermisosAprobacion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id: userId },
      include: { rol: true }
    });

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    const rol = usuario.rol.nombre.toLowerCase();
    
    // Solo admin_rrhh y admin pueden aprobar/rechazar
    if (rol === 'admin_rrhh' || rol === 'admin') {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'No tienes permisos para aprobar o rechazar solicitudes'
    });

  } catch (error) {
    console.error('Error al verificar permisos de aprobación:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};



