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

const params = new URLSearchParams(location.search)

const wallpaper = (name: string) => ({ background: `url(${import.meta.env.BASE_URL}img/${name}.jpg) center / cover fixed` })

const backgrounds = {
  photo: {},
  stripes: { background: "repeating-linear-gradient(45deg, #111 0 14px, #fff 14px 28px)" },
  light: { background: "#f4f4f5" },
  dark: { background: "#0b0b0f" },
}
type Background = keyof typeof backgrounds

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

export function UiDemo() {
  const [background, setBackground] = useState<Background>((params.get("bg") as Background) ?? "photo")
  const [dark, setDark] = useState(params.get("theme") === "dark")

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark)
    return () => document.documentElement.classList.remove("dark")
  }, [dark])

  return (
    <main className="flex min-h-screen flex-col items-start gap-10 p-10 font-sans" style={{ ...(background === "photo" ? wallpaper(dark ? "tahoe-dark" : "tahoe-light") : backgrounds[background]), minHeight: stress ? "400vh" : undefined }}>
      <h1 className="rounded-full bg-(--glass-track) px-4 py-2 text-xl font-semibold text-(--glass-foreground)">Liquid Glass components</h1>
      <section aria-label="Demo settings" className="flex flex-wrap gap-2">
        {(Object.keys(backgrounds) as Background[]).map((name) => (
          <GlassButton key={name} size="sm" aria-pressed={name === background} onClick={() => setBackground(name)}>
            {name}
          </GlassButton>
        ))}
        <GlassButton size="sm" aria-pressed={dark} onClick={() => setDark(!dark)}>
          dark theme
        </GlassButton>
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
