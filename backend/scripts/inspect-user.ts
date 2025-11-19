import { PrismaClient } from "@prisma/client";

async function main() {
  const prisma = new PrismaClient();
  const username = process.argv[2];
  if (!username) {
    console.error("Uso: tsx scripts/inspect-user.ts <username>");
    process.exit(1);
  }
  const user = await prisma.usuario.findUnique({ where: { username }, include: { rol: true } });
  if (!user) {
    console.log("Usuario no encontrado");
  } else {
    console.log({ id: user.id, username: user.username, activo: user.activo, rol: user.rol?.nombre, rolId: user.rolId, passLen: user.password.length });
  }
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});



