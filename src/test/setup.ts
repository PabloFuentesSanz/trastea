import "@testing-library/jest-dom/vitest";

/**
 * jsdom no trae ResizeObserver y los componentes de Radix que miden
 * (el slider, por ejemplo) lo necesitan al montarse. No se está simulando
 * ningún comportamiento: solo se evita que el montaje reviente.
 */
if (!("ResizeObserver" in globalThis)) {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}
