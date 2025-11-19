import { Request, Response, NextFunction } from 'express';

// Middleware de debug para verificar permisos de RRHH
export const verificarPermisosRRHH = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('🔍 Middleware RRHH ejecutándose...');
    console.log('User:', (req as any).user);
    
    const user = (req as any).user;
    
    if (!user) {
      console.log('❌ Usuario no autenticado');
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    console.log('✅ Usuario autenticado:', user.username, user.rol);
    
    // Permitir acceso a todos los usuarios autenticados por ahora
    (req as any).rrhhPermissions = {
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canApprove: true,
      canReject: true
    };
    
    console.log('✅ Permisos RRHH otorgados');
    return next();

  } catch (error) {
    console.error('❌ Error en middleware RRHH:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Middleware para verificar permisos de solo lectura
export const verificarPermisosLecturaRRHH = async (req: Request, res: Response, next: NextFunction) => {
  console.log('🔍 Middleware lectura RRHH ejecutándose...');
  return next();
};

// Middleware para verificar permisos de aprobación
export const verificarPermisosAprobacion = async (req: Request, res: Response, next: NextFunction) => {
  console.log('🔍 Middleware aprobación RRHH ejecutándose...');
  return next();
};





