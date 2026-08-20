// Voir __mocks__/@react-native-firebase/app.js — même raison.
module.exports = {
  getAuth: () => ({ currentUser: null }),
  onAuthStateChanged: (_auth, callback) => {
    callback(null);
    return () => {};
  },
  createUserWithEmailAndPassword: async () => {
    throw new Error('Firebase non disponible en environnement de test.');
  },
  signInWithEmailAndPassword: async () => {
    throw new Error('Firebase non disponible en environnement de test.');
  },
  signOut: async () => {},
  getIdToken: async () => null,
  sendPasswordResetEmail: async () => {},
};
