import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import Button from '../components/ui/Button';
import { CardShell, EmptyState, ScreenTitle, SectionTitle } from '../components/ui/CardShell';
import Screen from '../components/ui/Screen';
import TagToggle from '../components/ui/TagToggle';
import { cn } from '../components/ui/cn';
import { KIND_LABELS, SENSITIVITY_LABELS, TRIGGER_LABELS, TRIGGER_ORDER } from '../content/labels';
import type { Card, CardKind, TriggerCategory } from '../content/types';
import { parseCard } from '../content/types';
import { getStorage } from '../db';
import { LEVEL_ORDER, getLevel, type LevelId } from '../theme/levels';
import { useCoupleStore } from '../state/coupleStore';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Studio'>;

/**
 * Studio — éditeur de questionnaires.
 *
 * C'est le principal levier de fidélisation : le couple construit son propre
 * univers de questions. Toute carte saisie passe par la validation Zod du
 * moteur, donc le contenu personnalisé est soumis aux EXACTES mêmes règles de
 * sécurité (sensibilité, déclencheurs) que le contenu officiel.
 *
 * État du socle : création de deck + ajout de cartes validés et persistés.
 * Les améliorations prévues (duplication d'une carte officielle vers un niveau
 * supérieur, deck événementiel « Anniversaire » avec badge exclusif) sont
 * outillées côté modèle mais pas encore câblées côté écran.
 */
