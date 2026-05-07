import { PrismaClient } from '@prisma/client';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();

const nomina = [
  // Asesoría Letrada
  { apellido: 'Cornet Oliva',      nombre: 'Magdalena',      departamento: 'Asesoría Letrada' },
  // Contaduría
  { apellido: 'Bornancini',        nombre: 'Gisella',         departamento: 'Contaduría' },
  { apellido: 'Muzo',              nombre: 'Claudio Daniel',  departamento: 'Contaduría' },
  { apellido: 'Panuntin',          nombre: 'Stella Maris',    departamento: 'Contaduría' },
  { apellido: 'Prada',             nombre: 'Ignacio',         departamento: 'Contaduría' },
  { apellido: 'Silva',             nombre: 'Javier',          departamento: 'Contaduría' },
  { apellido: 'Suarez',            nombre: 'Silvana',         departamento: 'Contaduría' },
  // Control de Aportes
  { apellido: 'Ceballos',          nombre: 'Marcos Javier',   departamento: 'Control de Aportes' },
  { apellido: 'Lascano',           nombre: 'Federico',        departamento: 'Control de Aportes' },
  { apellido: 'Magarzo',           nombre: 'María Dolores',   departamento: 'Control de Aportes' },
  { apellido: 'Marinzalda',        nombre: 'Jorgelina',       departamento: 'Control de Aportes' },
  { apellido: 'Martinez Armando',  nombre: 'Inés María',      departamento: 'Control de Aportes' },
  { apellido: 'Yacanto',           nombre: 'Carina',          departamento: 'Control de Aportes' },
  // Informática
  { apellido: 'Castro Gash',       nombre: 'Stefano',         departamento: 'Informática' },
  { apellido: 'Corzo',             nombre: 'Renzo Julio',     departamento: 'Informática' },
  { apellido: 'Prieto Lamas',      nombre: 'Daniel E.',       departamento: 'Informática' },
  // Servicio de Salud
  { apellido: 'Couget',            nombre: 'Walter',          departamento: 'Servicio de Salud' },
  { apellido: 'Marchese',          nombre: 'Diego',           departamento: 'Servicio de Salud' },
  { apellido: 'Millan',            nombre: 'Karina Natalia',  departamento: 'Servicio de Salud' },
  { apellido: 'Onofri',            nombre: 'Jorge',           departamento: 'Servicio de Salud' },
  { apellido: 'Saad',              nombre: 'Pablo',           departamento: 'Servicio de Salud' },
  // Secretaría General
  { apellido: 'Campos',            nombre: 'Pedro',           departamento: 'Secretaría General' },
  { apellido: 'Juarez',            nombre: 'Alejandro',       departamento: 'Secretaría General' },
  { apellido: 'Lopez',             nombre: 'María Soledad',   departamento: 'Secretaría General' },
  { apellido: 'Pumo',              nombre: 'Martín',          departamento: 'Secretaría General' },
  { apellido: 'Rapetti',           nombre: 'Nicolas',         departamento: 'Secretaría General' },
  { apellido: 'Rios',              nombre: 'María Gladys',    departamento: 'Secretaría General' },
  { apellido: 'Senn Favre',        nombre: 'Mariana',         departamento: 'Secretaría General' },
];

function slug(str: string) {
  return str.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '.');
}

async function main() {
  console.log(`\n📋 Importando ${nomina.length} empleados...\n`);
  let creados = 0, omitidos = 0;

  for (let i = 0; i < nomina.length; i++) {
    const e = nomina[i];
    const email = `${slug(e.nombre)}.${slug(e.apellido)}@caja-abogados.com.ar`;
    const dni = String(10000000 + i + 1);

    // Verificar si ya existe por email o apellido+nombre
    const existe = await prisma.empleado.findFirst({
      where: {
        OR: [
          { email },
          { AND: [{ nombre: e.nombre }, { apellido: e.apellido }] }
        ]
      }
    });

    if (existe) {
      console.log(`⏭️  Ya existe: ${e.apellido}, ${e.nombre}`);
      omitidos++;
      continue;
    }

    await prisma.empleado.create({
      data: {
        nombre: e.nombre,
        apellido: e.apellido,
        dni,
        email,
        departamento: e.departamento,
        estado: 'ACTIVO',
        fechaIngreso: new Date('2024-01-01'),
        diasDisponibles: 20,
      }
    });
    console.log(`✅ ${e.apellido}, ${e.nombre} — ${e.departamento}`);
    creados++;
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`✅ Creados:  ${creados}`);
  console.log(`⏭️  Omitidos: ${omitidos}`);
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
