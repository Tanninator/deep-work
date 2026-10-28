"use client";

import { useEffect, useRef, useState } from "react";
import type { Scene } from "@/lib/scenes";
import styles from "./VideoBackground.module.css";

type VideoBackgroundProps = {
  scene: Scene;
};

export default function VideoBackground({ scene }: VideoBackgroundProps) {
  const videoARef = useRef<HTMLVideoElement>(null);
  const videoBRef = useRef<HTMLVideoElement>(null);
  const activeSlotRef = useRef<"a" | "b">("a");
  const [activeSlot, setActiveSlot] = useState<"a" | "b">("a");
  const [reduceMotion, setReduceMotion] = useState(false);
  const initializedRef = useRef(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (reduceMotion) return;

    const currentSlot = activeSlotRef.current;
    const outgoing =
      currentSlot === "a" ? videoARef.current : videoBRef.current;
    const incoming =
      currentSlot === "a" ? videoBRef.current : videoARef.current;

    if (!initializedRef.current) {
      initializedRef.current = true;
      const primary = videoARef.current;
      if (!primary) return;
      primary.src = scene.src;
      primary.poster = scene.poster;
      void primary.play().catch(() => undefined);
      return;
    }

    if (!incoming || !outgoing) return;
    const currentPath = new URL(
      outgoing.currentSrc || outgoing.src || "about:blank",
      window.location.origin,
    ).pathname;
    if (currentPath === scene.src) return;

    const nextSlot = currentSlot === "a" ? "b" : "a";
    incoming.src = scene.src;
    incoming.poster = scene.poster;
    incoming.load();

    const reveal = () => {
      void incoming.play().catch(() => undefined);
      activeSlotRef.current = nextSlot;
      setActiveSlot(nextSlot);
      window.setTimeout(() => {
        outgoing.pause();
      }, 700);
    };

    if (incoming.readyState >= 2) {
      reveal();
    } else {
      incoming.addEventListener("loadeddata", reveal, { once: true });
    }
  }, [scene, reduceMotion]);

  if (reduceMotion) {
    return (
      <div className={styles.root} aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={styles.poster} src={scene.poster} alt="" />
        <div className={styles.scrim} />
      </div>
    );
  }

  return (
    <div className={styles.root} aria-hidden="true">
      <video
        ref={videoARef}
        className={`${styles.video} ${activeSlot === "a" ? styles.visible : styles.hidden}`}
        muted
        loop
        playsInline
        autoPlay
        preload="auto"
        poster={scene.poster}
      />
      <video
        ref={videoBRef}
        className={`${styles.video} ${activeSlot === "b" ? styles.visible : styles.hidden}`}
        muted
        loop
        playsInline
        preload="auto"
      />
      <div className={styles.scrim} />
    </div>
  );
}
