// Tiny pure string helpers shared by every module (no DOM).

/** HTML-escape anything before it goes into innerHTML or an attribute. */
export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** Fill `{name}` placeholders from vars (translation strings). */
export const fill = (s, vars) => s.replace(/\{(\w+)\}/g, (m, k) => String(vars[k]));
