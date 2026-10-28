export type SceneId = "kelp" | "cafe";

export type Scene = {
  id: SceneId;
  label: string;
  /** Local placeholder; swap for your own files under public/videos/ anytime. */
  src: string;
  poster: string;
};

/**
 * Background clips in public/videos/:
 * - kelp: Apple Aerial “Kelp” (id 6143116D-03BB-485E-864E-A8CF58ACF6F1)
 * - cafe: https://www.pexels.com/video/video-inside-a-coffee-shop-on-winter-1853441/
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const scenes: Scene[] = [
  {
    id: "kelp",
    label: "Kelp forest",
    src: `${basePath}/videos/kelp.mp4`,
    poster: `${basePath}/videos/kelp-poster.png`,
  },
  {
    id: "cafe",
    label: "Cafe",
    src: `${basePath}/videos/cafe.mp4`,
    poster: `${basePath}/videos/cafe-poster.png`,
  },
];

export const defaultSceneId: SceneId = "kelp";

export function getScene(id: SceneId): Scene {
  return scenes.find((scene) => scene.id === id) ?? scenes[0];
}
