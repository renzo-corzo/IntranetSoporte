const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 4001;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend funcionando' });
});

app.get('/api/vacaciones', (req, res) => {
  res.json({ 
    success: true, 
    data: [],
    message: 'Ruta de vacaciones funcionando' 
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor de prueba corriendo en puerto ${PORT}`);
  console.log(`📡 API disponible en http://localhost:${PORT}/api`);
});


