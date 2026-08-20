// react-native-screens s'appuie sur des composants natifs Fabric (codegen) que le
// mock par défaut du preset Jest "react-native" ne fournit pas. Sous test, on n'a
// besoin d'aucun comportement natif réel — seulement de composants React basiques
// qui ne cassent pas le rendu de react-navigation.
const React = require('react');
const { View } = require('react-native');

function PassThrough(props) {
  return React.createElement(View, props, props.children);
}

module.exports = {
  enableScreens: () => {},
  enableFreeze: () => {},
  screensEnabled: () => false,
  Screen: PassThrough,
  ScreenContainer: PassThrough,
  ScreenStack: PassThrough,
  ScreenStackHeaderConfig: PassThrough,
  NativeScreen: PassThrough,
  NativeScreenContainer: PassThrough,
};
