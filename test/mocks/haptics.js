/**
 * Mock de `expo-haptics`.
 *
 * Aucun moteur haptique n'existe en environnement de test : les appels sont des
 * no-op, ce qui reflète le comportement attendu sur un appareil dépourvu de
 * vibration (et sur l'aperçu web).
 */
module.exports = {
  __esModule: true,
  impactAsync: jest.fn(async () => undefined),
  notificationAsync: jest.fn(async () => undefined),
  selectionAsync: jest.fn(async () => undefined),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy', Rigid: 'rigid', Soft: 'soft' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
};
