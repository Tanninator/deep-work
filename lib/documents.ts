export type WorkDocument = {
  id: string;
  body: string;
  createdAt: number;
  updatedAt: number;
};

export const DOCUMENTS_EVENT = "deep-work:documents-changed";
export const FLUSH_EVENT = "deep-work:flush-draft";

const DOCUMENTS_KEY = "deep-work:documents";
const LEGACY_DRAFT_KEY = "deep-work:draft";

const EMPTY_DOCUMENTS: WorkDocument[] = [];

let cachedRaw = "";
let cachedDocuments: WorkDocument[] = EMPTY_DOCUMENTS;
let live: { id: string; body: string } | null = null;

function createId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `doc-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function isDocument(value: unknown): value is WorkDocument {
  if (!value || typeof value !== "object") return false;
  const doc = value as WorkDocument;
  return (
    typeof doc.id === "string" &&
    typeof doc.body === "string" &&
    typeof doc.createdAt === "number" &&
    typeof doc.updatedAt === "number"
  );
}

function notify() {
  window.dispatchEvent(new Event(DOCUMENTS_EVENT));
}

function persist(documents: WorkDocument[]) {
  const sorted = [...documents].sort((a, b) => b.updatedAt - a.updatedAt);
  cachedDocuments = sorted;
  cachedRaw = JSON.stringify(sorted);
  try {
    window.localStorage.setItem(DOCUMENTS_KEY, cachedRaw);
  } catch {
    // Ignore quota / private-mode failures.
  }
  notify();
}

function migrateLegacyDraft() {
  try {
    if (window.localStorage.getItem(DOCUMENTS_KEY) !== null) return;
    const legacy = window.localStorage.getItem(LEGACY_DRAFT_KEY) ?? "";
    const now = Date.now();
    const documents: WorkDocument[] =
      legacy.length > 0
        ? [{ id: createId(), body: legacy, createdAt: now, updatedAt: now }]
        : [];
    cachedDocuments = documents;
    cachedRaw = JSON.stringify(documents);
    window.localStorage.setItem(DOCUMENTS_KEY, cachedRaw);
    window.localStorage.removeItem(LEGACY_DRAFT_KEY);
  } catch {
    // Ignore.
  }
}

export function readDocuments(): WorkDocument[] {
  if (typeof window === "undefined") return cachedDocuments;
  migrateLegacyDraft();
  let raw = "[]";
  try {
    raw = window.localStorage.getItem(DOCUMENTS_KEY) ?? "[]";
  } catch {
    return cachedDocuments;
  }
  if (raw === cachedRaw) return cachedDocuments;
  cachedRaw = raw;
  try {
    const parsed = JSON.parse(raw) as unknown;
    cachedDocuments = Array.isArray(parsed)
      ? parsed.filter(isDocument).sort((a, b) => b.updatedAt - a.updatedAt)
      : [];
  } catch {
    cachedDocuments = [];
  }
  return cachedDocuments;
}

export function getServerDocuments(): WorkDocument[] {
  return EMPTY_DOCUMENTS;
}

export function subscribeDocuments(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(DOCUMENTS_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(DOCUMENTS_EVENT, onStoreChange);
  };
}

export function readDocumentBody(id: string): string {
  return readDocuments().find((doc) => doc.id === id)?.body ?? "";
}

export function getServerDocumentBody(): string {
  return "";
}

export function documentTitle(doc: WorkDocument): string {
  const line = doc.body
    .split("\n")
    .map((part) => part.trim())
    .find(Boolean);
  if (!line) return "Untitled";
  return line.length > 72 ? `${line.slice(0, 72)}…` : line;
}

export function rememberDraft(id: string, body: string) {
  live = { id, body };
}

export function createDocument(): WorkDocument {
  const now = Date.now();
  const doc: WorkDocument = {
    id: createId(),
    body: "",
    createdAt: now,
    updatedAt: now,
  };
  persist([doc, ...readDocuments()]);
  return doc;
}

export function updateDocument(id: string, body: string) {
  if (live?.id === id) live = { id, body };
  const documents = readDocuments();
  const current = documents.find((doc) => doc.id === id);
  if (!current || current.body === body) return;
  persist(
    documents.map((doc) =>
      doc.id === id ? { ...doc, body, updatedAt: Date.now() } : doc,
    ),
  );
}

export function removeDocument(id: string) {
  if (live?.id === id) live = null;
  persist(readDocuments().filter((doc) => doc.id !== id));
}

export function downloadDocument(id: string) {
  const stored = readDocumentBody(id);
  const text = live?.id === id ? live.body : stored;
  updateDocument(id, text);

  const title = documentTitle({
    id,
    body: text,
    createdAt: 0,
    updatedAt: 0,
  });
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  const now = new Date();
  const stamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");

  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${slug || "untitled"}-${stamp}.txt`;
  link.click();
  URL.revokeObjectURL(url);
}

export function formatEdited(updatedAt: number, now = Date.now()): string {
  const minutes = Math.round((now - updatedAt) / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(updatedAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
