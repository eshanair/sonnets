import { writable } from 'svelte/store';

export const activeTagFilter = writable<string>('All');
