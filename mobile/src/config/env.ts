// V1 minimal : pas encore de react-native-config branché (ajout natif supplémentaire,
// prévu en Phase 6 avec le reste de la configuration de build). En attendant, l'URL
// de dev pointe sur localhost pour toutes les plateformes — sur Android (émulateur ou
// vrai téléphone en USB), il faut lancer `adb reverse tcp:8080 tcp:8080` avant de
// démarrer l'app pour que "localhost" côté device atteigne le backend sur la machine
// hôte (voir mobile/README.md). Préféré à l'alias 10.0.2.2 : celui-ci ne fonctionne
// qu'avec l'émulateur AVD par défaut, pas avec un téléphone physique.
const DEV_API_URL = "http://localhost:8080/api/v1";

// Tunnel Cloudflare temporaire vers le backend local (voir demande explicite de
// build APK à envoyer au client sans déploiement Cloud Run) — ne fonctionne que
// tant que la machine de dev + le tunnel restent actifs. À remplacer par une
// vraie URL de production dès que le backend est déployé pour de bon.
const PROD_API_URL = "https://compliant-terrain-promotes-documentation.trycloudflare.com/api/v1";

export const env = {
  apiBaseUrl: __DEV__ ? DEV_API_URL : PROD_API_URL,
  consentTextVersion: "v1.0-2026-08-17",
};
