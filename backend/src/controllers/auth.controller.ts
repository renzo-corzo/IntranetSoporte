import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecreto';

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
    return res.status(500).json({ message: 'Error en el registro', error });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'Faltan campos obligatorios' });
    }
    const usuario = await prisma.usuario.findUnique({ where: { username }, include: { rol: true } });
    if (!usuario) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }
    const valid = await bcrypt.compare(password, usuario.password);
    if (!valid) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }
    const token = jwt.sign({ id: usuario.id, username: usuario.username, rolId: usuario.rolId, rol: usuario.rol.nombre }, JWT_SECRET, { expiresIn: '8h' });
    return res.json({ token, usuario: { id: usuario.id, username: usuario.username, email: usuario.email, nombre: usuario.nombre, rolId: usuario.rolId, rol: usuario.rol.nombre } });
  } catch (error) {
    return res.status(500).json({ message: 'Error en el login', error });
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
    return res.status(500).json({ message: 'Error al obtener datos del usuario', error });
  }
};