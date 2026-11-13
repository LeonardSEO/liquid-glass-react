import { afterEach, vi } from "vitest"
import { cleanup } from "@testing-library/react"

// jsdom has no layout, canvas or ImageData. Geometry is covered by
// maps.test.mjs; these tests only care how the component wires the maps up.
vi.mock("../src/maps", () => ({
  buildDisplacementMap: vi.fn((shape: { width: number; height: number }) => ({ data: new Uint8ClampedArray(0), width: shape.width, height: shape.height, scale: 10 })),
  buildSpecularMap: () => ({}),
  buildInteriorMask: () => ({}),
  imageDataToUrl: () => "data:image/png;base64,AA==",
}))

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
vi.stubGlobal("ResizeObserver", ResizeObserverStub)
vi.stubGlobal("matchMedia", () => ({ matches: false }))

// jsdom has no pointer capture.
Element.prototype.setPointerCapture ??= () => {}

Object.defineProperty(HTMLElement.prototype, "offsetWidth", { configurable: true, get: () => 120 })
Object.defineProperty(HTMLElement.prototype, "offsetHeight", { configurable: true, get: () => 48 })
Object.defineProperty(navigator, "userAgent", { configurable: true, get: () => "Mozilla/5.0 Chrome/140.0.0.0 Safari/537.36" })

afterEach(cleanup)
