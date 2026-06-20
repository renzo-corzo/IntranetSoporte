import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

// Configuración de multer para subir archivos
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    // Generar nombre único con timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB límite
  },
  fileFilter: (req, file, cb) => {
    // Permitir solo imágenes y documentos
    const allowedTypes = /jpeg|jpg|png|gif|webp|pdf|doc|docx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido'));
    }
  }
});

// Endpoint para subir un archivo
router.post('/file', verifyToken, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No se proporcionó ningún archivo' });
    }

    // Retornar la ruta relativa del archivo
    const filePath = `uploads/${req.file.filename}`;
    
    res.json({
      message: 'Archivo subido exitosamente',
      filePath: filePath,
      originalName: req.file.originalname,
      size: req.file.size
    });
  } catch (error) {
    console.error('Error al subir archivo:', error);
    res.status(500).json({ message: 'Error al subir archivo', error });
  }
});

// Endpoint para subir múltiples archivos
router.post('/files', verifyToken, upload.array('files', 10), (req, res) => {
  try {
    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
      return res.status(400).json({ message: 'No se proporcionaron archivos' });
    }

    const files = req.files as Express.Multer.File[];
    const uploadedFiles = files.map(file => ({
      filePath: `uploads/${file.filename}`,
      originalName: file.originalname,
      size: file.size
    }));

    res.json({
      message: 'Archivos subidos exitosamente',
      files: uploadedFiles
    });
  } catch (error) {
    console.error('Error al subir archivos:', error);
    res.status(500).json({ message: 'Error al subir archivos', error });
  }
});

export default router;