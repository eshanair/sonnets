import { writable } from 'svelte/store';
import type { ArmedTool, Endpoint } from '../lib/types';

// Ephemeral UI state — never persisted. Tracks which annotation tool is
// currently armed on the detail page, and (for the manual link-a-connection
// path) the pending source endpoint set while the user navigates to another
// sonnet to pick the other end of a connection.
export const armedTool = writable<ArmedTool>({ kind: 'idle' });

export interface PendingLink {
  sourceEndpoint: Endpoint;
  sourceAnnotationId?: string;
}

export const pendingLink = writable<PendingLink | null>(null);

// While the Find Echoes popover is open, previews the source selection as a
// green echo highlight (matching a real connection's look) even though
// nothing's been saved yet — cleared when the popover closes, confirmed or not.
export const echoPreview = writable<Endpoint | null>(null);

export function disarm(): void {
  armedTool.set({ kind: 'idle' });
}
