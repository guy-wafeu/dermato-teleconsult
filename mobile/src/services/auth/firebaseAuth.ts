import {
  createUserWithEmailAndPassword,
  getAuth,
  getIdToken as firebaseGetIdToken,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from "@react-native-firebase/auth";

// Nécessite google-services.json (Android) / GoogleService-Info.plist (iOS) — voir
// "Actions Google Cloud / Firebase à faire" dans le README racine. Sans ces fichiers,
// l'app compile mais tout appel Firebase échoue au runtime.
const auth = getAuth();

export function subscribeToAuthState(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

// Utilisé pour relancer la résolution de profil après un échec réseau (voir
// RootNavigator "Réessayer") sans redemander les identifiants : la session
// Firebase reste valide même si l'appel vers notre backend a échoué.
export function getCurrentUser(): User | null {
  return auth.currentUser;
}

export async function signUpWithEmail(email: string, password: string): Promise<User> {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  return credential.user;
}

export async function signInWithEmail(email: string, password: string): Promise<User> {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

// force=true après une modification de rôle côté back (rare en V1) pour ne pas
// attendre l'expiration naturelle du jeton (~1h).
export async function getIdToken(force = false): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  return firebaseGetIdToken(user, force);
}

export async function requestPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

// Firebase renvoie des codes techniques (auth/email-already-in-use, ...) — jamais
// affichés tels quels à un patient. Toute erreur non reconnue tombe sur un message
// générique plutôt que de fuiter un détail technique.
export function mapFirebaseAuthError(error: unknown): string {
  const code = (error as { code?: string })?.code;
  switch (code) {
    case "auth/email-already-in-use":
      return "Un compte existe déjà avec cet email.";
    case "auth/invalid-email":
      return "Adresse email invalide.";
    case "auth/weak-password":
      return "Le mot de passe doit contenir au moins 6 caractères.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Email ou mot de passe incorrect.";
    case "auth/too-many-requests":
      return "Trop de tentatives — réessayez dans quelques minutes.";
    case "auth/network-request-failed":
      return "Connexion internet indisponible. Réessayez.";
    default:
      return "Une erreur est survenue. Réessayez dans un instant.";
  }
}
