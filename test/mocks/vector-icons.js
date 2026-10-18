/**
 * Mock de `@expo/vector-icons` pour Jest.
 *
 * Les icônes chargent leur police via expo-font/Asset au montage ; hors runtime
 * Expo l'asset registry est vide et le rendu lève « Module "1" is missing from
 * the asset registry ». On remplace chaque famille par un <Text> affichant le
 * nom de l'icône, ce qui garde les tests lisibles et vérifiables.
 *
 * Ce mock vit dans son propre module : babel-plugin-jest-hoist interdit aux
 * fabriques de `jest.mock()` de référencer des variables hors portée, et le
 * preset NativeWind en injecte dans tout fichier qu'il traverse.
 */
const React = require('react');
const { Text } = require('react-native');

function MockIcon(props) {
  const name = props && props.name ? String(props.name) : '';
  return React.createElement(
    Text,
    { testID: (props && props.testID) || `icon-${name}`, accessibilityLabel: `icone ${name}` },
    name,
  );
}

const FAMILIES = [
  'Ionicons',
  'MaterialIcons',
  'MaterialCommunityIcons',
  'FontAwesome',
  'FontAwesome5',
  'FontAwesome6',
  'Feather',
  'AntDesign',
  'Entypo',
  'EvilIcons',
  'Foundation',
  'Octicons',
  'SimpleLineIcons',
  'Zocial',
  'Fontisto',
];

const mocked = {
  __esModule: true,
  default: MockIcon,
  createIconSet: () => MockIcon,
  createIconSetFromFontello: () => MockIcon,
  createIconSetFromIcoMoon: () => MockIcon,
  getImageSource: jest.fn(async () => ({ uri: '' })),
  getImageSourceSync: jest.fn(() => ({ uri: '' })),
  loadFontAsync: jest.fn(async () => undefined),
  Font: { loadAsync: jest.fn(async () => undefined) },
};

for (const family of FAMILIES) mocked[family] = MockIcon;

module.exports = mocked;
