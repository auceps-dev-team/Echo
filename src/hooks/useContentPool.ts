import { useEffect, useMemo, useState } from 'react';

import { OFFICIAL_CARDS } from '../content';
import type { Card } from '../content/types';
import { getStorage } from '../db';
import type { LevelId } from '../theme/levels';

/**
 * Pool de contenu = contenu officiel Echo + decks créés par le couple.
 *
 * Le moteur traite les deux de façon identique : un deck personnalisé n'est
 * qu'une source de cartes supplémentaire. Les cartes du couple sont relues et
 * revalidées par Zod au chargement, donc un JSON corrompu ne peut pas casser
 * une partie.
 */
export function useContentPool(level?: LevelId): { pool: Card[]; customCount: number; loading: boolean } {
  const [custom, setCustom] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const db = await getStorage();
        const cards = await db.listCustomCards(level);
        if (!cancelled) setCustom(cards);
      } catch {
        if (!cancelled) setCustom([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [level]);

  const pool = useMemo(() => {
    const official = level ? OFFICIAL_CARDS.filter((c) => c.level === level) : OFFICIAL_CARDS;
    const deduped = new Map<string, Card>();
    for (const card of [...official, ...custom]) deduped.set(card.id, card);
    return [...deduped.values()];
  }, [level, custom]);

  return { pool, customCount: custom.length, loading };
}

/** Pool complet, tous niveaux confondus (utile au Studio et aux statistiques). */
export function useFullPool(): Card[] {
  const { pool } = useContentPool();
  return pool;
}
