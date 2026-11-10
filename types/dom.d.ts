// Type-checking only (`npm run typecheck`, part of the gate). Never shipped to the browser.
//
// Every element the app looks up is built by its own template literals, so a selector
// always finds the element type we wrote there. Typing each lookup by hand would bury
// the dense one-line style of the code in casts, so DOM lookups return one element type
// that has the members of the HTML elements we actually build.
type WarnetEl = HTMLElement & HTMLInputElement & HTMLAnchorElement & WarnetForms;

// Named controls of our forms: the billing login (u, p) and the portal search box (q).
interface WarnetForms {
  u: HTMLInputElement;
  p: HTMLInputElement;
  q: HTMLInputElement;
}

interface ParentNode {
  querySelector(selectors: string): WarnetEl;
  querySelectorAll(selectors: string): NodeListOf<WarnetEl>;
}

interface Element {
  closest(selectors: string): WarnetEl | null;
}

// Listeners are only attached to elements and the document, and the events they get
// (click, pointer, key, submit) always target an element.
interface EventTarget {
  closest(selectors: string): WarnetEl | null;
}

interface Window {
  webkitAudioContext?: typeof AudioContext; // Safari before 14.1
  goatcounter?: { count?: (v: { path: string; title?: string; event?: boolean }) => void; no_onload?: boolean; [k: string]: unknown };
}

interface Navigator {
  globalPrivacyControl?: boolean;
}

interface Document {
  getElementById(elementId: string): WarnetEl | null;
}

// Events the apps send each other through window.
interface WindowEventMap {
  launch: CustomEvent<string>;
  wallpaper: CustomEvent<string>;
}
