const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 4001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'Backend funcionando correctamente'
  });
});

// API Routes básicas
app.get('/api', (req, res) => {
  res.json({ 
    message: 'API de Infraestructura Caja de Abogados funcionando',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Rutas de vacaciones (simplificadas)
app.get('/api/vacaciones', (req, res) => {
  res.json({ 
    success: true, 
    data: [],
    message: 'Ruta de vacaciones funcionando' 
  });
});

app.post('/api/vacaciones', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Solicitud de vacaciones recibida',
    data: req.body
  });
});

// Rutas de empleados (simplificadas)
app.get('/api/empleados', (req, res) => {
  res.json({ 
    success: true, 
    data: [],
    message: 'Ruta de empleados funcionando' 
  });
});

// Rutas de autenticación (simplificadas)
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  // Usuario de prueba
  if (username === 'admin' && password === 'admin') {
    res.json({
      success: true,
      token: 'fake-jwt-token-for-testing',
      user: {
        id: 1,
        username: 'admin',
        nombre: 'Administrador',
        rol: 'admin'
      }
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Credenciales inválidas'
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📡 API disponible en http://localhost:${PORT}/api`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Login: POST http://localhost:${PORT}/api/auth/login`);
});

console.log('✅ Backend simplificado iniciado correctamente');