export default function StudioScreen({ navigation, route }: Props) {
  const initialLevel = route.params?.level ?? 'couple';

  const [deckName, setDeckName] = useState('');
  const [occasion, setOccasion] = useState('');
  const [level, setLevel] = useState<LevelId>(initialLevel);
  const [cards, setCards] = useState<Card[]>([]);

  const [text, setText] = useState('');
  const [kind, setKind] = useState<CardKind>('verite');
  const [sensitivity, setSensitivity] = useState<0 | 1 | 2 | 3>(1);
  const [reciprocal, setReciprocal] = useState(true);
  const [triggers, setTriggers] = useState<TriggerCategory[]>([]);
  const [oui, setOui] = useState('');
  const [non, setNon] = useState('');
  const [issues, setIssues] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const countDeck = useCoupleStore((s) => s.countDeck);
  const levelDef = getLevel(level);

  const draftCount = cards.length;
  const canSave = useMemo(() => deckName.trim().length >= 2 && draftCount > 0, [deckName, draftCount]);

  function resetForm() {
    setText('');
    setKind('verite');
    setSensitivity(1);
    setReciprocal(true);
    setTriggers([]);
    setOui('');
    setNon('');
    setIssues([]);
  }

  function addCard() {
    const result = parseCard({
      id: `u_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      level,
      kind,
      text: text.trim(),
      sensitivity,
      tags: ['personnalise'],
      triggerWarnings: triggers,
      reciprocal,
      origin: 'couple',
      ...(kind === 'binaire'
        ? { binaryOptions: { oui: oui.trim() || 'Oui', non: non.trim() || 'Non' } }
        : {}),
    });

    if (!result.ok) {
      setIssues(result.issues);
      return;
    }
    setIssues([]);
    setCards((prev) => [...prev, result.card]);
    resetForm();
  }

  async function saveDeck() {
    if (!canSave) {
      setIssues(['Donnez un nom au deck (2 caractères minimum) et ajoutez au moins une carte.']);
      return;
    }
    setSaving(true);
    try {
      const db = await getStorage();
      await db.insertDeck({
        id: `deck_${Date.now().toString(36)}`,
        name: deckName.trim(),
        level,
        occasion: occasion.trim() || undefined,
        cards,
        createdAt: new Date().toISOString(),
      });
      countDeck(cards.length);
      navigation.goBack();
    } catch (e) {
      setIssues([e instanceof Error ? e.message : "L'enregistrement du deck a échoué."]);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen testID="screen-studio">
      <View className="flex-row items-center gap-3 pt-2">
        <Pressable accessibilityRole="button" accessibilityLabel="Retour" onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color="#8B7FA8" />
        </Pressable>
        <Text className="flex-1 text-2xl font-extrabold text-foreground">Studio</Text>
      </View>

      <ScreenTitle
        title="Créer votre deck"
        subtitle="Vos questions obéissent aux mêmes règles que celles d’Echo : sensibilité déclarée, sujets sensibles signalés."
      />

      <CardShell>
        <SectionTitle>Informations du deck</SectionTitle>
        <View className="mt-3 gap-2">
          <TextInput
            value={deckName}
            onChangeText={setDeckName}
            placeholder="Nom du deck (ex. « Notre anniversaire »)"
            placeholderTextColor="#8B7FA8"
            maxLength={60}
            className="rounded-xl border border-border bg-white/5 px-4 py-3 text-base text-foreground"
          />
          <TextInput
            value={occasion}
            onChangeText={setOccasion}
            placeholder="Occasion (optionnel)"
            placeholderTextColor="#8B7FA8"
            maxLength={40}
            className="rounded-xl border border-border bg-white/5 px-4 py-3 text-base text-foreground"
          />
          <View className="mt-1 flex-row flex-wrap gap-2">
            {LEVEL_ORDER.map((id) => {
              const active = id === level;
              const def = getLevel(id);
              return (
                <Pressable
                  key={id}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  onPress={() => setLevel(id)}
                  className={cn('rounded-full border px-3 py-1.5', active ? 'border-primary' : 'border-border')}
                  style={active ? { backgroundColor: `${def.palette.hex}22` } : undefined}
                >
                  <Text className="text-2xs font-bold uppercase tracking-wider" style={{ color: active ? def.palette.hex : '#8B7FA8' }}>
                    {def.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </CardShell>

      <CardShell className="gap-3">
        <SectionTitle>Nouvelle carte — niveau {levelDef.label}</SectionTitle>

        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Écrivez votre question ou votre action…"
          placeholderTextColor="#8B7FA8"
          maxLength={280}
          multiline
          className="min-h-24 rounded-xl border border-border bg-white/5 px-4 py-3 text-base leading-6 text-foreground"
        />
        <Text className="text-right text-2xs text-muted">{text.length}/280</Text>

        <View className="flex-row gap-2">
          {(Object.keys(KIND_LABELS) as CardKind[]).map((k) => {
            const active = k === kind;
            return (
              <Pressable
                key={k}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                onPress={() => setKind(k)}
                className={cn('flex-1 rounded-lg border px-3 py-2', active ? 'border-primary bg-primary/15' : 'border-border bg-white/5')}
              >
                <Text className={cn('text-center text-2xs font-bold uppercase tracking-wider', active ? 'text-primary-soft' : 'text-muted')}>
                  {KIND_LABELS[k]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {kind === 'binaire' ? (
          <View className="gap-2">
            <TextInput
              value={oui}
              onChangeText={setOui}
              placeholder="Libellé du OUI"
              placeholderTextColor="#8B7FA8"
              className="rounded-xl border border-border bg-white/5 px-4 py-2.5 text-sm text-foreground"
            />
            <TextInput
              value={non}
              onChangeText={setNon}
              placeholder="Libellé du NON"
              placeholderTextColor="#8B7FA8"
              className="rounded-xl border border-border bg-white/5 px-4 py-2.5 text-sm text-foreground"
            />
          </View>
        ) : null}

        <View>
          <Text className="mb-2 text-2xs uppercase tracking-[2px] text-muted">Sensibilité</Text>
          <View className="flex-row gap-2">
            {([0, 1, 2, 3] as const).map((value) => {
              const active = value === sensitivity;
              return (
                <Pressable
                  key={value}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  onPress={() => setSensitivity(value)}
                  className={cn('flex-1 rounded-lg border px-2 py-2', active ? 'border-primary bg-primary/15' : 'border-border bg-white/5')}
                >
                  <Text className={cn('text-center text-2xs font-bold', active ? 'text-primary-soft' : 'text-muted')}>
                    {value} · {SENSITIVITY_LABELS[value]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <TagToggle
          label="Carte réciproque"
          description="Les deux partenaires doivent répondre."
          active={reciprocal}
          onToggle={() => setReciprocal((v) => !v)}
        />

        {sensitivity >= 2 ? (
          <View>
            <Text className="mb-2 text-2xs uppercase tracking-[2px] text-muted">
              Sujets sensibles concernés (obligatoire à partir du niveau 2)
            </Text>
            <View className="gap-2">
              {TRIGGER_ORDER.map((trigger) => (
                <TagToggle
                  key={trigger}
                  label={TRIGGER_LABELS[trigger].label}
                  active={triggers.includes(trigger)}
                  onToggle={() =>
                    setTriggers((prev) =>
                      prev.includes(trigger) ? prev.filter((t) => t !== trigger) : [...prev, trigger],
                    )
                  }
                />
              ))}
            </View>
          </View>
        ) : null}

        {issues.length > 0 ? (
          <View className="gap-1 rounded-xl border border-chimie/40 bg-chimie/10 px-3 py-2">
            {issues.map((issue) => (
              <Text key={issue} className="text-2xs leading-4 text-chimie">
                • {issue}
              </Text>
            ))}
          </View>
        ) : null}

        <Button fullWidth onPress={addCard} icon={<Ionicons name="add" size={18} color="#F5F1FB" />} testID="add-card">
          Ajouter au deck
        </Button>
      </CardShell>

      <CardShell>
        <SectionTitle>Cartes du deck ({draftCount})</SectionTitle>
        {cards.length === 0 ? (
          <View className="mt-3">
            <EmptyState
              icon={<Ionicons name="create-outline" size={22} color="#8B7FA8" />}
              title="Deck vide"
              hint="Ajoutez votre première carte : elle apparaîtra ici, avec son niveau de sensibilité."
            />
          </View>
        ) : (
          <View className="mt-3 gap-2">
            {cards.map((card) => (
              <View key={card.id} className="flex-row items-start gap-2 rounded-xl bg-white/5 px-3 py-2">
                <Ionicons name="ellipse" size={7} color={levelDef.palette.hex} style={{ marginTop: 6 }} />
                <View className="flex-1 gap-0.5">
                  <Text className="text-sm leading-5 text-foreground">{card.text}</Text>
                  <Text className="text-2xs uppercase tracking-wider text-muted">
                    {KIND_LABELS[card.kind]} · {SENSITIVITY_LABELS[card.sensitivity]}
                    {card.reciprocal ? ' · réciproque' : ''}
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Retirer la carte"
                  onPress={() => setCards((prev) => prev.filter((c) => c.id !== card.id))}
                  hitSlop={8}
                >
                  <Ionicons name="trash-outline" size={15} color="#8B7FA8" />
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </CardShell>

      <Button size="lg" fullWidth loading={saving} disabled={!canSave} onPress={() => void saveDeck()} testID="save-deck">
        Enregistrer le deck
      </Button>
      <Text className="text-center text-2xs leading-4 text-muted">
        Enregistrer un deck débloque le badge « Créateurs de contenu » sur votre profil couple.
      </Text>
    </Screen>
  );
}
