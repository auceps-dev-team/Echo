import type { ConsentTier } from '../theme/levels';

/**
 * Règles du parcours d'entrée — extraites de l'écran pour être testables.
 *
 * La porte de consentement est bloquante : tant que les trois conditions ne
 * sont pas réunies, aucune session ne peut démarrer. Les sortir du composant
 * évite d'avoir à interroger l'état `disabled` d'un bouton rendu (fragile avec
 * le rendu asynchrone de @testing-library/react-native v14) et garantit que la
 * règle métier est la même côté écran et côté test.
 */

export const MIN_NAME_LENGTH = 2;
export const MAX_NAME_LENGTH = 24;
export const MIN_AGE = 18;

export type OnboardingInput = {
  partnerAName: string;
  partnerBName: string;
  ageConfirmed: boolean;
  consentTier: ConsentTier;
};

export type OnboardingIssue = 'age' | 'name-a' | 'name-b' | 'same-name';

export function validateOnboarding(input: OnboardingInput): OnboardingIssue[] {
  const issues: OnboardingIssue[] = [];
  const a = input.partnerAName.trim();
  const b = input.partnerBName.trim();

  if (!input.ageConfirmed) issues.push('age');
  if (a.length < MIN_NAME_LENGTH || a.length > MAX_NAME_LENGTH) issues.push('name-a');
  if (b.length < MIN_NAME_LENGTH || b.length > MAX_NAME_LENGTH) issues.push('name-b');
  if (a.length >= MIN_NAME_LENGTH && a.toLowerCase() === b.toLowerCase()) issues.push('same-name');

  return issues;
}

export function canStartOnboarding(input: OnboardingInput): boolean {
  return validateOnboarding(input).length === 0;
}

export const ONBOARDING_ISSUE_MESSAGES: Record<OnboardingIssue, string> = {
  age: `Vous devez confirmer que vous avez ${MIN_AGE} ans ou plus.`,
  'name-a': `Le premier prénom doit faire entre ${MIN_NAME_LENGTH} et ${MAX_NAME_LENGTH} caractères.`,
  'name-b': `Le second prénom doit faire entre ${MIN_NAME_LENGTH} et ${MAX_NAME_LENGTH} caractères.`,
  'same-name': 'Les deux prénoms doivent être différents : Echo joue à deux.',
};

export function onboardingErrorMessage(input: OnboardingInput): string | null {
  const issues = validateOnboarding(input);
  if (issues.length === 0) return null;
  return issues.map((issue) => ONBOARDING_ISSUE_MESSAGES[issue]).join(' ');
}
