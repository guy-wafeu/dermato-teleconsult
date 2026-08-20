import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const LESION_TYPES = [
  { code: "tache", labelFr: "Taches", description: "Zone de peau dont la couleur diffère, sans relief.", displayOrder: 1 },
  { code: "papule", labelFr: "Papules", description: "Petites lésions solides en relief.", displayOrder: 2 },
  { code: "plaque", labelFr: "Plaques", description: "Lésions plus larges, en relief ou non.", displayOrder: 3 },
  { code: "pustule", labelFr: "Pustules", description: "Petites lésions contenant du pus.", displayOrder: 4 },
  { code: "vesicule", labelFr: "Vésicules", description: "Petites lésions contenant du liquide clair.", displayOrder: 5 },
  { code: "bulle", labelFr: "Bulles / cloques", description: "Lésions contenant du liquide, plus larges qu'une vésicule.", displayOrder: 6 },
  { code: "plaie", labelFr: "Plaie", description: "Perte de substance de la peau.", displayOrder: 7 },
  { code: "autre", labelFr: "Autre", description: "Aspect non listé ci-dessus — à préciser.", displayOrder: 8 },
] as const;

// Créneaux repris du formulaire de référence. `label` reste la chaîne affichée à
// l'utilisateur ; heureDebut/heureFin permettent des tris/filtres futurs côté admin.
const AVAILABILITIES = [
  { jourSemaine: "lundi", heureDebut: "19:30", heureFin: "20:30", label: "Lundi 19h30–20h30", displayOrder: 1 },
  { jourSemaine: "mardi", heureDebut: "19:30", heureFin: "20:30", label: "Mardi 19h30–20h30", displayOrder: 2 },
  { jourSemaine: "mercredi", heureDebut: "19:30", heureFin: "20:30", label: "Mercredi 19h30–20h30", displayOrder: 3 },
  { jourSemaine: "jeudi", heureDebut: "19:30", heureFin: "20:30", label: "Jeudi 19h30–20h30", displayOrder: 4 },
  { jourSemaine: "vendredi", heureDebut: "19:30", heureFin: "20:30", label: "Vendredi 19h30–20h30", displayOrder: 5 },
  { jourSemaine: "samedi", heureDebut: "09:00", heureFin: "12:00", label: "Samedi 09h00–12h00", displayOrder: 6 },
  { jourSemaine: "samedi", heureDebut: "16:00", heureFin: "18:00", label: "Samedi 16h00–18h00", displayOrder: 7 },
] as const;

function timeOnDate(hhmm: string): Date {
  const [hours, minutes] = hhmm.split(":").map(Number);
  const date = new Date(Date.UTC(1970, 0, 1, hours, minutes, 0));
  return date;
}

async function main() {
  for (const lesionType of LESION_TYPES) {
    await prisma.lesionType.upsert({
      where: { code: lesionType.code },
      update: lesionType,
      create: lesionType,
    });
  }

  for (const availability of AVAILABILITIES) {
    const existing = await prisma.availability.findFirst({
      where: { jourSemaine: availability.jourSemaine, label: availability.label },
    });
    const data = {
      jourSemaine: availability.jourSemaine,
      heureDebut: timeOnDate(availability.heureDebut),
      heureFin: timeOnDate(availability.heureFin),
      label: availability.label,
      displayOrder: availability.displayOrder,
      actif: true,
    };
    if (existing) {
      await prisma.availability.update({ where: { id: existing.id }, data });
    } else {
      await prisma.availability.create({ data });
    }
  }

  console.log(`Seed terminé : ${LESION_TYPES.length} types de lésion, ${AVAILABILITIES.length} disponibilités.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
