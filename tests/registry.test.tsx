import { createRef } from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import { expect, test, vi } from "vitest"
import { GlassButton } from "../registry/glass/glass-button"
import { GlassCard } from "../registry/glass/glass-card"
import { GlassDialog, GlassDialogContent, GlassDialogTitle, GlassDialogTrigger } from "../registry/glass/glass-dialog"
import { GlassTabBar } from "../registry/glass/glass-tab-bar"
import { GlassSwitch } from "../registry/glass/glass-switch"
import { GlassSlider } from "../registry/glass/glass-slider"
import { GlassTabs, GlassTabsList, GlassTabsPanel, GlassTabsTrigger } from "../registry/glass/glass-tabs"

test("GlassButton is a real button whose ref and clicks work", () => {
  const ref = createRef<HTMLElement>()
  const onClick = vi.fn()
  render(<GlassButton ref={ref} onClick={onClick}>Save</GlassButton>)
  const button = screen.getByRole("button", { name: "Save" })
  expect(button.tagName).toBe("BUTTON")
  expect(ref.current).toBe(button)
  expect(button.querySelector("filter")).not.toBeNull()
  fireEvent.click(button)
  expect(onClick).toHaveBeenCalledOnce()
})

test("a loading GlassButton blocks clicks but stays focusable", () => {
  const onClick = vi.fn()
  render(<GlassButton loading onClick={onClick}>Save</GlassButton>)
  const button = screen.getByRole("button", { name: "Save" })
  expect(button.getAttribute("aria-busy")).toBe("true")
  expect((button as HTMLButtonElement).disabled).toBe(false)
  fireEvent.click(button)
  expect(onClick).not.toHaveBeenCalled()
})

test("a disabled GlassButton is natively disabled", () => {
  render(<GlassButton disabled>Save</GlassButton>)
  expect((screen.getByRole("button", { name: "Save" }) as HTMLButtonElement).disabled).toBe(true)
})

test("a button inside a card becomes inset glass, outside it does not", () => {
  render(
    <>
      <GlassButton>Outside</GlassButton>
      <GlassCard>
        <GlassButton>Inside</GlassButton>
      </GlassCard>
    </>,
  )
  expect(screen.getByRole("button", { name: "Outside" }).className).toContain("glass-regular")
  expect(screen.getByRole("button", { name: "Inside" }).className).toContain("glass-inset")
})

test("GlassTabs switches panels and renders the glass indicator", () => {
  render(
    <GlassTabs defaultValue="a">
      <GlassTabsList>
        <GlassTabsTrigger value="a">A</GlassTabsTrigger>
        <GlassTabsTrigger value="b">B</GlassTabsTrigger>
      </GlassTabsList>
      <GlassTabsPanel value="a">first</GlassTabsPanel>
      <GlassTabsPanel value="b">second</GlassTabsPanel>
    </GlassTabs>,
  )
  expect(screen.getByRole("tabpanel").textContent).toBe("first")
  expect(document.querySelector("[role=tablist] .lg .lg__tint")).not.toBeNull()
  expect(document.querySelector("[role=tablist] .lg filter")).not.toBeNull()
  fireEvent.click(screen.getByRole("tab", { name: "B" }))
  expect(screen.getByRole("tabpanel").textContent).toBe("second")
})

test("GlassDialog opens as a labelled dialog with glass and inset children", async () => {
  render(
    <GlassDialog>
      <GlassDialogTrigger>Open</GlassDialogTrigger>
      <GlassDialogContent>
        <GlassDialogTitle>Title</GlassDialogTitle>
        <GlassButton>Inner</GlassButton>
      </GlassDialogContent>
    </GlassDialog>,
  )
  fireEvent.click(screen.getByRole("button", { name: "Open" }))
  const dialog = await screen.findByRole("dialog", { name: "Title" })
  expect(dialog.className).toContain("glass-regular")
  expect(screen.getByRole("button", { name: "Inner" }).className).toContain("glass-inset")
})

const tabBarItems = [
  { value: "home", label: "Home" },
  { value: "radio", label: "Radio" },
  { value: "library", label: "Library" },
]

test("the tab bar exposes one selected tab and moves it with the arrow keys", () => {
  const onValueChange = vi.fn()
  render(<GlassTabBar aria-label="Sections" items={tabBarItems} value="home" onValueChange={onValueChange} />)
  const tabs = screen.getAllByRole("tab")
  expect(tabs).toHaveLength(3)
  expect(tabs[0].getAttribute("aria-selected")).toBe("true")
  tabs[0].focus()
  fireEvent.keyDown(tabs[0], { key: "ArrowRight" })
  expect(onValueChange).toHaveBeenCalledWith("radio")
  expect(screen.getByRole("tab", { name: "Radio" }).getAttribute("aria-selected")).toBe("true")
  expect(document.activeElement).toBe(screen.getByRole("tab", { name: "Radio" }))
})

