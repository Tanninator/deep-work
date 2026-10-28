"use client";

import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  fadeMask,
  getServerPreferences,
  inkColor,
  readPreferences,
  subscribePreferences,
} from "@/lib/preferences";
import {
  FLUSH_EVENT,
  getServerDocumentBody,
  readDocumentBody,
  rememberDraft,
  subscribeDocuments,
  updateDocument,
} from "@/lib/documents";
import styles from "./Editor.module.css";

const SAVE_DELAY_MS = 1000;

type EditorProps = {
  documentId: string;
};

export default function Editor({ documentId }: EditorProps) {
  const stored = useSyncExternalStore(
    subscribeDocuments,
    () => readDocumentBody(documentId),
    getServerDocumentBody,
  );
  const { whiteness, minOpacity } = useSyncExternalStore(
    subscribePreferences,
    readPreferences,
    getServerPreferences,
  );
  const [local, setLocal] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);
  const pendingRef = useRef<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mirrorRef = useRef<HTMLDivElement>(null);
  const value = local ?? stored;

  useEffect(() => {
    const id = documentId;
    const flush = () => {
      if (pendingRef.current === null) return;
      const text = pendingRef.current;
      pendingRef.current = null;
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      updateDocument(id, text);
    };

    const onHide = () => {
      if (document.visibilityState === "hidden") flush();
    };

    window.addEventListener("pagehide", flush);
    window.addEventListener(FLUSH_EVENT, flush);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.removeEventListener("pagehide", flush);
      window.removeEventListener(FLUSH_EVENT, flush);
      document.removeEventListener("visibilitychange", onHide);
      flush();
    };
  }, [documentId]);

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    const mirror = mirrorRef.current;
    if (!textarea || !mirror) return;

    const apply = () => {
      mirror.style.width = `${textarea.clientWidth}px`;
      const available = textarea.clientHeight;
      const content = value.length === 0 ? 0 : mirror.offsetHeight;
      const fill = available > 0 ? Math.min(1, content / available) : 0;
      const mask = fadeMask(fill, minOpacity);
      textarea.style.color = inkColor(whiteness);
      textarea.style.maskImage = mask;
      textarea.style.webkitMaskImage = mask;
    };

    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(textarea);
    return () => observer.disconnect();
  }, [value, whiteness, minOpacity]);

  function handleChange(next: string) {
    setLocal(next);
    rememberDraft(documentId, next);
    pendingRef.current = next;
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
    }
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      pendingRef.current = null;
      updateDocument(documentId, next);
      setLocal(null);
    }, SAVE_DELAY_MS);
  }

  return (
    <div className={styles.wrap}>
      <label className={styles.visuallyHidden} htmlFor="deep-work-editor">
        Writing surface
      </label>
      <div ref={mirrorRef} className={styles.mirror} aria-hidden="true">
        {value}
        {value.endsWith("\n") ? " " : ""}
      </div>
      <textarea
        ref={textareaRef}
        id="deep-work-editor"
        className={styles.textarea}
        value={value}
        onChange={(event) => handleChange(event.target.value)}
        placeholder="Begin…"
        spellCheck
        autoCapitalize="sentences"
        autoComplete="off"
        autoCorrect="on"
      />
    </div>
  );
}
