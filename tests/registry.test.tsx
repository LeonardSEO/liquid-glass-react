import { createRef } from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import { expect, test, vi } from "vitest"
import { GlassButton } from "../registry/glass/glass-button"
import { GlassCard } from "../registry/glass/glass-card"
import { GlassDialog, GlassDialogContent, GlassDialogTitle, GlassDialogTrigger } from "../registry/glass/glass-dialog"
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
  expect(screen.getByRole("button", { name: "Outside" }).className).toContain("glass-clear")
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
  // Without the layers the indicator would have no tint, rim or filter.
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
  expect(dialog.className).toContain("glass-reading")
  expect(screen.getByRole("button", { name: "Inner" }).className).toContain("glass-inset")
})
