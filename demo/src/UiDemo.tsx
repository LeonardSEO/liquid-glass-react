import { type ReactNode, useEffect, useState } from "react"
import "./ui-demo.css"
import { GlassButton } from "@/registry/glass/glass-button"
import { GlassCard, GlassCardContent, GlassCardDescription, GlassCardFooter, GlassCardHeader, GlassCardTitle } from "@/registry/glass/glass-card"
import {
  GlassDialog,
  GlassDialogClose,
  GlassDialogContent,
  GlassDialogDescription,
  GlassDialogFooter,
  GlassDialogTitle,
  GlassDialogTrigger,
} from "@/registry/glass/glass-dialog"
import { GlassTabs, GlassTabsList, GlassTabsPanel, GlassTabsTrigger } from "@/registry/glass/glass-tabs"
import { GlassTabBar } from "@/registry/glass/glass-tab-bar"
import { params } from "./urlParams"

type Backdrop = "wallpaper" | "stripes" | "solid"
type Theme = "light" | "dark"

const backdropStyle = (backdrop: Backdrop, theme: Theme) => {
  if (backdrop === "stripes") return { background: "repeating-linear-gradient(45deg, #111 0 14px, #fff 14px 28px)" }
  if (backdrop === "solid") return { background: theme === "dark" ? "#0b0b0f" : "#f4f4f5" }
  return { background: `url(${import.meta.env.BASE_URL}img/tahoe-${theme}.jpg) center / cover fixed` }
}

const darkScheme = window.matchMedia("(prefers-color-scheme: dark)")
const systemTheme = (): Theme => (darkScheme.matches ? "dark" : "light")

const stress = params.has("stress")
const repository = "https://leonardseo.github.io/liquid-glass-react/r"

function Example({ title, item, code, children }: { title: string; item: string; code: string; children: ReactNode }) {
  return (
    <section aria-label={title} className="flex w-full max-w-3xl flex-col items-start gap-4">
      <h2 className="rounded-full bg-(--glass-track) px-3 py-1 text-sm font-semibold text-(--glass-foreground)">{title}</h2>
      {children}
      <pre tabIndex={0} className="w-full overflow-x-auto rounded-2xl bg-(--glass-track) p-4 text-xs leading-relaxed text-(--glass-foreground)">
        <code>{`npx shadcn@latest add ${repository}/${item}.json\n\n${code}`}</code>
      </pre>
    </section>
  )
}

const panelText = "rounded-2xl bg-(--glass-track) p-4 text-sm text-(--glass-foreground)"

const icon = (d: string) => <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d={d} /></svg>
const tabBarItems = [
  { value: "home", label: "Home", icon: icon("M12 3l9 8h-3v9h-5v-6h-2v6H6v-9H3z") },
  { value: "new", label: "New", icon: icon("M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z") },
  { value: "radio", label: "Radio", icon: icon("M12 9a3 3 0 100 6 3 3 0 000-6zM6.3 5.3a9 9 0 000 13.4l1.4-1.4a7 7 0 010-10.6zM17.7 5.3l-1.4 1.4a7 7 0 010 10.6l1.4 1.4a9 9 0 000-13.4z") },
  { value: "library", label: "Library", icon: icon("M5 8h14v13H5zM7 5h10v2H7zM9 2h6v2H9z") },
]

function TabBarDemo() {
  const [tab, setTab] = useState("home")
  return <GlassTabBar aria-label="Sections" items={tabBarItems} value={tab} onValueChange={setTab} />
}

