import { vi } from "vitest";

// Simule la vérification de jeton Firebase sans dépendre d'un vrai projet Firebase :
// un "jeton" ici est juste une clé opaque associée à l'identité passée à
// fakeIdToken/authHeader. Importé comme setupFile (voir vitest.config.ts) — vi.mock
// est réenregistré pour chaque fichier de test (isolation par défaut de Vitest).
export interface FakeIdentity {
  uid: string;
  email?: string;
}

const identities = new Map<string, FakeIdentity>();
let counter = 0;

export function fakeIdToken(identity: FakeIdentity): string {
  counter += 1;
  const token = `fake-token-${identity.uid}-${counter}`;
  identities.set(token, identity);
  return token;
}

export function authHeader(identity: FakeIdentity): string {
  return `Bearer ${fakeIdToken(identity)}`;
}

vi.mock("../src/lib/firebaseAdmin.js", () => ({
  firebaseAuth: {
    verifyIdToken: vi.fn(async (token: string) => {
      const identity = identities.get(token);
      if (!identity) {
        throw new Error("Jeton de test inconnu — utilisez authHeader() de test/mocks.ts.");
      }
      return { uid: identity.uid, email: identity.email };
    }),
  },
}));

// Idem pour Google Drive : les tests d'intégration vérifient le contrat (les bonnes
// lignes apparaissent en base avec le bon statut) sans dépendre d'un vrai compte de
// service ni d'un vrai dossier Drive.
import { Readable } from "node:stream";

let fakeDriveFileCounter = 0;

vi.mock("../src/services/googleDrive.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../src/services/googleDrive.js")>();
  return {
    ...actual,
    uploadPhotoToDrive: vi.fn(async (_buffer: Buffer, fileName: string) => {
      fakeDriveFileCounter += 1;
      const fileId = `fake-drive-file-${fakeDriveFileCounter}-${fileName}`;
      return { fileId, webViewLink: `https://fake-drive.test/${fileId}` };
    }),
    streamPhotoFromDrive: vi.fn(async (fileId: string) => ({
      stream: Readable.from(Buffer.from("fake-photo-bytes")),
      mimeType: fileId.endsWith(".png") ? "image/png" : "image/jpeg",
    })),
    getPhotoMetadata: vi.fn(async () => ({ exists: true, sizeBytes: 12345 })),
    deletePhotoFromDrive: vi.fn(async () => {}),
  };
});

// Google Sheets : synchronisation optionnelle (voir services/googleSheets.ts) — les
// tests ne vérifient pas son contenu, juste qu'un aléa dessus ne bloque jamais un
// parcours patient/admin par ailleurs correct.
vi.mock("../src/services/googleSheets.js", () => ({
  appendConsultationRow: vi.fn(async () => {}),
  updateConsultationStatusInSheet: vi.fn(async () => {}),
}));

// Idem pour Africa's Talking : test/setupEnv.ts renseigne des identifiants factices
// pour que services/sms.ts construise un vrai client (pas le no-op "non configuré"),
// afin de tester le chemin réel — sans jamais toucher au réseau.
interface FakeSendSmsParams {
  to: string | string[];
  message: string;
  from?: string;
}

export const africasTalkingSmsSend = vi.fn(async (_params: FakeSendSmsParams) => ({
  SMSMessageData: { Recipients: [] },
}));

vi.mock("africastalking", () => ({
  default: vi.fn(() => ({ SMS: { send: africasTalkingSmsSend } })),
}));
