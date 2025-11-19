import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

async function main() {
  const prisma = new PrismaClient();
  const [username, plain] = process.argv.slice(2);
  if (!username || !plain) {
    console.error("Uso: tsx scripts/reset-password.ts <username> <newPassword>");
    process.exit(1);
  }
  const hashed = await bcrypt.hash(plain, 10);
  const user = await prisma.usuario.findUnique({ where: { username } });
  if (!user) {
    console.error("Usuario no encontrado:", username);
    process.exit(2);
  }
  await prisma.usuario.update({ where: { id: user.id }, data: { password: hashed } });
  console.log(`Password actualizado para ${username}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});



