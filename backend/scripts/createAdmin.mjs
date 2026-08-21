// Script à usage unique : insère un AdminUser correspondant à un compte Firebase
// déjà créé (voir accounts:signUp) — aucune route publique de création d'admin ou
// d'agent n'existe volontairement (voir agent.service.ts, rbac.ts).
// Usage: node scripts/createAdmin.mjs <firebaseUid> <email> <nom> <prenom> [role]
// role: "admin" (défaut) ou "agent" (compte terrain, souvent partagé — voir
// AdminRole dans schema.prisma).
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const [, , firebaseUid, email, nom, prenom, role = "admin"] = process.argv;

const admin = await prisma.adminUser.upsert({
  where: { firebaseUid },
  create: { firebaseUid, email, nom, prenom, role, isActive: true },
  update: { email, nom, prenom, role },
});
console.log(`Compte "${role}" créé/mis à jour :`, admin.id, admin.email);
await prisma.$disconnect();
