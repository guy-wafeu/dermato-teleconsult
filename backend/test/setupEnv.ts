import { config as loadDotenv } from "dotenv";

// .env.test (gitignoré, voir .env.test.example) pointe vers une base Postgres de
// test locale dédiée — jamais la base de dev. dotenv ne réécrit pas une variable
// déjà présente dans process.env, donc un DATABASE_URL déjà exporté par le shell
// (CI, etc.) reste prioritaire sur ce fichier.
loadDotenv({ path: ".env.test" });

// Filet de sécurité si .env.test est absent : permet à `npm test` de démarrer sans
// planter sur la validation de config/env.ts, mais tout test touchant réellement
// Postgres échouera proprement (connexion refusée) plutôt que d'utiliser la base de
// dev par erreur. Firebase et GCS sont de toute façon mockés — voir test/mocks.ts.
process.env.NODE_ENV = "test";
process.env.DATABASE_URL ??= "postgresql://test:test@localhost:5432/dermato_test_missing_env_test_file";
process.env.FIREBASE_PROJECT_ID ??= "dermato-test";
process.env.GCS_PROJECT_ID ??= "dermato-test";
process.env.GCS_PHOTOS_BUCKET ??= "dermato-test-bucket";
// Africa's Talking est mocké (voir test/mocks.ts) — ces valeurs factices existent
// juste pour que services/sms.ts construise un client (chemin réel testé), jamais un
// vrai appel réseau.
process.env.AT_API_KEY ??= "test-api-key";
process.env.AT_USERNAME ??= "sandbox";
