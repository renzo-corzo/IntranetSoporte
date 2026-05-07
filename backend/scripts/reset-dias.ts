import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../.env') });
const prisma = new PrismaClient();
prisma.empleado.updateMany({ data: { diasDisponibles: 0 } })
  .then(r => { console.log(`Actualizados: ${r.count} empleados → diasDisponibles = 0`); prisma.$disconnect(); })
  .catch(e => { console.error(e); process.exit(1); });
