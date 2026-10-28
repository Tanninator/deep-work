"use client";

import type { Scene, SceneId } from "@/lib/scenes";
import styles from "./SceneSwitcher.module.css";

type SceneSwitcherProps = {
  scenes: Scene[];
  activeId: SceneId;
  onChange: (id: SceneId) => void;
};

export default function SceneSwitcher({
  scenes,
  activeId,
  onChange,
}: SceneSwitcherProps) {
  return (
    <nav className={styles.nav} aria-label="Background scene">
      {scenes.map((scene, index) => (
        <span key={scene.id} className={styles.item}>
          {index > 0 ? <span className={styles.sep} aria-hidden="true">·</span> : null}
          <button
            type="button"
            className={`${styles.button} ${activeId === scene.id ? styles.active : ""}`}
            onClick={() => onChange(scene.id)}
            aria-pressed={activeId === scene.id}
          >
            {scene.label}
          </button>
        </span>
      ))}
    </nav>
  );
}
