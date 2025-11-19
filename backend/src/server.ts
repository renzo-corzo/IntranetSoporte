import dotenv from 'dotenv';
dotenv.config();

import app from './app';

const PORT = 4001;

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📡 API disponible en http://localhost:${PORT}/api`);
  console.log(`🌐 Entorno: ${process.env.NODE_ENV}`);
}); 