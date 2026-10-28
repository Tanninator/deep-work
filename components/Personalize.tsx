"use client";

import { useSyncExternalStore } from "react";
import {
  getServerPreferences,
  readPreferences,
  subscribePreferences,
  writePreferences,
} from "@/lib/preferences";
import styles from "./Personalize.module.css";

export default function Personalize() {
  const { whiteness, minOpacity } = useSyncExternalStore(
    subscribePreferences,
    readPreferences,
    getServerPreferences,
  );

  return (
    <div className={styles.bar} role="group" aria-label="Text appearance">
      <label className={styles.control}>
        <span className={styles.label}>White</span>
        <input
          className={styles.slider}
          type="range"
          min={0}
          max={100}
          step={1}
          value={whiteness}
          aria-valuetext={`${whiteness}% white`}
          onChange={(event) =>
            writePreferences({
              whiteness: Number(event.target.value),
              minOpacity,
            })
          }
        />
      </label>
      <label className={styles.control}>
        <span className={styles.label}>Minimum</span>
        <input
          className={styles.slider}
          type="range"
          min={22}
          max={80}
          step={1}
          value={Math.round(minOpacity * 100)}
          aria-valuetext={`${Math.round(minOpacity * 100)}% visibility at the top of a full page`}
          onChange={(event) =>
            writePreferences({
              whiteness,
              minOpacity: Number(event.target.value) / 100,
            })
          }
        />
      </label>
    </div>
  );
}
