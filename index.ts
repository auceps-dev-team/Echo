import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent appelle AppRegistry.registerComponent('main', () => App)
// et garantit que l'environnement Expo est correctement initialisé, y compris
// pour la cible web (contrairement à un appel direct à AppRegistry).
registerRootComponent(App);
