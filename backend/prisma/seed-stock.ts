import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedStock() {
  console.log('🌱 Iniciando seed del módulo de Stock...');

  // 1. Crear Categorías de Stock
  const categorias = await Promise.all([
    prisma.categoriaStock.upsert({
      where: { nombre: 'Hardware' },
      update: {},
      create: {
        nombre: 'Hardware',
        descripcion: 'Componentes y equipos de hardware',
        icono: '💻',
        color: '#3B82F6'
      }
    }),
    prisma.categoriaStock.upsert({
      where: { nombre: 'Cables y Conectores' },
      update: {},
      create: {
        nombre: 'Cables y Conectores',
        descripcion: 'Cables de red, USB, HDMI, conectores diversos',
        icono: '🔌',
        color: '#10B981'
      }
    }),
    prisma.categoriaStock.upsert({
      where: { nombre: 'Herramientas' },
      update: {},
      create: {
        nombre: 'Herramientas',
        descripcion: 'Herramientas para mantenimiento y reparación',
        icono: '🔧',
        color: '#F59E0B'
      }
    }),
    prisma.categoriaStock.upsert({
      where: { nombre: 'Consumibles' },
      update: {},
      create: {
        nombre: 'Consumibles',
        descripcion: 'Papel, etiquetas, insumos generales, etc.',
        icono: '🖨️',
        color: '#EF4444'
      }
    }),
    prisma.categoriaStock.upsert({
      where: { nombre: 'Toner' },
      update: {},
      create: {
        nombre: 'Toner',
        descripcion: 'Cartuchos de tóner para impresoras y multifuncionales',
        icono: '🖨️',
        color: '#DC2626'
      }
    }),
    prisma.categoriaStock.upsert({
      where: { nombre: 'Software y Licencias' },
      update: {},
      create: {
        nombre: 'Software y Licencias',
        descripcion: 'Licencias de software y aplicaciones',
        icono: '💿',
        color: '#8B5CF6'
      }
    }),
    prisma.categoriaStock.upsert({
      where: { nombre: 'Networking' },
      update: {},
      create: {
        nombre: 'Networking',
        descripcion: 'Switches, routers, access points',
        icono: '🌐',
        color: '#06B6D4'
      }
    }),
    prisma.categoriaStock.upsert({
      where: { nombre: 'Periféricos' },
      update: {},
      create: {
        nombre: 'Periféricos',
        descripcion: 'Teclados, mouse, monitores, webcams, etc.',
        icono: '🖱️',
        color: '#EC4899'
      }
    }),
    prisma.categoriaStock.upsert({
      where: { nombre: 'Almacenamiento' },
      update: {},
      create: {
        nombre: 'Almacenamiento',
        descripcion: 'Discos duros, SSDs, unidades externas, pendrives',
        icono: '💾',
        color: '#14B8A6'
      }
    }),
    prisma.categoriaStock.upsert({
      where: { nombre: 'Seguridad' },
      update: {},
      create: {
        nombre: 'Seguridad',
        descripcion: 'Cámaras, sistemas de seguridad, candados, etc.',
        icono: '🔒',
        color: '#F97316'
      }
    })
  ]);

  // 2. Crear Unidades de Medida
  const unidades = await Promise.all([
    prisma.unidadMedida.upsert({
      where: { nombre: 'Unidad' },
      update: {},
      create: {
        nombre: 'Unidad',
        abreviacion: 'Un',
        tipo: 'Cantidad'
      }
    }),
    prisma.unidadMedida.upsert({
      where: { nombre: 'Metro' },
      update: {},
      create: {
        nombre: 'Metro',
        abreviacion: 'm',
        tipo: 'Longitud'
      }
    }),
    prisma.unidadMedida.upsert({
      where: { nombre: 'Kilogramo' },
      update: {},
      create: {
        nombre: 'Kilogramo',
        abreviacion: 'kg',
        tipo: 'Peso'
      }
    }),
    prisma.unidadMedida.upsert({
      where: { nombre: 'Caja' },
      update: {},
      create: {
        nombre: 'Caja',
        abreviacion: 'Cja',
        tipo: 'Empaque'
      }
    }),
    prisma.unidadMedida.upsert({
      where: { nombre: 'Rollo' },
      update: {},
      create: {
        nombre: 'Rollo',
        abreviacion: 'Rll',
        tipo: 'Empaque'
      }
    })
  ]);

  // 3. Crear Proveedores
  const proveedores = await Promise.all([
    prisma.proveedorStock.upsert({
      where: { nombre: 'TechnoComputer' },
      update: {},
      create: {
        nombre: 'TechnoComputer',
        contacto: 'Juan Pérez',
        telefono: '+54 11 4567-8901',
        email: 'ventas@technocomputer.com.ar',
        direccion: 'Av. Corrientes 1234, CABA',
        sitioWeb: 'https://technocomputer.com.ar'
      }
    }),
    prisma.proveedorStock.upsert({
      where: { nombre: 'Sistemas Integrales' },
      update: {},
      create: {
        nombre: 'Sistemas Integrales',
        contacto: 'María González',
        telefono: '+54 11 2345-6789',
        email: 'info@sistemasintegrales.com',
        direccion: 'Av. Santa Fe 5678, CABA'
      }
    }),
    prisma.proveedorStock.upsert({
      where: { nombre: 'Distribuidora IT' },
      update: {},
      create: {
        nombre: 'Distribuidora IT',
        contacto: 'Carlos Rodríguez',
        telefono: '+54 11 9876-5432',
        email: 'carlos@distribuidorait.com.ar'
      }
    })
  ]);

  // 4. Crear Ubicaciones
  const ubicaciones = await Promise.all([
    prisma.ubicacionStock.upsert({
      where: { nombre: 'Oficina Principal' },
      update: {},
      create: {
        nombre: 'Oficina Principal',
        descripcion: 'Oficina principal del departamento de sistemas',
        tipo: 'Oficina'
      }
    }),
    prisma.ubicacionStock.upsert({
      where: { nombre: 'Depósito General' },
      update: {},
      create: {
        nombre: 'Depósito General',
        descripcion: 'Depósito principal de materiales',
        tipo: 'Depósito'
      }
    }),
    prisma.ubicacionStock.upsert({
      where: { nombre: 'Rack Servidor A1' },
      update: {},
      create: {
        nombre: 'Rack Servidor A1',
        descripcion: 'Rack principal de servidores',
        tipo: 'Rack'
      }
    }),
    prisma.ubicacionStock.upsert({
      where: { nombre: 'Armario Herramientas' },
      update: {},
      create: {
        nombre: 'Armario Herramientas',
        descripcion: 'Armario con herramientas de trabajo',
        tipo: 'Armario'
      }
    })
  ]);

  // 5. Crear Tipos de Movimiento
  const tiposMovimiento = await Promise.all([
    prisma.tipoMovimiento.upsert({
      where: { nombre: 'Ingreso' },
      update: {},
      create: {
        nombre: 'Ingreso',
        descripcion: 'Ingreso de mercadería al stock',
        afectaStock: 'suma',
        requiereOrigen: false,
        requiereDestino: true,
        color: '#10B981',
        icono: '📥'
      }
    }),
    prisma.tipoMovimiento.upsert({
      where: { nombre: 'Salida' },
      update: {},
      create: {
        nombre: 'Salida',
        descripcion: 'Salida de mercadería del stock',
        afectaStock: 'resta',
        requiereOrigen: true,
        requiereDestino: false,
        color: '#EF4444',
        icono: '📤'
      }
    }),
    prisma.tipoMovimiento.upsert({
      where: { nombre: 'Transferencia' },
      update: {},
      create: {
        nombre: 'Transferencia',
        descripcion: 'Transferencia entre ubicaciones',
        afectaStock: 'neutro',
        requiereOrigen: true,
        requiereDestino: true,
        color: '#3B82F6',
        icono: '🔄'
      }
    }),
    prisma.tipoMovimiento.upsert({
      where: { nombre: 'Ajuste' },
      update: {},
      create: {
        nombre: 'Ajuste',
        descripcion: 'Ajuste de inventario',
        afectaStock: 'neutro',
        requiereOrigen: false,
        requiereDestino: false,
        color: '#F59E0B',
        icono: '⚖️'
      }
    }),
    prisma.tipoMovimiento.upsert({
      where: { nombre: 'Devolución' },
      update: {},
      create: {
        nombre: 'Devolución',
        descripcion: 'Devolución de mercadería',
        afectaStock: 'suma',
        requiereOrigen: false,
        requiereDestino: true,
        color: '#8B5CF6',
        icono: '↩️'
      }
    })
  ]);

  console.log('✅ Seed del módulo de Stock completado:');
  console.log(`   - ${categorias.length} categorías creadas`);
  console.log(`   - ${unidades.length} unidades de medida creadas`);
  console.log(`   - ${proveedores.length} proveedores creados`);
  console.log(`   - ${ubicaciones.length} ubicaciones creadas`);
  console.log(`   - ${tiposMovimiento.length} tipos de movimiento creados`);
}

export default seedStock;

// Si se ejecuta directamente
if (require.main === module) {
  seedStock()
    .catch((e) => {
      console.error('❌ Error en seed:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

