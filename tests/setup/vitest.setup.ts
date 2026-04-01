import '@testing-library/jest-dom/vitest';

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = ResizeObserverMock as typeof ResizeObserver;
}

if (!globalThis.matchMedia) {
  globalThis.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() {
      return false;
    }
  })) as typeof globalThis.matchMedia;
}

if (!globalThis.requestAnimationFrame) {
  const requestAnimationFrameMock = (callback: FrameRequestCallback) => setTimeout(() => callback(Date.now()), 16);
  globalThis.requestAnimationFrame = requestAnimationFrameMock as unknown as typeof requestAnimationFrame;
}

if (!globalThis.cancelAnimationFrame) {
  const cancelAnimationFrameMock = (handle: number) => clearTimeout(handle);
  globalThis.cancelAnimationFrame = cancelAnimationFrameMock as unknown as typeof cancelAnimationFrame;
}
if (!globalThis.PointerEvent && typeof MouseEvent !== 'undefined') {
  class PointerEventMock extends MouseEvent {}
  globalThis.PointerEvent = PointerEventMock as typeof PointerEvent;
}



