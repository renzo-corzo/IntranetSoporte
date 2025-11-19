import { Request, Response, NextFunction } from 'express';

// Middleware simple para debug - permite todas las peticiones
export const verificarPermisosRRHH = (req: Request, res: Response, next: NextFunction) => {
  console.log('🔍 Middleware RRHH ejecutado para:', req.path);
  next();
};

export const verificarPermisosLecturaRRHH = (req: Request, res: Response, next: NextFunction) => {
  console.log('🔍 Middleware RRHH Lectura ejecutado para:', req.path);
  next();
};

export const verificarPermisosAprobacion = (req: Request, res: Response, next: NextFunction) => {
  console.log('🔍 Middleware RRHH Aprobación ejecutado para:', req.path);
  next();
};