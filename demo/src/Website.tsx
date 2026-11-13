import { useEffect, useState } from "react"
import { LiquidGlass } from "@vepando/liquid-glass-react"
import { MusicScene, SiriScene } from "./Scenes"
import { LensCanvas } from "./GlassLab"
import { GlassTabBar } from "@/registry/glass/glass-tab-bar"
import { GlassSwitch } from "@/registry/glass/glass-switch"
import { GlassSlider } from "@/registry/glass/glass-slider"
import { GlassSegmentedControl } from "@/registry/glass/glass-segmented-control"
import { GlassInput } from "@/registry/glass/glass-input"
import { GlassToolbar, GlassToolbarButton, GlassToolbarSeparator } from "@/registry/glass/glass-toolbar"
import { GlassMenu, GlassMenuContent, GlassMenuItem, GlassMenuSeparator, GlassMenuTrigger } from "@/registry/glass/glass-menu"
import { params } from "./urlParams"
import "./website.css"

const pages = [{ id: "overview", label: "Overview" }, { id: "lab", label: "Glass lab" }, { id: "showcase", label: "Showcase" }]
const repository = "https://github.com/LeonardSEO/liquid-glass-react"
const image = (name: string) => `${import.meta.env.BASE_URL}img/${name}.jpg`

function Gallery() {
  const artworks = [
    { title: "Day", artist: "macOS Tahoe", image: "tahoe-light", position: "center" },
    { title: "Night", artist: "macOS Tahoe", image: "tahoe-dark", position: "center" },
    { title: "Day, detail", artist: "macOS Tahoe", image: "tahoe-light", position: "100% 0%" },
    { title: "Night, detail", artist: "macOS Tahoe", image: "tahoe-dark", position: "100% 100%" },
  ]
  const [index, setIndex] = useState(0)
  const artwork = artworks[index]
  return <section className="gallery-scene" aria-label="Interactive artwork showcase" style={{ backgroundImage: `url(${image(artwork.image)})`, backgroundPosition: artwork.position }}>
    <div className="gallery-heading"><span className="eyebrow">Album player</span><h2>The glass takes<br />on the artwork</h2><p>Change the artwork. Watch the glass take on its colours.</p></div>
    <LiquidGlass radius={40} className="gallery-player glass-bar dark">
      <div className="gallery-cover"><img style={{ objectPosition: artwork.position }} src={image(artwork.image)} alt={`${artwork.title} album artwork`} /><span className="eyebrow">A study in sound and surface</span></div>
      <div className="gallery-track" aria-live="polite"><span>Selected artwork</span><h3>{artwork.title}</h3><p>{artwork.artist}</p></div>
      <div className="gallery-controls"><button type="button" aria-label="Previous artwork" onClick={() => setIndex((index + artworks.length - 1) % artworks.length)}>←</button><span>{String(index + 1).padStart(2, "0")} / 04</span><button type="button" aria-label="Next artwork" onClick={() => setIndex((index + 1) % artworks.length)}>→</button></div>
    </LiquidGlass>
    <div className="gallery-choices" aria-label="Choose artwork">{artworks.map((art, i) => <button type="button" key={art.title} aria-label={`View ${art.title}`} aria-pressed={i === index} onClick={() => setIndex(i)}><img style={{ objectPosition: art.position }} src={image(art.image)} alt="" /></button>)}</div>
  </section>
}

function Overview() {
  return <>
    <section className="site-hero">
      <div className="hero-copy"><span className="eyebrow">Open source, for React</span><h1>Liquid<br />Glass</h1><p>Refracting glass for React interfaces.<br />Install the engine or copy the components as source.</p><a className="solid-link" href="?page=lab">Try it in the glass lab <span aria-hidden="true">↗</span></a></div>
      <LensCanvas hero />
      <div className="hero-footer"><span>MIT licensed, for React 18 and up</span><a href="#material">Explore the material ↓</a></div>
    </section>
    <section id="material" className="material-section">
      <span className="eyebrow">Explore</span><div className="material-intro"><h2>Drag the glass<br />over real content</h2><p>Move glass over type. Slide it across colour. See it frost what’s underneath and pick up the light around it.</p></div>
      <div className="explore-links"><a href="?page=lab"><div><h3>Glass lab</h3><p>Drag three shapes over three backdrops and change style, tint and radius</p></div><b aria-hidden="true">↗</b></a><a href="?page=showcase"><div><h3>Showcase</h3><p>An album player, a music app with a tab bar and a weather panel in glass</p></div><b aria-hidden="true">↗</b></a></div>
    </section>
    <section className="build-section"><div><span className="eyebrow">Install</span><h2>Add it to<br />your React app</h2></div><div className="build-actions"><code>npm install @vepando/liquid-glass-react</code><a href={`${repository}#quick-start`}>Read the documentation ↗</a></div></section>
  </>
}

