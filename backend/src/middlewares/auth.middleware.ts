import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecreto';

export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    console.log('❌ verifyToken: Token no proporcionado', req.path);
    return res.status(401).json({ message: 'Token no proporcionado' });
  }
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.log('❌ verifyToken: Token inválido', req.path, err.message);
      return res.status(403).json({ message: 'Token inválido', error: err.message });
    }
    console.log('✅ verifyToken: Token válido', req.path, 'user:', (user as any)?.id);
    (req as any).user = user;
    next();
  });
};

export const requireRole = (roles: string | string[]) => (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  
  if (!user || !allowedRoles.includes(user.rol)) {
    return res.status(403).json({ 
      message: 'Acceso denegado: requiere rol ' + allowedRoles.join(' o '),
      userRole: user?.rol,
      requiredRoles: allowedRoles
    });
  }
  next();
}; 

// Middleware basado en permisos del rol guardados en BD (Rol.permisos)
export const requirePermission = (permissions: string | string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const prisma = new PrismaClient();
    try {
      const user = (req as any).user;
      if (!user) {
        await prisma.$disconnect();
        console.log('❌ requirePermission: No autenticado', req.path);
        return res.status(401).json({ message: 'No autenticado' });
      }
      const usuario = await prisma.usuario.findUnique({ where: { id: user.id }, include: { rol: true } });
      if (!usuario) {
        await prisma.$disconnect();
        console.log('❌ requirePermission: Usuario no encontrado', req.path, user.id);
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }
      const wanted = Array.isArray(permissions) ? permissions : [permissions];
      const rolPerms: string[] = (usuario.rol as any)?.permisos || [];
      const ok = wanted.every(p => rolPerms.includes(p));
      if (!ok) {
        await prisma.$disconnect();
        console.log('❌ requirePermission: Permiso denegado', req.path, 'required:', wanted, 'tiene:', rolPerms);
        return res.status(403).json({ message: 'Permiso denegado', required: wanted, rolPerms });
      }
      await prisma.$disconnect();
      console.log('✅ requirePermission: Permiso OK', req.path);
      next();
    } catch (e) {
      await prisma.$disconnect();
      console.error('❌ Error al verificar permisos:', e, req.path);
      return res.status(500).json({ message: 'Error al verificar permisos', error: (e as Error).message });
    }
  };
};