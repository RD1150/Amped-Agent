/**
 * useRecentTools — lightweight localStorage-based tracking of recently-used tools.
 *
 * Each tool visit is recorded as { path, label, timestamp }.
 * The hook exposes:
 *   - recentPaths: string[]  — ordered list of recently-visited paths (most recent first)
 *   - recordVisit(path, label): void  — call this when a tool is opened
 */

import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "amped_recent_tools";
const MAX_ENTRIES = 20;

export interface RecentEntry {
  path: string;
  label: string;
  timestamp: number;
}

function readEntries(): RecentEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as RecentEntry[];
  } catch {
    return [];
  }
}

function writeEntries(entries: RecentEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {}
}

export function recordToolVisit(path: string, label: string) {
  const entries = readEntries().filter((e) => e.path !== path);
  entries.unshift({ path, label, timestamp: Date.now() });
  writeEntries(entries.slice(0, MAX_ENTRIES));
  // Dispatch a storage event so other hook instances can sync
  window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
}

export function useRecentTools() {
  const [entries, setEntries] = useState<RecentEntry[]>(readEntries);

  const refresh = useCallback(() => {
    setEntries(readEntries());
  }, []);

  useEffect(() => {
    window.addEventListener("storage", refresh);
    return () => window.removeEventListener("storage", refresh);
  }, [refresh]);

  const recordVisit = useCallback((path: string, label: string) => {
    recordToolVisit(path, label);
    refresh();
  }, [refresh]);

  return { entries, recordVisit };
}