const darkScheme = typeof window !== "undefined" ? window.matchMedia("(prefers-color-scheme: dark)") : null

/** Follows the system's light or dark appearance. */
function useSystemDark() {
  const [dark, setDark] = useState(() => darkScheme?.matches ?? false)
  useEffect(() => {
    if (!darkScheme) return
    const update = () => setDark(darkScheme.matches)
    darkScheme.addEventListener("change", update)
    return () => darkScheme.removeEventListener("change", update)
  }, [])
  return dark
}

const appearances = [{ value: "light", label: "Light" }, { value: "dark", label: "Dark" }, { value: "auto", label: "Automatic" }]

/** A settings panel that switches its own appearance; the rest of the page stays as it is. */
function SettingsPanel() {
  const rows = [
    { label: "Airplane Mode", on: false },
    { label: "Wi-Fi", on: true },
    { label: "Bluetooth", on: true },
    { label: "Personal Hotspot", on: false },
  ]
  const [appearance, setAppearance] = useState("light")
  const systemDark = useSystemDark()
  const theme = appearance === "auto" ? (systemDark ? "dark" : "light") : appearance
  return <div className="settings-panel" data-theme={theme} role="group" aria-label="Settings"><div className="settings-row settings-appearance"><GlassSegmentedControl aria-label="Appearance" value={appearance} onValueChange={setAppearance} items={appearances} /></div>{rows.map((row) => <div key={row.label} className="settings-row"><span>{row.label}</span><GlassSwitch defaultChecked={row.on} aria-label={row.label} /></div>)}<div className="settings-row settings-slider"><span aria-hidden="true">☼</span><GlassSlider aria-label="Brightness" defaultValue={62} /><span aria-hidden="true">☀</span></div></div>
}

const symbol = (d: string, size = 22) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
const places = ["Lake Tahoe", "Emerald Bay", "Sand Harbor", "Sierra Nevada", "Mount Tallac", "Fallen Leaf Lake", "South Lake", "Carnelian Bay"]

function BrowserScene() {
  const [query, setQuery] = useState("")
  const found = places.filter((place) => place.toLowerCase().includes(query.trim().toLowerCase()))
  return <section className="browser-scene" aria-label="Search field and toolbar on glass" style={{ backgroundImage: `url(${image("tahoe-light")})` }}>
    <div className="browser-search">
      <GlassInput type="search" aria-label="Search places" placeholder="Search places" value={query} onChange={(event) => setQuery(event.target.value)} clearable onClear={() => setQuery("")} icon={symbol("M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4", 18)} trailing={<button type="button" className="browser-mic" aria-label="Dictate">{symbol("M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM5 11a7 7 0 0 0 14 0M12 18v3", 18)}</button>} />
      <ul className="browser-results" aria-live="polite">{found.length ? found.map((place) => <li key={place}>{place}</li>) : <li>No places match “{query.trim()}”</li>}</ul>
    </div>
    <GlassToolbar className="browser-toolbar" aria-label="Browser">
      <GlassToolbarButton aria-label="Back">{symbol("M15 5l-7 7 7 7")}</GlassToolbarButton>
      <GlassToolbarButton aria-label="Forward" disabled>{symbol("M9 5l7 7-7 7")}</GlassToolbarButton>
      <GlassToolbarSeparator />
      <GlassToolbarButton aria-label="Share">{symbol("M12 3v12M8 7l4-4 4 4M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6")}</GlassToolbarButton>
      <GlassToolbarButton aria-label="Bookmarks">{symbol("M6 3h12v18l-6-4-6 4z")}</GlassToolbarButton>
      <GlassMenu>
        <GlassMenuTrigger render={<GlassToolbarButton aria-label="Tabs" />}>{symbol("M8 8h11v11H8zM5 16V5h11")}</GlassMenuTrigger>
        <GlassMenuContent side="top" align="end">
          <GlassMenuItem icon={symbol("M12 5v14M5 12h14", 20)}>New Tab</GlassMenuItem>
          <GlassMenuItem icon={symbol("M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z", 20)}>New Private Tab</GlassMenuItem>
          <GlassMenuItem icon={symbol("M6 3h12v18l-6-4-6 4z", 20)}>Add Bookmark</GlassMenuItem>
          <GlassMenuSeparator />
          <GlassMenuItem destructive icon={symbol("M6 6l12 12M18 6L6 18", 20)}>Close All Tabs</GlassMenuItem>
        </GlassMenuContent>
      </GlassMenu>
    </GlassToolbar>
  </section>
}

