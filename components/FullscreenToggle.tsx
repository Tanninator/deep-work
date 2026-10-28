"use client";

import { useSyncExternalStore } from "react";

type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void>;
};

type FullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void>;
};

function fullscreenElement() {
  const doc = document as FullscreenDocument;
  return document.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
}

function subscribeFullscreen(onStoreChange: () => void) {
  document.addEventListener("fullscreenchange", onStoreChange);
  document.addEventListener("webkitfullscreenchange", onStoreChange);
  return () => {
    document.removeEventListener("fullscreenchange", onStoreChange);
    document.removeEventListener("webkitfullscreenchange", onStoreChange);
  };
}

function getFullscreenSnapshot() {
  return fullscreenElement() != null;
}

function getServerFullscreenSnapshot() {
  return false;
}

async function toggleFullscreen() {
  const doc = document as FullscreenDocument;
  const root = document.documentElement as FullscreenElement;

  if (fullscreenElement()) {
    if (document.exitFullscreen) {
      await document.exitFullscreen();
    } else {
      await doc.webkitExitFullscreen?.();
    }
    return;
  }

  if (root.requestFullscreen) {
    await root.requestFullscreen({ navigationUI: "hide" });
    return;
  }

  await root.webkitRequestFullscreen?.();
}

type FullscreenToggleProps = {
  className: string;
};

export default function FullscreenToggle({ className }: FullscreenToggleProps) {
  const active = useSyncExternalStore(
    subscribeFullscreen,
    getFullscreenSnapshot,
    getServerFullscreenSnapshot,
  );

  return (
    <button
      type="button"
      className={className}
      aria-pressed={active}
      onClick={() => {
        void toggleFullscreen().catch(() => undefined);
      }}
    >
      {active ? "Exit" : "Full screen"}
    </button>
  );
}
