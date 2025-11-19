import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Usuario admin hardcodeado para desarrollo
const ADMIN_USER = {
  id: 1,
  username: 'admin',
  password: '$2a$10$agBnub2snvdaOvXXSfIife73GX92krI3ZEMOqM5EmCK2zhykuWiF2', // admin123
  rol: 'admin',
  nombre: 'Administrador',
  email: 'admin@caja.com.ar'
};

export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username y password son requeridos'
      });
    }

    // Verificar credenciales
    if (username === ADMIN_USER.username) {
      const isValidPassword = await bcrypt.compare(password, ADMIN_USER.password);
      
      if (isValidPassword) {
        // Generar JWT token
        const token = jwt.sign(
          { 
            id: ADMIN_USER.id, 
            username: ADMIN_USER.username, 
            rol: ADMIN_USER.rol 
          },
          process.env.JWT_SECRET || 'default_secret',
          { expiresIn: '24h' }
        );

        return res.json({
          success: true,
          message: 'Login exitoso',
          token,
          usuario: {
            id: ADMIN_USER.id,
            username: ADMIN_USER.username,
            rol: ADMIN_USER.rol,
            nombre: ADMIN_USER.nombre,
            email: ADMIN_USER.email
          }
        });
      }
    }

    return res.status(401).json({
      success: false,
      message: 'Credenciales inválidas'
    });

  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

export const verifyToken = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token no proporcionado'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret') as any;
    
    return res.json({
      success: true,
      usuario: {
        id: decoded.id,
        username: decoded.username,
        rol: decoded.rol
      }
    });

  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token inválido'
    });
  }
};
