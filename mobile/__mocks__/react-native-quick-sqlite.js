// react-native-quick-sqlite s'appuie sur un module natif JSI (voir son
// src/index.ts) qui n'existe pas dans l'environnement Jest/Node — sans ce mock,
// tout import du module (même indirect, via services/offline/db.ts) fait
// planter le rendu de <App /> pendant les tests. Émule juste assez de
// QuickSQLite.execute pour que le moteur de synchro hors ligne ne lève pas
// d'exception ; aucun test ne dépend du contenu réel des lignes retournées.
function emptyResult() {
  return { rowsAffected: 0, rows: { _array: [], length: 0, item: () => undefined } };
}

module.exports = {
  QuickSQLite: {
    open: () => {},
    close: () => {},
    delete: () => {},
    execute: (_dbName, _query, _params) => emptyResult(),
    executeAsync: async (_dbName, _query, _params) => emptyResult(),
    transaction: async () => {},
  },
};
