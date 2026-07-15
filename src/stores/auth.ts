import { writable, derived } from 'svelte/store';

const SESSION_KEY = 'sonnet-project:edit-password';

function initialPassword(): string | null {
  if (typeof sessionStorage === 'undefined') return null;
  return sessionStorage.getItem(SESSION_KEY);
}

export const editPassword = writable<string | null>(initialPassword());

export const isEditingAllowed = derived(editPassword, ($p) => $p !== null);

export function setEditPassword(pw: string): void {
  sessionStorage.setItem(SESSION_KEY, pw);
  editPassword.set(pw);
}

export function clearEditPassword(): void {
  sessionStorage.removeItem(SESSION_KEY);
  editPassword.set(null);
}
