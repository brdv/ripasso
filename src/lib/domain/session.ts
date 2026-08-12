import { TENSES } from "./constants";
import { boxOf } from "./srs";
import type {
  Card,
  MenuState,
  Progress,
  ResolvedDirection,
  SessionItem,
  StudySession,
} from "./types";

export function defaultMenuState(): MenuState {
  return {
    dir: "nl_it",
    sessionType: "smart",
    flow: "direct",
    includeVerbs: true,
    includeWords: true,
    tenses: {
      presente: true,
      passato_prossimo: true,
      imperfetto: true,
      futuro_semplice: false,
      condizionale_presente: false,
    },
    count: 15,
  };
}

export function cloneMenuState(menu: MenuState): MenuState {
  const parsedCount = Number.parseInt(String(menu.count), 10) || 15;

  return {
    ...menu,
    tenses: { ...menu.tenses },
    count: Math.min(200, Math.max(1, parsedCount)),
  };
}

export function shuffle<T>(items: T[], rng = Math.random): T[] {
  const copy = items.slice();

  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

export function resolveDirection(menu: MenuState, rng = Math.random): ResolvedDirection {
  if (menu.dir === "mix") return rng() < 0.5 ? "nl_it" : "it_nl";
  return menu.dir;
}

export function buildSessionItems(
  cards: Card[],
  menu: MenuState,
  progress: Progress,
  rng = Math.random,
): SessionItem[] {
  const state = cloneMenuState(menu);
  let selected = cards.filter((card) => {
    if (card.type === "verb") {
      return state.includeVerbs && state.tenses[card.tense];
    }

    return state.includeWords;
  });

  if (state.sessionType === "smart") {
    selected = shuffle(selected, rng).sort((a, b) => {
      const boxDifference = boxOf(progress, a.id) - boxOf(progress, b.id);
      if (boxDifference !== 0) return boxDifference;
      return (progress[a.id]?.last ?? 0) - (progress[b.id]?.last ?? 0);
    });
  } else {
    selected = shuffle(selected, rng);
  }

  return selected.slice(0, state.count).map((card) => ({
    card,
    dir: resolveDirection(state, rng),
  }));
}

export function createSession(menu: MenuState, items: SessionItem[]): StudySession {
  return {
    state: cloneMenuState(menu),
    items,
    idx: 0,
    correct: 0,
    phase: menu.flow === "paper" ? "paper-prompt" : "prompt",
  };
}

export function boxDistribution(items: SessionItem[], progress: Progress): number[] {
  const boxes = [0, 0, 0, 0, 0];

  for (const item of items) {
    boxes[boxOf(progress, item.card.id) - 1] += 1;
  }

  return boxes;
}

export function hasAnyTenseEnabled(menu: MenuState): boolean {
  return TENSES.some((tense) => menu.tenses[tense]);
}
