// Script à usage unique : obtient un refresh token OAuth2 pour un compte Google
// personnel (voir décision produit — les comptes de service n'ont plus de quota
// de stockage Drive, voir services/googleDrive.ts). Ouvre un petit serveur local
// qui capture le "code" renvoyé par Google après autorisation, puis l'échange
// contre un refresh token à coller une fois dans .env.
import { google } from "googleapis";
import http from "node:http";

const [, , clientId, clientSecret] = process.argv;
if (!clientId || !clientSecret) {
  console.error("Usage: node scripts/authorizeDrive.mjs <CLIENT_ID> <CLIENT_SECRET>");
  process.exit(1);
}

const PORT = 53682;
const REDIRECT_URI = `http://localhost:${PORT}`;
const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, REDIRECT_URI);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  prompt: "consent",
  scope: ["https://www.googleapis.com/auth/drive"],
});

console.log("\nOuvrez ce lien dans votre navigateur, connectez-vous avec le compte Google");
console.log("dont le Drive doit stocker les photos, puis acceptez :\n");
console.log(authUrl);
console.log("\nEn attente de l'autorisation...\n");

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, REDIRECT_URI);
  const code = url.searchParams.get("code");
  if (!code) {
    res.writeHead(400).end("Pas de code reçu.");
    return;
  }
  try {
    const { tokens } = await oauth2Client.getToken(code);
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end("<h2>Autorisation réussie — vous pouvez fermer cet onglet.</h2>");
    console.log("Refresh token obtenu :\n");
    console.log(tokens.refresh_token);
    console.log("\nÀ copier dans backend/.env sous GOOGLE_OAUTH_REFRESH_TOKEN.");
  } catch (err) {
    res.writeHead(500).end("Échec de l'échange du code.");
    console.error(err);
  } finally {
    server.close();
    setTimeout(() => process.exit(0), 200);
  }
});

server.listen(PORT);
