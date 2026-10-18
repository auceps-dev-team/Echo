const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Rappel d'architecture : expo-sqlite ne peut PAS être bundlé pour la cible web
// en SDK 58 (Metro ne résout pas ./wa-sqlite/wa-sqlite.wasm). La persistance est
// donc découpée par plateforme : src/db/storage.ts (SQLite, natif) et
// src/db/storage.web.ts (localStorage, web). Voir docs/architecture.md §6.
module.exports = withNativeWind(config, { input: './global.css' });
