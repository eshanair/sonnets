import { writable } from 'svelte/store';

export type Route =
  | { view: 'list' }
  | { view: 'explored' }
  | { view: 'map' }
  | { view: 'sonnet'; number: number }
  | { view: 'search'; query: string };

function parseHash(hash: string): Route {
  const h = hash.replace(/^#\/?/, '');
  const [head, ...rest] = h.split('/');

  switch (head) {
    case '':
    case 'list':
      return { view: 'list' };
    case 'explored':
      return { view: 'explored' };
    case 'map':
      return { view: 'map' };
    case 'sonnet': {
      const n = Number(rest[0]);
      if (Number.isInteger(n) && n >= 1 && n <= 154) return { view: 'sonnet', number: n };
      return { view: 'list' };
    }
    case 'search': {
      const query = decodeURIComponent(rest.join('/') ?? '');
      return { view: 'search', query };
    }
    default:
      return { view: 'list' };
  }
}

function routeToHash(route: Route): string {
  switch (route.view) {
    case 'list':
      return '#/list';
    case 'explored':
      return '#/explored';
    case 'map':
      return '#/map';
    case 'sonnet':
      return `#/sonnet/${route.number}`;
    case 'search':
      return `#/search/${encodeURIComponent(route.query)}`;
  }
}

function initialRoute(): Route {
  return parseHash(typeof window !== 'undefined' ? window.location.hash : '');
}

export const route = writable<Route>(initialRoute());

if (typeof window !== 'undefined') {
  window.addEventListener('hashchange', () => {
    route.set(parseHash(window.location.hash));
  });
}

export function navigate(next: Route): void {
  const hash = routeToHash(next);
  if (window.location.hash !== hash) {
    window.location.hash = hash;
  } else {
    route.set(next);
  }
}
