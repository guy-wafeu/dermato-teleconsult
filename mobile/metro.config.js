const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
// maxWorkers réduit volontairement : la machine de build (16 Go RAM, backend +
// tunnel Cloudflare tournant en parallèle pendant les tests) a fait planter par
// OOM les workers de transformation Metro par défaut (un par cœur CPU) pendant
// `assembleRelease`. Un empaquetage un peu plus lent mais fiable est préférable
// à un build qui échoue au hasard selon la charge mémoire du moment.
const config = { maxWorkers: 1 };

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