function Showcase() {
  return <><header className="page-intro"><span className="eyebrow">Showcase</span><h1>Glass over<br />real interfaces</h1><p>Change the artwork, scroll the music library and drag the tab bar.</p></header><Gallery /><section className="interface-section"><div className="interface-copy"><span className="eyebrow">Tab bar</span><h2>Drag through<br />the music app</h2><p>Scroll inside the phone, then drag the lens across the tabs. It bends what sits beneath it and settles on the nearest tab.</p><a href="?scene=music">Open the standalone demo ↗</a></div><MusicScene /></section><section className="switch-section"><div className="interface-copy"><span className="eyebrow">Switch, slider and segments</span><h2>Toggle, hold<br />and drag</h2><p>Press a switch and its white capsule lifts into clear glass that magnifies the track, then slides across. Drag the brightness slider or the appearance segments and the glass follows your finger.</p><a href="?scene=ui">See all components ↗</a></div><SettingsPanel /></section><section className="interface-section browser-section"><div className="interface-copy"><span className="eyebrow">Search field, toolbar and menu</span><h2>Search and act<br />on glass</h2><p>Type in the search field to filter the places, then clear it. Below, one shared glass capsule holds the toolbar. Its tabs button grows into a menu and shrinks back into the button.</p><a href="?scene=ui">See all components ↗</a></div><BrowserScene /></section><section className="weather-section"><div><span className="eyebrow">Panel</span><h2>Frosted glass<br />over a wallpaper</h2><p>A dark glass panel with a bright forecast card on top.</p><a href="?scene=siri">Open the standalone demo ↗</a></div><SiriScene /></section></>
}

export function Website() {
  const requested = params.get("page") ?? "overview"
  const page = pages.some((item) => item.id === requested) ? requested : "overview"
  return <div className={`website website--${page}`}>
    <a className="skip-link" href="#content">Skip to content</a>
    <header className="site-header"><a className="site-brand" href="?page=overview" aria-label="Liquid Glass home"><span aria-hidden="true">◐</span> <span>Liquid Glass</span></a><GlassTabBar className={`site-navigation${page === "overview" ? " dark" : ""}`} aria-label="Main navigation" value={page} items={pages.map((item) => ({ value: item.id, label: item.label, href: `?page=${item.id}` }))} /><a className="source-link" href={repository}>GitHub <span aria-hidden="true">↗</span></a></header>
    <main id="content">
      {page === "overview" && <Overview />}
      {page === "lab" && <><header className="page-intro page-intro--lab"><span className="eyebrow">Try it</span><h1>The glass lab</h1><p>Pick a backdrop, a style and a tint. Move the shapes and see how the glass adapts.</p></header><section className="lab-workspace" aria-label="Glass playground"><LensCanvas /></section></>}
      {page === "showcase" && <Showcase />}
    </main>
    <footer className="site-footer"><a href="?page=overview">◐ Liquid Glass</a><p>Matched against Apple’s glass in Chromium. Frosted glass in other browsers. <a href="?scene=ui">See the components</a>.</p><a href={repository}>Open source · MIT ↗</a></footer>
  </div>
}
