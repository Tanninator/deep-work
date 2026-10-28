export type Preferences = {
  /** 0–100. Higher is closer to pure white. */
  whiteness: number;
  /** 0–1. Opacity at the top of a full page. The lowest line stays solid. */
  minOpacity: number;
};

export const DEFAULT_PREFERENCES: Preferences = {
  whiteness: 100,
  minOpacity: 0.46,
};

const WHITENESS_KEY = "deep-work:whiteness";
const MIN_OPACITY_KEY = "deep-work:min-opacity";
const PREFS_EVENT = "deep-work:prefs-changed";

const MIN_OPACITY_FLOOR = 0.22;
const MIN_OPACITY_CEILING = 0.8;

let snapshot: Preferences = DEFAULT_PREFERENCES;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function readNumber(key: string, fallback: number) {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export function readPreferences(): Preferences {
  if (typeof window === "undefined") return snapshot;

  const whiteness = clamp(readNumber(WHITENESS_KEY, DEFAULT_PREFERENCES.whiteness), 0, 100);
  const minOpacity = clamp(
    readNumber(MIN_OPACITY_KEY, DEFAULT_PREFERENCES.minOpacity),
    MIN_OPACITY_FLOOR,
    MIN_OPACITY_CEILING,
  );

  if (snapshot.whiteness !== whiteness || snapshot.minOpacity !== minOpacity) {
    snapshot = { whiteness, minOpacity };
  }

  return snapshot;
}

export function writePreferences(next: Preferences) {
  const whiteness = clamp(next.whiteness, 0, 100);
  const minOpacity = clamp(next.minOpacity, MIN_OPACITY_FLOOR, MIN_OPACITY_CEILING);
  snapshot = { whiteness, minOpacity };

  try {
    window.localStorage.setItem(WHITENESS_KEY, String(whiteness));
    window.localStorage.setItem(MIN_OPACITY_KEY, String(minOpacity));
  } catch {
    // Ignore quota / private-mode failures.
  }

  window.dispatchEvent(new Event(PREFS_EVENT));
}

export function subscribePreferences(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(PREFS_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(PREFS_EVENT, onStoreChange);
  };
}

export function getServerPreferences(): Preferences {
  return DEFAULT_PREFERENCES;
}

/** Opaque ink for chrome. Alpha is applied separately on the writing itself. */
export function inkColor(whiteness: number, alpha = 1) {
  const t = clamp(whiteness, 0, 100) / 100;
  const r = Math.round(150 + (255 - 150) * t);
  const g = Math.round(166 + (255 - 166) * t);
  const b = Math.round(174 + (255 - 174) * t);
  const a = Math.round(clamp(alpha, 0, 1) * 1000) / 1000;
  return `rgb(${r} ${g} ${b} / ${a})`;
}

export function textAlpha(fill: number, minOpacity: number) {
  const covered = clamp(fill, 0, 1);
  const floor = clamp(minOpacity, MIN_OPACITY_FLOOR, MIN_OPACITY_CEILING);
  return 1 - covered * (1 - floor);
}

/** Fade is strongest at the top and eases to solid at the lowest line. */
export function fadeMask(fill: number, minOpacity: number) {
  const covered = clamp(fill, 0, 1);
  if (covered <= 0) return "none";

  const top = Math.round(textAlpha(covered, minOpacity) * 1000) / 1000;
  const end = Math.round(Math.min(100, covered * 100) * 10) / 10;
  return `linear-gradient(to bottom, rgb(0 0 0 / ${top}) 0%, #000 ${end}%, #000 100%)`;
}
