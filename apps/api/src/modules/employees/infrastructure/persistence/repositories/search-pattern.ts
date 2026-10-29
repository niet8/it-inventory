// Accents folded the same way on both sides: here for the search term, with `translate()` in SQL for the column.
export const ACCENTED = 'áàäâãéèëêíìïîóòöôõúùüûñç';
export const UNACCENTED = 'aaaaaeeeeiiiiooooouuuunc';

const ACCENT_MAP = new Map([...ACCENTED].map((char, index) => [char, UNACCENTED[index] ?? char]));

export const foldAccents = (text: string): string =>
  [...text.toLowerCase()].map((char) => ACCENT_MAP.get(char) ?? char).join('');

// `%` and `_` typed by the user must match literally, not act as LIKE wildcards.
export const containsPattern = (term: string): string => `%${foldAccents(term).replace(/[\\%_]/g, '\\$&')}%`;
