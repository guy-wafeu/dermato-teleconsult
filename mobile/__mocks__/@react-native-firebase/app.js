// @react-native-firebase charge un SDK web (ESM) en repli quand il ne détecte pas
// l'environnement natif, ce qui casse Jest (qui n'est ni le natif ni un vrai
// bundler ESM). Sous test, aucun écran ne doit réellement appeler Firebase — ce
// mock fournit juste assez de surface pour que l'import ne plante pas.
module.exports = {
  getApp: () => ({ name: '[DEFAULT]' }),
};
