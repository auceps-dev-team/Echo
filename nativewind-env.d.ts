/// <reference types="nativewind/types" />

// NativeWind injecte global.css au build ; TypeScript doit accepter cet import
// à effet de bord (TS 6 lève sinon TS2882).
declare module '*.css';
