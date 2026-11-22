// Ergänzt Vitest um die DOM-Prüfungen von jest-dom, z. B. toBeInTheDocument().
// Die Testing Library räumt nach jedem Test selbst auf, weil `globals` in der Vite-Konfiguration aktiv ist.
import '@testing-library/jest-dom/vitest'

// jsdom kennt matchMedia und ResizeObserver nicht, Mantine braucht beides.
window.matchMedia ??= (query: string) =>
  ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }) as MediaQueryList

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// jsdom kennt scrollIntoView nicht, Mantine ruft es beim Öffnen von Auswahllisten auf.
Element.prototype.scrollIntoView ??= () => {}
