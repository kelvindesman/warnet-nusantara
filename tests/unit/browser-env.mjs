// Just enough browser globals for js/i18n.js to load under node --test.
// Import this before any js/ module that (indirectly) imports js/i18n.js.
// The UI language defaults to Indonesian (the source strings); set
// globalThis.TEST_LANG = 'en' before importing to load the English dictionary.
globalThis.window ??= {};
globalThis.location ??= { search: `?lang=${globalThis.TEST_LANG || 'id'}`, href: 'http://localhost/' };
globalThis.document ??= { documentElement: {} };
globalThis.localStorage ??= { getItem: () => null, setItem: () => {} };
