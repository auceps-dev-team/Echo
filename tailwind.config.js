/**
 * Tokens de design Echo.
 *
 * La palette est organisée par NIVEAU D'INTIMITÉ : l'ambiance visuelle se
 * réchauffe et s'assombrit à mesure que l'on progresse (Théorie de la
 * Pénétration Sociale). Ces noms reproduisent volontairement le vocabulaire
 * gluestack (`primary`, `muted`, `card`…) afin qu'une migration ultérieure
 * vers des composants générés par le CLI gluestack reste possible.
 *
 * @type {import('tailwindcss').Config}
 */
module.exports = {
  content: ['./App.tsx', './index.ts', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Socle neutre
        background: '#0B0713',
        surface: '#150E22',
        card: '#1D1430',
        border: '#2E2246',
        muted: '#8B7FA8',
        foreground: '#F5F1FB',

        // Marque
        primary: '#C026D3',
        'primary-soft': '#F0ABFC',
        accent: '#F59E0B',

        // Les 3 ressources de gamification collaborative
        chimie: '#F43F5E',
        confiance: '#38BDF8',
        complicite: '#A78BFA',

        // Ambiances par niveau d'intimité (SPT)
        niveau: {
          connaissance: { DEFAULT: '#7DD3FC', deep: '#0C4A6E', soft: '#E0F2FE' },
          ami: { DEFAULT: '#86EFAC', deep: '#14532D', soft: '#DCFCE7' },
          couple: { DEFAULT: '#FCA5A5', deep: '#7F1D1D', soft: '#FEE2E2' },
          fiance: { DEFAULT: '#C4B5FD', deep: '#2E1065', soft: '#EDE9FE' },
        },
      },
      fontSize: {
        '2xs': ['10px', '14px'],
      },
      borderRadius: {
        xl: '16px',
        '2xl': '22px',
        '3xl': '28px',
      },
    },
  },
  plugins: [],
};
