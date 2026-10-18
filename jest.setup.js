/**
 * Configuration de l'environnement Jest (`setupFilesAfterEnv`).
 *
 * Les fabriques de mock sont déportées dans `test/mocks/*` : babel-plugin-jest-hoist
 * refuse toute variable hors portée dans `jest.mock()`, or le preset NativeWind
 * en injecte (`_ReactNativeCSSInterop`) dans chaque fichier qu'il traverse.
 * Ne référencer que `require` contourne proprement la restriction.
 */

jest.mock('@expo/vector-icons', () => require('./test/mocks/vector-icons'));
jest.mock('expo-haptics', () => require('./test/mocks/haptics'));
