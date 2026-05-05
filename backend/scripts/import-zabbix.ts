import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ── DATOS EXTRAÍDOS DEL EXPORT DE ZABBIX ─────────────────────────────────────

const PCS = [
  { nombre: 'PC-ABOGADOS',  ip: '192.168.123.145', area: 'Archivo' },
  { nombre: 'PC-PASANTE',   ip: '192.168.123.182', area: 'Sistemas' },
  { nombre: 'PCAD01',       ip: '192.168.123.30',  area: 'Administración' },
  { nombre: 'PCAD02',       ip: '192.168.123.31',  area: 'Administración' },
  { nombre: 'PCAD03',       ip: '192.168.123.32',  area: 'Administración' },
  { nombre: 'PCAD04',       ip: '192.168.123.33',  area: 'Administración' },
  { nombre: 'PCAP01',       ip: '192.168.123.50',  area: 'Aportes' },
  { nombre: 'PCAP03',       ip: '192.168.123.52',  area: 'Aportes' },
  { nombre: 'PCAP05',       ip: '192.168.123.54',  area: 'Aportes' },
  { nombre: 'PCAP06',       ip: '192.168.123.55',  area: 'Aportes' },
  { nombre: 'PCAP07',       ip: '192.168.123.56',  area: 'Aportes' },
  { nombre: 'PCAP13',       ip: '192.168.123.51',  area: 'Aportes' },
  { nombre: 'PCAR01',       ip: '192.168.123.60',  area: 'Archivo' },
  { nombre: 'PCCA01',       ip: '192.168.123.70',  area: 'Cajas' },
  { nombre: 'PCCA02',       ip: '192.168.123.71',  area: 'Cajas' },
  { nombre: 'PCCT02',       ip: '192.168.123.81',  area: 'Contaduría' },
  { nombre: 'PCCT03',       ip: '192.168.123.82',  area: 'Contaduría' },
  { nombre: 'PCCT04',       ip: '192.168.123.83',  area: 'Contaduría' },
  { nombre: 'PCCT05',       ip: '192.168.123.84',  area: 'Contaduría' },
  { nombre: 'PCME02',       ip: '192.168.123.91',  area: 'Mesa de Entrada' },
  { nombre: 'PCME04',       ip: '192.168.123.90',  area: 'Mesa de Entrada' },
  { nombre: 'PCPR04',       ip: '192.168.123.102', area: 'Procuradores' },
  { nombre: 'PCPR05',       ip: '192.168.123.103', area: 'Procuradores' },
  { nombre: 'PCSI01',       ip: '192.168.123.131', area: 'Sistemas' },
  { nombre: 'PCSI02',       ip: '192.168.123.113', area: 'Sistemas' },
  { nombre: 'PCSM01',       ip: '192.168.123.120', area: 'Servicio Médico' },
  { nombre: 'PCSM07',       ip: '192.168.123.126', area: 'Servicio Médico' },
  { nombre: 'PCSM10',       ip: '192.168.123.125', area: 'Servicio Médico' },
  { nombre: 'PCSM11',       ip: '192.168.123.128', area: 'Servicio Médico' },
  { nombre: 'PCSM12',       ip: '192.168.123.121', area: 'Servicio Médico' },
  { nombre: 'PCSM15',       ip: '192.168.123.122', area: 'Servicio Médico' },
  { nombre: 'PCSM16',       ip: '192.168.123.129', area: 'Servicio Médico' },
];

const EQUIPOS_RED = [
  { nombre: 'SWITCH_3COM',       ip: '192.168.123.110', tipo: 'switch',       ubicacion: 'Sala de Servidores' },
  { nombre: 'SWITCH_HP',         ip: '192.168.123.111', tipo: 'switch',       ubicacion: 'Sala de Servidores' },
  { nombre: 'AP-ADMINISTRACION', ip: '192.168.123.144', tipo: 'access_point', ubicacion: 'Administración' },
  { nombre: 'AP-APORTES',        ip: '192.168.123.141', tipo: 'access_point', ubicacion: 'Aportes' },
  { nombre: 'AP-SERVICIO-MEDICO',ip: '192.168.123.142', tipo: 'access_point', ubicacion: 'Servicio Médico' },
];

// ─────────────────────────────────────────────────────────────────────────────

async function importarPCs() {
  console.log('\n📦 Importando PCs de usuario...');
  let ok = 0, skip = 0;

  for (const pc of PCS) {
    const existe = await prisma.equipoUsuario.findFirst({
      where: { nombre: pc.nombre }
    });

    if (existe) {
      console.log(`  ⏭  ${pc.nombre} — ya existe, saltando`);
      skip++;
      continue;
    }

    await prisma.equipoUsuario.create({
      data: {
        nombre:           pc.nombre,
        ip:               pc.ip,
        tipo:             'desktop',
        area:             pc.area,
        estado:           'produccion',
        notasTecnicas:    `Importado desde Zabbix`,
      }
    });

    console.log(`  ✅ ${pc.nombre} — ${pc.ip} — ${pc.area}`);
    ok++;
  }

  console.log(`  → ${ok} creados, ${skip} ya existían`);
}

async function importarEquiposRed() {
  console.log('\n🌐 Importando equipos de red...');
  let ok = 0, skip = 0;

  for (const eq of EQUIPOS_RED) {
    const existe = await prisma.equipoRed.findFirst({
      where: { nombre: eq.nombre }
    });

    if (existe) {
      console.log(`  ⏭  ${eq.nombre} — ya existe, saltando`);
      skip++;
      continue;
    }

    await prisma.equipoRed.create({
      data: {
        nombre:        eq.nombre,
        ip:            eq.ip,
        tipo:          eq.tipo,
        ubicacion:     eq.ubicacion,
        estado:        'produccion',
        notasTecnicas: `Importado desde Zabbix`,
      }
    });

    console.log(`  ✅ ${eq.nombre} — ${eq.ip} — ${eq.tipo}`);
    ok++;
  }

  console.log(`  → ${ok} creados, ${skip} ya existían`);
}

async function main() {
  console.log('🚀 Importando equipos desde Zabbix a CMDB...');
  console.log(`   PCs a importar:          ${PCS.length}`);
  console.log(`   Equipos de red:          ${EQUIPOS_RED.length}`);

  await importarPCs();
  await importarEquiposRed();

  const totalPCs  = await prisma.equipoUsuario.count();
  const totalRed  = await prisma.equipoRed.count();

  console.log('\n✅ Importación completada');
  console.log(`   Total PCs en CMDB:       ${totalPCs}`);
  console.log(`   Total equipos red:       ${totalRed}`);
}

main()
  .catch(e => { console.error('❌ Error:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
