/**
 * Utilitaire de composition de classes, équivalent local du `cn` de gluestack.
 * Même signature, même comportement : il filtre les valeurs fausses et
 * déduplique les derniers gagnants n'est pas nécessaire ici (NativeWind gère
 * la spécificité), on se contente de concaténer proprement.
 */
export type ClassValue = string | number | null | undefined | false | Record<string, boolean>;

export function cn(...inputs: ClassValue[]): string {
  const out: string[] = [];
  for (const input of inputs) {
    if (!input) continue;
    if (typeof input === 'string' || typeof input === 'number') {
      out.push(String(input));
      continue;
    }
    for (const [key, active] of Object.entries(input)) {
      if (active) out.push(key);
    }
  }
  return out.join(' ');
}
