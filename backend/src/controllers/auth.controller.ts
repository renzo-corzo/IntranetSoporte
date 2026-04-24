import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('JWT_SECRET no está configurado. Configure la variable de entorno antes de iniciar el backend.');
  throw new Error('JWT_SECRET no configurado');
}

// Usuario admin de desarrollo (sin depender de la base de datos)
const DEV_ADMIN_USER = {
  id: 0,
  username: 'admin',
  password: 'admin123', // SOLO para entorno de desarrollo
  email: 'admin@caja-abogados.com.ar',
  nombre: 'Administrador',
  rolId: 1,
  rolNombre: 'admin'
};

export const register = async (req: Request, res: Response) => {
  try {
    const { username, email, password, nombre, rolId } = req.body;
    if (!username || !password || !nombre || !rolId) {
      return res.status(400).json({ message: 'Faltan campos obligatorios' });
    }
    const existe = await prisma.usuario.findUnique({ where: { username } });
    if (existe) {
      return res.status(409).json({ message: 'El usuario ya existe' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const usuario = await prisma.usuario.create({
      data: { username, email, password: hashedPassword, nombre, rolId }
    });
    return res.status(201).json({ message: 'Usuario registrado', usuario: { id: usuario.id, username: usuario.username, email: usuario.email, nombre: usuario.nombre, rolId: usuario.rolId } });
  } catch (error) {
    console.error('Error en register:', error);
    return res.status(500).json({ message: 'Error en el registro' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'Faltan campos obligatorios' });
    }
    
    let usuario: any = null;
    try {
      usuario = await prisma.usuario.findUnique({ where: { username }, include: { rol: true } });
    } catch (dbError: any) {
      // Si Prisma no puede inicializar (por ejemplo, DB caída) y estamos en desarrollo,
      // continuamos al fallback del usuario DEV sin cortar el login con 500
      console.warn('Advertencia Prisma en login (se usará fallback DEV si corresponde):', dbError?.name || dbError);
      usuario = null;
    }

    if (usuario) {
      const valid = await bcrypt.compare(password, usuario.password);
      if (!valid) {
        return res.status(401).json({ message: 'Credenciales inválidas' });
      }
      const token = jwt.sign(
        { id: usuario.id, username: usuario.username, rolId: usuario.rolId, rol: usuario.rol.nombre },
        JWT_SECRET,
        { expiresIn: '8h' }
      );
      return res.json({
        token,
        usuario: {
          id: usuario.id,
          username: usuario.username,
          email: usuario.email,
          nombre: usuario.nombre,
          rolId: usuario.rolId,
          rol: usuario.rol.nombre
        }
      });
    }

    // Fallback de DESARROLLO: permitir admin/admin123 aunque no exista en la base
    const isDevEnv = process.env.NODE_ENV !== 'production';
    if (isDevEnv && username === DEV_ADMIN_USER.username && password === DEV_ADMIN_USER.password) {
      const token = jwt.sign(
        {
          id: DEV_ADMIN_USER.id,
          username: DEV_ADMIN_USER.username,
          rolId: DEV_ADMIN_USER.rolId,
          rol: DEV_ADMIN_USER.rolNombre
        },
        JWT_SECRET,
        { expiresIn: '8h' }
      );

      return res.json({
        token,
        usuario: {
          id: DEV_ADMIN_USER.id,
          username: DEV_ADMIN_USER.username,
          email: DEV_ADMIN_USER.email,
          nombre: DEV_ADMIN_USER.nombre,
          rolId: DEV_ADMIN_USER.rolId,
          rol: DEV_ADMIN_USER.rolNombre
        }
      });
    }

    return res.status(401).json({ message: 'Credenciales inválidas' });
  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).json({ message: 'Error en el login' });
  }
}; 

export const me = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ message: 'No autenticado' });
    const usuario = await prisma.usuario.findUnique({ where: { id: userId }, include: { rol: true } });
    if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado' });
    return res.json({
      id: usuario.id,
      username: usuario.username,
      email: usuario.email,
      nombre: usuario.nombre,
      rolId: usuario.rolId,
      rol: usuario.rol?.nombre,
      permisos: (usuario.rol as any)?.permisos || []
    });
  } catch (error) {
    console.error('Error en me:', error);
    return res.status(500).json({ message: 'Error al obtener datos del usuario' });
  }
};