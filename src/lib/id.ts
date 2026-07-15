export function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // crypto.randomUUID only exists in secure contexts (https, or localhost) —
  // Safari enforces that more strictly than Chrome, so testing over a LAN IP
  // (e.g. from a phone) hits this fallback there even though Chrome doesn't
  // seem to mind. No cryptographic strength is needed for a local annotation
  // id, so a plain Math.random UUID v4 is a fine substitute.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
