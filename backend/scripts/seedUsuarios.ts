import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

type Empleado = { nombre: string; departamento: string };

const empleados: Empleado[] = [
  { nombre: 'GISELLA BORNANCINI', departamento: 'Contaduria' },
  { nombre: 'PEDRO CAMPOS', departamento: 'Secretaria' },
  { nombre: 'STEFANO CASTRO GASCH', departamento: 'Sistemas' },
  { nombre: 'MARCOS CEBALLOS', departamento: 'Aportes' },
  { nombre: 'RENZO CORZO', departamento: 'Sistemas' },
  { nombre: 'MAGDALENA CORNET', departamento: 'Asecoria de letrado' },
  { nombre: 'WALTER COUGUET', departamento: 'Servicio medico' },
  { nombre: 'ALEJANDRO JUAREZ', departamento: 'Secretaria' },
  { nombre: 'FEDERICO LASCANO', departamento: 'Aportes' },
  { nombre: 'SOLEDAD LOPEZ', departamento: 'Secretaria' },
  { nombre: 'MARIA DOLORES MAGARZO', departamento: 'Aportes' },
  { nombre: 'DIEGO MARCHESE', departamento: 'Servicio medico' },
  { nombre: 'JORGELINA MARINZALDA', departamento: 'Aportes' },
  { nombre: 'INES MARTINEZ', departamento: 'Aportes' },
  { nombre: 'KARINA MILLAN', departamento: 'Servicio medico' },
  { nombre: 'DANIEL MUZO', departamento: 'Contaduria' },
  { nombre: 'JORGE ONOFRI', departamento: 'Servicio medico' },
  { nombre: 'STELLA MARIS PANUNTIN', departamento: 'Contaduria' },
  { nombre: 'IGNACIO PRADA', departamento: 'Contaduria' },
  { nombre: 'MARTIN PUMO', departamento: 'Secretaria' },
  { nombre: 'DANIEL PRIETO LAMAS', departamento: 'Sistemas' },
  { nombre: 'NICOLAS RAPETTI', departamento: 'Secretaria' },
  { nombre: 'CORINA REVUELTA', departamento: 'Servicio medico' },
  { nombre: 'GLADYS RIOS', departamento: 'Ordenanza' },
  { nombre: 'PABLO SAAD', departamento: 'Servicio medico' },
  { nombre: 'MARIANA SENN', departamento: 'Secretaria' },
  { nombre: 'JAVIER SILVA', departamento: 'Contaduria' },
  { nombre: 'SILVANA SUAREZ', departamento: 'Contaduria' },
  { nombre: 'DANIEL VOCOS', departamento: 'Contaduria' },
  { nombre: 'CARINA YACANTO', departamento: 'Aportes' },
];

function quitarTildes(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ñ/gi, (m) => (m === 'Ñ' ? 'N' : 'n'));
}

function generarEmail(nombreCompleto: string): { email: string; username: string } {
  const limpio = quitarTildes(nombreCompleto.trim().toLowerCase());
  const partes = limpio
    .replace(/[^a-zA-Z\s]/g, '')
    .split(/\s+/)
    .filter(Boolean);
  const local = partes.join('.');
  const email = `${local}@caja.com`;
  const username = local; // usamos la parte local del email como username
  return { email, username };
}

async function main() {
  const hashed = await bcrypt.hash('caja1234', 10);

  for (const emp of empleados) {
    const { email, username } = generarEmail(emp.nombre);

    await prisma.usuario.upsert({
      where: { email },
      create: {
        nombre: emp.nombre,
        email,
        username,
        password: hashed,
        departamento: emp.departamento,
        rolId: 2, // rol estándar
        activo: true,
      },
      update: {
        nombre: emp.nombre,
        username,
        departamento: emp.departamento,
        rolId: 2,
        activo: true,
        password: hashed, // reestablece la contraseña temporal si cambiara
      },
    });

    console.log(`Upsert usuario: ${emp.nombre} -> ${email}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


