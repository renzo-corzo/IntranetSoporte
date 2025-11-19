import { Router } from 'express';
import { login, verifyToken } from '../controllers/auth.controller.simple';

const router = Router();

// Ruta de login
router.post('/login', login);

// Ruta para verificar token
router.get('/verify', verifyToken);

export default router;


