/**
 * babel-preset-expo DOIT être une devDependency explicite du projet :
 * depuis le SDK 58 (Metro 0.87), il n'est plus résolu implicitement et
 * Metro échoue avec « Cannot read properties of undefined (reading 'transformFile') ».
 *
 * L'ordre des presets compte : jsxImportSource doit pointer vers nativewind
 * pour que `className` soit transformé, puis le preset nativewind/babel.
 * react-native-worklets/plugin est requis par Reanimated 4.
 */
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
    plugins: ['react-native-worklets/plugin'],
  };
};
