"use client";

import { useState, useSyncExternalStore } from "react";
import Editor from "@/components/Editor";
import Library from "@/components/Library";
import Personalize from "@/components/Personalize";
import SceneSwitcher from "@/components/SceneSwitcher";
import VideoBackground from "@/components/VideoBackground";
import { createDocument, downloadDocument, FLUSH_EVENT } from "@/lib/documents";
import {
  getServerPreferences,
  inkColor,
  readPreferences,
  subscribePreferences,
} from "@/lib/preferences";
import { getScene, scenes, type SceneId } from "@/lib/scenes";
import { readSceneId, writeSceneId } from "@/lib/storage";
import styles from "./page.module.css";

const SCENE_EVENT = "deep-work:scene-changed";

function subscribeScene(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(SCENE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(SCENE_EVENT, onStoreChange);
  };
}

function getSceneSnapshot(): SceneId {
  return readSceneId();
}

function getServerSceneSnapshot(): SceneId {
  return "kelp";
}

export default function DeepWorkPage() {
  const [openId, setOpenId] = useState<string | null>(null);
  const sceneId = useSyncExternalStore(
    subscribeScene,
    getSceneSnapshot,
    getServerSceneSnapshot,
  );

  function handleSceneChange(id: SceneId) {
    writeSceneId(id);
    window.dispatchEvent(new Event(SCENE_EVENT));
  }

  function showLibrary() {
    window.dispatchEvent(new Event(FLUSH_EVENT));
    setOpenId(null);
  }

  function openDocument(id: string) {
    window.dispatchEvent(new Event(FLUSH_EVENT));
    setOpenId(id);
  }

  function createAndOpen() {
    const doc = createDocument();
    setOpenId(doc.id);
  }

  const scene = getScene(sceneId);
  const { whiteness } = useSyncExternalStore(
    subscribePreferences,
    readPreferences,
    getServerPreferences,
  );

  return (
    <div className={styles.shell}>
      <VideoBackground scene={scene} />

      <div
        className={styles.content}
        style={{ ["--ink" as string]: inkColor(whiteness) }}
      >
        <div className={styles.work}>
          <header className={styles.header}>
            <h1 className={styles.brand}>Deep Work</h1>
            <div className={styles.tools}>
              {openId ? (
                <button type="button" className={styles.textButton} onClick={showLibrary}>
                  Documents
                </button>
              ) : (
                <button type="button" className={styles.textButton} onClick={createAndOpen}>
                  New
                </button>
              )}
              {openId ? (
                <button
                  type="button"
                  className={styles.textButton}
                  onClick={() => downloadDocument(openId)}
                >
                  Export
                </button>
              ) : null}
              <SceneSwitcher
                scenes={scenes}
                activeId={sceneId}
                onChange={handleSceneChange}
              />
            </div>
          </header>

          <main className={styles.main}>
            {openId ? (
              <Editor key={openId} documentId={openId} />
            ) : (
              <Library onOpen={openDocument} />
            )}
          </main>

          <Personalize />
        </div>
      </div>
    </div>
  );
}
