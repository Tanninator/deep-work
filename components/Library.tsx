"use client";

import { useState, useSyncExternalStore } from "react";
import {
  documentTitle,
  formatEdited,
  getServerDocuments,
  readDocuments,
  removeDocument,
  subscribeDocuments,
  type WorkDocument,
} from "@/lib/documents";
import styles from "./Library.module.css";

type LibraryProps = {
  onOpen: (id: string) => void;
};

export default function Library({ onOpen }: LibraryProps) {
  const documents = useSyncExternalStore(
    subscribeDocuments,
    readDocuments,
    getServerDocuments,
  );
  const [pendingRemove, setPendingRemove] = useState<string | null>(null);

  function open(id: string) {
    setPendingRemove(null);
    onOpen(id);
  }

  function remove(doc: WorkDocument) {
    if (pendingRemove !== doc.id) {
      setPendingRemove(doc.id);
      return;
    }
    removeDocument(doc.id);
    setPendingRemove(null);
  }

  return (
    <div className={styles.library}>
      {documents.length === 0 ? (
        <p className={styles.empty}>No documents yet.</p>
      ) : (
        <ul className={styles.list}>
          {documents.map((doc) => {
            const title = documentTitle(doc);
            return (
              <li key={doc.id} className={styles.item}>
                <button type="button" className={styles.title} onClick={() => open(doc.id)}>
                  {title}
                </button>
                <time className={styles.time} dateTime={new Date(doc.updatedAt).toISOString()}>
                  {formatEdited(doc.updatedAt)}
                </time>
                <button
                  type="button"
                  className={styles.remove}
                  onClick={() => remove(doc)}
                  aria-label={
                    pendingRemove === doc.id ? `Confirm remove ${title}` : `Remove ${title}`
                  }
                >
                  {pendingRemove === doc.id ? "Confirm" : "Remove"}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
