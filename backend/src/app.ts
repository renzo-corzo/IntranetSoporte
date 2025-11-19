import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import router from './routes';

const app = express();

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Servir archivos estáticos desde la carpeta uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rutas principales (se agregarán luego)
// app.use('/api/auth', ...);
// app.use('/api/servidores', ...);

app.use('/api', router);

app.get('/', (req, res) => {
  res.send('API de Infraestructura Caja de Abogados funcionando');
});

export default app; 