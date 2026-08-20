// @react-native-community/netinfo touche un module natif dès son import — voir
// son propre README, qui recommande ce mock officiel pour les tests unitaires.
jest.mock('@react-native-community/netinfo', () => require('@react-native-community/netinfo/jest/netinfo-mock'));
