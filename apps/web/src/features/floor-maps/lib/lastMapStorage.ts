const LAST_MAP_KEY = 'it-inventory:last-floor-map';

// Storage can be unavailable (private mode, blocked site data): remembering the map is best effort.
export const readLastMapId = (): string | null => {
  try {
    return window.localStorage.getItem(LAST_MAP_KEY);
  } catch {
    return null;
  }
};

export const writeLastMapId = (id: string | null): void => {
  try {
    if (id) window.localStorage.setItem(LAST_MAP_KEY, id);
    else window.localStorage.removeItem(LAST_MAP_KEY);
  } catch {
    // Nothing to do: the next visit simply opens the first map.
  }
};
