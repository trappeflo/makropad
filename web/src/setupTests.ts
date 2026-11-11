// Ergänzt Vitest um die DOM-Prüfungen von jest-dom, z. B. toBeInTheDocument().
// Die Testing Library räumt nach jedem Test selbst auf, weil `globals` in der Vite-Konfiguration aktiv ist.
import '@testing-library/jest-dom/vitest'