test("items with an href become a navigation with the current page marked", () => {
  render(<GlassTabBar aria-label="Main" value="b" items={[{ value: "a", label: "A", href: "?a" }, { value: "b", label: "B", href: "?b" }]} />)
  expect(screen.getByRole("navigation", { name: "Main" })).toBeTruthy()
  expect(screen.getByRole("link", { name: "B" }).getAttribute("aria-current")).toBe("page")
  expect(screen.getByRole("link", { name: "A" }).getAttribute("aria-current")).toBeNull()
})

test("the lens is glass beside the bar, not nested in it", () => {
  const { container } = render(<GlassTabBar aria-label="Sections" items={tabBarItems} value="home" />)
  const glass = container.querySelectorAll(".lg")
  expect(glass).toHaveLength(2)
  expect(glass[0].contains(glass[1])).toBe(false)
  expect(glass[0].className).toContain("glass-bar")
})

test("glass components keep the consumer's handlers and style", () => {
  const onPointerDown = vi.fn()
  const { container } = render(<GlassCard onPointerDown={onPointerDown} style={{ width: 77 }}>x</GlassCard>)
  const card = container.firstElementChild as HTMLElement
  fireEvent.pointerDown(card)
  expect(onPointerDown).toHaveBeenCalledOnce()
  expect(card.style.width).toBe("77px")
})


test("GlassSwitch is a switch that toggles from a pointer or the keyboard and submits with a form", () => {
  const onCheckedChange = vi.fn()
  render(
    <form data-testid="form">
      <GlassSwitch aria-label="Wi-Fi" name="wifi" onCheckedChange={onCheckedChange} />
    </form>,
  )
  const control = screen.getByRole("switch", { name: "Wi-Fi" })
  expect(control.getAttribute("aria-checked")).toBe("false")
  expect(control.querySelector(".lg filter")).not.toBeNull()
  fireEvent.pointerDown(control, { pointerId: 1, button: 0 })
  fireEvent.pointerUp(control, { pointerId: 1, button: 0 })
  fireEvent.click(control, { detail: 1 })
  expect(control.getAttribute("aria-checked")).toBe("true")
  expect(onCheckedChange).toHaveBeenLastCalledWith(true)
  expect(new FormData(screen.getByTestId("form") as HTMLFormElement).get("wifi")).toBe("on")
  fireEvent.click(control, { detail: 0 })
  expect(control.getAttribute("aria-checked")).toBe("false")
  expect(onCheckedChange).toHaveBeenCalledTimes(2)
})

test("a controlled GlassSwitch follows its checked prop and a disabled one ignores input", () => {
  const { rerender } = render(<GlassSwitch aria-label="Sync" checked={false} />)
  const control = screen.getByRole("switch", { name: "Sync" })
  fireEvent.click(control, { detail: 0 })
  expect(control.getAttribute("aria-checked")).toBe("false")
  rerender(<GlassSwitch aria-label="Sync" checked />)
  expect(control.getAttribute("aria-checked")).toBe("true")
  rerender(<GlassSwitch aria-label="Sync" checked disabled />)
  expect((control as HTMLButtonElement).disabled).toBe(true)
})

test("GlassSlider is a slider that steps with the keyboard and submits with a form", () => {
  const onValueChange = vi.fn()
  const onValueCommit = vi.fn()
  render(
    <form data-testid="form">
      <GlassSlider aria-label="Volume" name="volume" defaultValue={40} step={10} onValueChange={onValueChange} onValueCommit={onValueCommit} />
    </form>,
  )
  const control = screen.getByRole("slider", { name: "Volume" })
  expect(control.getAttribute("aria-valuenow")).toBe("40")
  expect(control.querySelector(".lg filter")).not.toBeNull()
  fireEvent.keyDown(control, { key: "ArrowRight" })
  expect(control.getAttribute("aria-valuenow")).toBe("50")
  expect(onValueChange).toHaveBeenLastCalledWith(50)
  expect(onValueCommit).toHaveBeenLastCalledWith(50)
  fireEvent.keyDown(control, { key: "End" })
  expect(control.getAttribute("aria-valuenow")).toBe("100")
  fireEvent.keyDown(control, { key: "ArrowRight" })
  expect(onValueChange).toHaveBeenCalledTimes(2)
  expect(new FormData(screen.getByTestId("form") as HTMLFormElement).get("volume")).toBe("100")
})

test("a controlled GlassSlider follows its value and a disabled one ignores keys", () => {
  const { rerender } = render(<GlassSlider aria-label="Speed" value={2} min={0} max={4} />)
  const control = screen.getByRole("slider", { name: "Speed" })
  fireEvent.keyDown(control, { key: "ArrowRight" })
  expect(control.getAttribute("aria-valuenow")).toBe("2")
  rerender(<GlassSlider aria-label="Speed" value={9} min={0} max={4} />)
  expect(control.getAttribute("aria-valuenow")).toBe("4")
  rerender(<GlassSlider aria-label="Speed" value={1} min={0} max={4} disabled />)
  fireEvent.keyDown(control, { key: "ArrowRight" })
  expect(control.getAttribute("aria-valuenow")).toBe("1")
  expect(control.tabIndex).toBe(-1)
})