export function UiDemo() {
  const [backdrop, setBackdrop] = useState<Backdrop>((params.get("bg") as Backdrop) ?? "wallpaper")
  const [chosenTheme, setChosenTheme] = useState<Theme | null>(params.get("theme") as Theme | null)
  const [system, setSystem] = useState(systemTheme)
  const theme = chosenTheme ?? system

  useEffect(() => {
    const update = () => setSystem(systemTheme())
    darkScheme.addEventListener("change", update)
    return () => darkScheme.removeEventListener("change", update)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark")
    return () => document.documentElement.classList.remove("dark")
  }, [theme])

  return (
    <main
      className="flex min-h-screen flex-col items-start gap-10 p-10 font-sans"
      style={{ ...backdropStyle(backdrop, theme), minHeight: stress ? "400vh" : undefined }}
    >
      <h1 className="rounded-full bg-(--glass-track) px-4 py-2 text-xl font-semibold text-(--glass-foreground)">Liquid Glass components</h1>
      <section aria-label="Demo settings" className="flex flex-wrap items-center gap-6">
        <div role="group" aria-label="Theme" className="flex gap-2">
          {(["light", "dark"] as const).map((name) => (
            <GlassButton key={name} size="sm" className="capitalize" variant={theme === name ? "primary" : "secondary"} aria-pressed={theme === name} onClick={() => setChosenTheme(name)}>
              {name}
            </GlassButton>
          ))}
        </div>
        <div role="group" aria-label="Backdrop" className="flex gap-2">
          {(["wallpaper", "stripes", "solid"] as const).map((name) => (
            <GlassButton key={name} size="sm" className="capitalize" variant={backdrop === name ? "primary" : "secondary"} aria-pressed={backdrop === name} onClick={() => setBackdrop(name)}>
              {name}
            </GlassButton>
          ))}
        </div>
      </section>

      {stress && (
        <section aria-label="Stress test" className="sticky top-4 flex flex-wrap gap-2">
          {Array.from({ length: 50 }, (_, i) => (
            <GlassButton key={i} size="sm">Button</GlassButton>
          ))}
        </section>
      )}

      <Example title="Button" item="glass-button" code={`<GlassButton variant="primary">Primary</GlassButton>\n<GlassButton loading>Saving</GlassButton>`}>
        <div className="flex flex-wrap items-center gap-3">
          <GlassButton variant="primary" data-sample="primary">Primary</GlassButton>
          <GlassButton data-sample="secondary">Secondary</GlassButton>
          <GlassButton size="icon" aria-label="Add">+</GlassButton>
          <GlassButton loading>Saving</GlassButton>
          <GlassButton disabled>Disabled</GlassButton>
        </div>
      </Example>

      <Example
        title="Tab bar"
        item="glass-tab-bar"
        code={`<GlassTabBar\n  aria-label="Sections"\n  value={tab}\n  onValueChange={setTab}\n  items={[{ value: "home", label: "Home", icon: <Home /> }, ...]}\n/>`}
      >
        <TabBarDemo />
      </Example>

      <Example
        title="Tabs"
        item="glass-tabs"
        code={`<GlassTabs defaultValue="overview">\n  <GlassTabsList>\n    <GlassTabsTrigger value="overview">Overview</GlassTabsTrigger>\n  </GlassTabsList>\n  <GlassTabsPanel value="overview">Everything at a glance.</GlassTabsPanel>\n</GlassTabs>`}
      >
        <GlassTabs defaultValue="overview">
          <GlassTabsList data-sample="track">
            <GlassTabsTrigger value="overview">Overview</GlassTabsTrigger>
            <GlassTabsTrigger value="activity">Activity</GlassTabsTrigger>
            <GlassTabsTrigger value="settings">Settings</GlassTabsTrigger>
          </GlassTabsList>
          <GlassTabsPanel value="overview" className={panelText}>Everything at a glance.</GlassTabsPanel>
          <GlassTabsPanel value="activity" className={panelText}>Recent changes appear here.</GlassTabsPanel>
          <GlassTabsPanel value="settings" className={panelText}>Adjust your preferences.</GlassTabsPanel>
        </GlassTabs>
      </Example>

      <Example
        title="Card"
        item="glass-card"
        code={`<GlassCard>\n  <GlassCardHeader>\n    <GlassCardTitle>Weekly report</GlassCardTitle>\n  </GlassCardHeader>\n  <GlassCardContent>Revenue is up 12%.</GlassCardContent>\n</GlassCard>`}
      >
      <GlassCard className="w-96 max-w-full" data-sample="card">
        <GlassCardHeader>
          <GlassCardTitle>Weekly report</GlassCardTitle>
          <GlassCardDescription>Buttons inside a card become inset glass.</GlassCardDescription>
        </GlassCardHeader>
        <GlassCardContent>
          <p className="text-sm">Revenue is up 12% compared to last week, driven by renewals.</p>
        </GlassCardContent>
        <GlassCardFooter>
          <GlassButton data-sample="inset">Details</GlassButton>
          <GlassButton variant="primary">Share</GlassButton>
        </GlassCardFooter>
      </GlassCard>
      </Example>

      <Example
        title="Dialog"
        item="glass-dialog"
        code={`<GlassDialog>\n  <GlassDialogTrigger render={<GlassButton />}>Open</GlassDialogTrigger>\n  <GlassDialogContent>\n    <GlassDialogTitle>Delete this project?</GlassDialogTitle>\n  </GlassDialogContent>\n</GlassDialog>`}
      >
      <GlassDialog>
        <GlassDialogTrigger render={<GlassButton variant="primary" />}>Open dialog</GlassDialogTrigger>
        <GlassDialogContent data-sample="dialog">
          <GlassDialogTitle>Delete this project?</GlassDialogTitle>
          <GlassDialogDescription>
            The project and its history are removed for everyone on the team. You cannot undo this.
          </GlassDialogDescription>
          <GlassDialogFooter>
            <GlassDialogClose render={<GlassButton />}>Cancel</GlassDialogClose>
            <GlassDialogClose render={<GlassButton variant="primary" />}>Delete</GlassDialogClose>
          </GlassDialogFooter>
        </GlassDialogContent>
      </GlassDialog>
      </Example>
    </main>
  )
}
