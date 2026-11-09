import { readFileSync } from "node:fs"
import { createRef } from "react"
import { fireEvent, render } from "@testing-library/react"
import { Button } from "@base-ui/react/button"
import { expect, test, vi } from "vitest"
import { buildDisplacementMap } from "../src/maps"
import { LiquidGlass } from "../src/LiquidGlass"
import { useLiquidGlass } from "../src/useLiquidGlass"

test("a forwarded ref reaches the element and leaves measuring intact", () => {
  const ref = createRef<HTMLDivElement>()
  const { container } = render(<LiquidGlass ref={ref}>hi</LiquidGlass>)
  expect(ref.current).toBe(container.firstElementChild)
  expect(container.querySelector("filter")).not.toBeNull()
  expect(container.firstElementChild!.classList.contains("lg--fallback")).toBe(false)
})

test("a numeric radius is the inline radius, as before", () => {
  const { container } = render(<LiquidGlass radius={20}>hi</LiquidGlass>)
  expect((container.firstElementChild as HTMLElement).style.borderRadius).toBe("20px")
})

test("defaults to radius 32 when none is given", () => {
  const { container } = render(<LiquidGlass>hi</LiquidGlass>)
  expect((container.firstElementChild as HTMLElement).style.borderRadius).toBe("32px")
})

test("radius auto leaves border-radius to CSS and reads it", () => {
  render(<LiquidGlass radius="auto" style={{ borderTopLeftRadius: 14 }}>hi</LiquidGlass>)
  expect(vi.mocked(buildDisplacementMap).mock.lastCall![0].radius).toBe(14)
})

test("render swaps the element, keeps refs on both and merges props", () => {
  const outer = createRef<HTMLDivElement>()
  const inner = createRef<HTMLButtonElement>()
  const { getByRole } = render(
    <LiquidGlass ref={outer} className="a" render={<button ref={inner} type="submit" className="b" />}>
      save
    </LiquidGlass>,
  )
  const button = getByRole("button", { name: "save" })
  expect(button.tagName).toBe("BUTTON")
  expect(button.getAttribute("type")).toBe("submit")
  for (const name of ["lg", "a", "b"]) expect(button.classList.contains(name)).toBe(true)
  expect(outer.current).toBe(button)
  expect(inner.current).toBe(button)
  expect(button.querySelector("div")).toBeNull()
})

test("own pointer handlers still run beside the glass handlers", () => {
  const seen: string[] = []
  const { container } = render(
    <LiquidGlass interactive onPointerDown={() => seen.push("down")}>hi</LiquidGlass>,
  )
  const root = container.firstElementChild as HTMLElement
  fireEvent.pointerDown(root)
  expect(seen).toEqual(["down"])
  expect(root.classList.contains("lg--pressed")).toBe(true)
  fireEvent.pointerUp(root)
  expect(root.classList.contains("lg--pressed")).toBe(false)
})

test("the backdrop is inline and CSS can override it through a variable", () => {
  const { container } = render(<LiquidGlass blur={5}>hi</LiquidGlass>)
  const root = container.firstElementChild as HTMLElement
  expect(root.getAttribute("style")).toMatch(/backdrop-filter: var\(--lg-backdrop-override, .*url\(#lg-/)
  expect(root.style.getPropertyValue("--lg-blur")).toBe("5px")
})

test("the hook composes with a Base UI Button", () => {
  function GlassButton({ children }: { children: string }) {
    const glass = useLiquidGlass({ radius: 12 })
    return (
      <Button ref={glass.ref} {...glass.rootProps}>
        {glass.wrap(children)}
      </Button>
    )
  }
  const { getByRole, container } = render(<GlassButton>ok</GlassButton>)
  expect(getByRole("button", { name: "ok" }).tagName).toBe("BUTTON")
  expect(container.querySelector("filter")).not.toBeNull()
})

test("no stylesheet declares backdrop-filter, which minifiers would break", () => {
  for (const file of ["src/liquid-glass.css", "registry/glass/glass-tokens.css"]) {
    const css = readFileSync(file, "utf8").replace(/\/\*[\s\S]*?\*\//g, "")
    expect(css).not.toMatch(/backdrop-filter\s*:/)
  }
})

test("a variant chooses its look, its colour splitting and yields to explicit options", () => {
  const channels = (root: Element) => root.querySelectorAll("feDisplacementMap").length
  const { container, rerender } = render(<LiquidGlass>hi</LiquidGlass>)
  const root = () => container.firstElementChild!
  expect(root().classList.contains("lg--regular")).toBe(true)
  expect(channels(root())).toBe(1)
  rerender(<LiquidGlass variant="clear">hi</LiquidGlass>)
  expect(root().classList.contains("lg--clear")).toBe(true)
  expect(channels(root())).toBe(3)
  rerender(<LiquidGlass variant="clear" dispersion={0}>hi</LiquidGlass>)
  expect(channels(root())).toBe(1)
})

test("the identity variant renders no glass", () => {
  const { container } = render(<LiquidGlass variant="identity">hi</LiquidGlass>)
  const root = container.firstElementChild!
  expect(root.classList.contains("lg--identity")).toBe(true)
  expect(root.querySelector("filter")).toBeNull()
  expect(root.textContent).toBe("hi")
})
