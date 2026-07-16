import { get } from 'svelte/store';
import type { SonnetUserData, Tag, UserData } from '../lib/types';
import { DEFAULT_VOLTA_LINE } from '../lib/rhymeStructure';
import { editPassword, clearEditPassword } from './auth';

// Canonical built-in tags — always present in UserData.tags, regardless of
// what's in the saved/remote blob. Locked (see LOCKED_TAGS in lib/types.ts):
// there's no UI to remove or rename these, but older or hand-edited data
// could still lack them, so migrate() below re-adds any that are missing.
const DEFAULT_TAGS: Tag[] = [
  { name: 'Fair Youth', color: '#f2e6a8' },
  { name: 'Dark Lady', color: '#ddc9ee' },
];

// Bumped to v2 to discard accumulated test-session data and start clean
// with the seeded Fair Youth/Dark Lady defaults applied from a blank slate.
const KEY = 'sonnet-project:v2';
const DEBOUNCE_MS = 300;

// Canonical scholarly grouping: Sonnets 1-126 address the "Fair Youth",
// 127-154 the "Dark Lady". Applied as a starting default, not user data — the
// `seededTags` marker keeps these out of the Explored view's annotation
// count until the user actually touches the tag on that sonnet.
function defaultSonnetData(): Record<number, SonnetUserData> {
  const out: Record<number, SonnetUserData> = {};
  for (let n = 1; n <= 154; n++) {
    const tag = n <= 126 ? 'Fair Youth' : 'Dark Lady';
    out[n] = { voltaLine: DEFAULT_VOLTA_LINE, tags: [tag], seededTags: [tag], annotations: [] };
  }
  return out;
}

export function defaultUserData(): UserData {
  return {
    version: 1,
    tags: [...DEFAULT_TAGS],
    customLabels: [],
    sonnetData: defaultSonnetData(),
    connections: [],
  };
}

// Synchronous, localStorage-only — used to seed the store instantly on boot
// (before the remote fetch below resolves) and as the offline fallback if
// the remote is unreachable.
export function loadLocalCache(): UserData | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return migrate(parsed);
  } catch {
    return null;
  }
}

// The shared blob is the actual source of truth once reachable — this is
// what makes edits visible across browsers/devices, not just the one that
// made them. Falls back to the local cache on any failure (offline, plain
// `vite dev` with no functions running, etc.) rather than throwing.
export async function loadRemote(): Promise<UserData | null> {
  try {
    const res = await fetch('/api/data');
    if (!res.ok) return null;
    const parsed = await res.json();
    return migrate(parsed);
  } catch {
    return null;
  }
}

function migrate(raw: unknown): UserData | null {
  if (!raw || typeof raw !== 'object') return null;
  const data = raw as Partial<UserData>;
  if (data.version !== 1) return null;
  if (!data.tags || !data.sonnetData || !data.connections) return null;
  if (!data.customLabels) data.customLabels = [];
  // Re-add any built-in tag missing from saved/remote data (e.g. data
  // predating one of these, or a hand-edited blob) — they're locked and
  // must always exist for their sonnets' tag dots to render.
  for (const t of DEFAULT_TAGS) {
    if (!data.tags.some((existing) => existing.name === t.name)) data.tags = [...data.tags, t];
  }
  // Fill in any sonnet the user hasn't touched yet with the seeded default;
  // any sonnet already present in their saved data is left exactly as-is.
  data.sonnetData = { ...defaultSonnetData(), ...data.sonnetData };
  for (const sd of Object.values(data.sonnetData)) {
    if (!sd.seededTags) sd.seededTags = [];
  }
  return data as UserData;
}

let saveTimer: ReturnType<typeof setTimeout> | undefined;

export function save(data: UserData): void {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    localStorage.setItem(KEY, JSON.stringify(data));

    const pw = get(editPassword);
    if (pw === null) return; // view-only: nothing to sync remotely

    fetch('/api/data', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${pw}` },
      body: JSON.stringify(data),
    }).then((res) => {
      // Password was revoked/changed since login — drop back to view-only
      // instead of silently failing to save on every edit from now on.
      if (res.status === 401) clearEditPassword();
    }).catch(() => {
      // Offline or the functions backend isn't running (e.g. plain `vite
      // dev`) — the localStorage write above already happened, so nothing
      // is lost locally; it just won't be visible to other browsers yet.
    });
  }, DEBOUNCE_MS);
}
