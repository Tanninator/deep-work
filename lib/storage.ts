import type { SceneId } from "./scenes";
import { defaultSceneId, scenes } from "./scenes";

const SCENE_KEY = "deep-work:scene";

export function readSceneId(): SceneId {
  if (typeof window === "undefined") return defaultSceneId;
  try {
    const stored = window.localStorage.getItem(SCENE_KEY);
    if (scenes.some((scene) => scene.id === stored)) {
      return stored as SceneId;
    }
  } catch {
    // Ignore.
  }
  return defaultSceneId;
}

export function writeSceneId(id: SceneId): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SCENE_KEY, id);
  } catch {
    // Ignore.
  }
}
