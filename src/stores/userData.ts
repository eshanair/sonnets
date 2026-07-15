import { writable, derived, get } from 'svelte/store';
import { defaultUserData, loadLocalCache, loadRemote, save } from './persistence';
import { newId } from '../lib/id';
import { DEFAULT_VOLTA_LINE } from '../lib/rhymeStructure';
import type {
  Annotation,
  Connection,
  Endpoint,
  SonnetUserData,
  Tag,
  UserData,
} from '../lib/types';
import { LOCKED_TAGS } from '../lib/types';

// Seed instantly from whatever's cached locally so the page paints without
// waiting on a network round trip, then reconcile with the shared blob once
// it resolves — that's the actual source of truth across browsers/devices.
export const userData = writable<UserData>(loadLocalCache() ?? defaultUserData());

loadRemote().then((remote) => {
  if (remote) userData.set(remote);
});

userData.subscribe((data) => save(data));

function emptySonnetData(): SonnetUserData {
  return { voltaLine: DEFAULT_VOLTA_LINE, tags: [], seededTags: [], annotations: [] };
}

export function getSonnetUserData(data: UserData, sonnet: number): SonnetUserData {
  return data.sonnetData[sonnet] ?? emptySonnetData();
}

export function addCustomLabel(label: string): void {
  userData.update((data) => {
    if (data.customLabels.includes(label)) return data;
    return { ...data, customLabels: [...data.customLabels, label] };
  });
}

export function addTag(tag: Tag): void {
  userData.update((data) => {
    if (data.tags.some((t) => t.name === tag.name)) return data;
    return { ...data, tags: [...data.tags, tag] };
  });
}

export function setVoltaLine(sonnet: number, line: number): void {
  userData.update((data) => {
    const current = getSonnetUserData(data, sonnet);
    return {
      ...data,
      sonnetData: { ...data.sonnetData, [sonnet]: { ...current, voltaLine: line } },
    };
  });
}

export function toggleSonnetTag(sonnet: number, tagName: string): void {
  if (LOCKED_TAGS.includes(tagName)) return;
  userData.update((data) => {
    const current = getSonnetUserData(data, sonnet);
    const has = current.tags.includes(tagName);
    const tags = has ? current.tags.filter((t) => t !== tagName) : [...current.tags, tagName];
    // Any deliberate toggle — on or off — graduates the tag out of the
    // "seeded default" bucket so it starts counting as real engagement.
    const seededTags = current.seededTags.filter((t) => t !== tagName);
    return {
      ...data,
      sonnetData: { ...data.sonnetData, [sonnet]: { ...current, tags, seededTags } },
    };
  });
}

export function addAnnotation(sonnet: number, ann: Omit<Annotation, 'id' | 'createdAt'>): string {
  const id = newId();
  userData.update((data) => {
    const current = getSonnetUserData(data, sonnet);
    const annotation: Annotation = { ...ann, id, createdAt: Date.now() };
    return {
      ...data,
      sonnetData: {
        ...data.sonnetData,
        [sonnet]: { ...current, annotations: [...current.annotations, annotation] },
      },
    };
  });
  return id;
}

export function updateAnnotationText(sonnet: number, id: string, text: string): void {
  userData.update((data) => {
    const current = getSonnetUserData(data, sonnet);
    return {
      ...data,
      sonnetData: {
        ...data.sonnetData,
        [sonnet]: {
          ...current,
          annotations: current.annotations.map((a) => (a.id === id ? { ...a, text } : a)),
        },
      },
    };
  });
}

export function removeAnnotation(sonnet: number, id: string): void {
  userData.update((data) => {
    const current = getSonnetUserData(data, sonnet);
    return {
      ...data,
      sonnetData: {
        ...data.sonnetData,
        [sonnet]: { ...current, annotations: current.annotations.filter((a) => a.id !== id) },
      },
    };
  });
}

export function addConnection(a: Endpoint, b: Endpoint, note?: string): string {
  const id = newId();
  userData.update((data) => {
    const connection: Connection = { id, a, b, note, createdAt: Date.now() };
    return { ...data, connections: [...data.connections, connection] };
  });
  return id;
}

export function removeConnection(id: string): void {
  userData.update((data) => ({
    ...data,
    connections: data.connections.filter((c) => c.id !== id),
  }));
}

export function updateConnectionNote(id: string, note: string): void {
  userData.update((data) => ({
    ...data,
    connections: data.connections.map((c) => (c.id === id ? { ...c, note } : c)),
  }));
}

export function connectionsForSonnet(
  data: UserData,
  sonnet: number,
): Array<{ connection: Connection; self: Endpoint; other: Endpoint }> {
  const result: Array<{ connection: Connection; self: Endpoint; other: Endpoint }> = [];
  for (const c of data.connections) {
    if (c.a.sonnet === sonnet) result.push({ connection: c, self: c.a, other: c.b });
    else if (c.b.sonnet === sonnet) result.push({ connection: c, self: c.b, other: c.a });
  }
  return result;
}

export function annotationCountForSonnet(data: UserData, sonnet: number): number {
  const sd = data.sonnetData[sonnet];
  const notesAndLabels = sd?.annotations.length ?? 0;
  const countedTags = sd?.tags.filter((t) => !sd.seededTags.includes(t)).length ?? 0;
  const connections = connectionsForSonnet(data, sonnet).length;
  return notesAndLabels + countedTags + connections;
}

export const annotationCounts = derived(userData, (data) => {
  const counts: Record<number, number> = {};
  const sonnetNumbers = new Set<number>([
    ...Object.keys(data.sonnetData).map(Number),
    ...data.connections.flatMap((c) => [c.a.sonnet, c.b.sonnet]),
  ]);
  for (const n of sonnetNumbers) counts[n] = annotationCountForSonnet(data, n);
  return counts;
});

export function currentUserData(): UserData {
  return get(userData);
}
