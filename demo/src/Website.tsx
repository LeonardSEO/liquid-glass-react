import { useState } from "react"
import { LiquidGlass } from "@vepando/liquid-glass-react"
import { MusicScene, SiriScene } from "./Scenes"
import { LensCanvas } from "./GlassLab"
import { GlassTabBar } from "@/registry/glass/glass-tab-bar"
import { params } from "./urlParams"
import "./website.css"

const pages = [{ id: "overview", label: "Overview" }, { id: "lab", label: "Glass lab" }, { id: "showcase", label: "Showcase" }, { id: "classic", label: "Classic demo" }]
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
      <div className="explore-links"><a href="?page=lab"><div><h3>Glass lab</h3><p>Drag three shapes over three backdrops and change style, tint and radius</p></div><b aria-hidden="true">↗</b></a><a href="?page=showcase"><div><h3>Showcase</h3><p>An album player, a music app with a tab bar and a weather panel in glass</p></div><b aria-hidden="true">↗</b></a><a href="?page=classic"><div><h3>Classic demo</h3><p>The original Music and Siri scenes</p></div><b aria-hidden="true">↗</b></a></div>
    </section>
    <section className="build-section"><div><span className="eyebrow">Install</span><h2>Add it to<br />your React app</h2></div><div className="build-actions"><code>npm install @vepando/liquid-glass-react</code><a href={`${repository}#quick-start`}>Read the documentation ↗</a></div></section>
  </>
}

function Showcase() {
  return <><header className="page-intro"><span className="eyebrow">Showcase</span><h1>Glass over<br />real interfaces</h1><p>Change the artwork, scroll the music library and drag the tab bar.</p></header><Gallery /><section className="interface-section"><div className="interface-copy"><span className="eyebrow">Tab bar</span><h2>Drag through<br />the music app</h2><p>Scroll inside the phone, then drag the lens across the tabs. It bends what sits beneath it and settles on the nearest tab.</p><a href="?scene=music">Open the standalone demo ↗</a></div><MusicScene /></section><section className="weather-section"><div><span className="eyebrow">Panel</span><h2>Frosted glass<br />over a wallpaper</h2><p>A dark glass panel with a bright forecast card on top.</p><a href="?scene=siri">Open the standalone demo ↗</a></div><SiriScene /></section></>
}

export function Website() {
  const requested = params.get("page") ?? "overview"
  const page = pages.some((item) => item.id === requested) ? requested : "overview"
  return <div className={`website website--${page}`}>
    <a className="skip-link" href="#content">Skip to content</a>
    <header className="site-header"><a className="site-brand" href="?page=overview" aria-label="Liquid Glass home"><span aria-hidden="true">◐</span> <span>Liquid Glass</span></a><GlassTabBar className={`site-navigation${page === "overview" ? " dark" : ""}`} aria-label="Main navigation" value={page} items={pages.map((item) => ({ value: item.id, label: item.label, href: `?page=${item.id}` }))} /><a className="source-link" href={repository}>GitHub <span aria-hidden="true">↗</span></a></header>
    <main id="content">
      {page === "overview" && <Overview />}
      {page === "lab" && <><header className="page-intro page-intro--lab"><span className="eyebrow">Try it</span><h1>The glass lab</h1><p>Pick a backdrop, a style and a tint. Move the shapes and see how the glass adapts.</p></header><section className="lab-workspace" aria-label="Glass playground"><LensCanvas /></section><p className="lab-comparison">Looking for the first experiment? <a href="?scene=original">View the v1 static-map demo ↗</a> or <a href="?scene=playground">open the original playground ↗</a>.</p></>}
      {page === "showcase" && <Showcase />}
      {page === "classic" && <><header className="page-intro"><span className="eyebrow">The original demo</span><h1>The classic demo</h1><p>Music and Siri, side by side. The original standalone scenes are still available.</p><div className="classic-links"><a href="?scene=music">Music ↗</a><a href="?scene=siri">Siri ↗</a><a href="?scene=playground">Playground ↗</a><a href="?scene=original">v1 comparison ↗</a></div></header><div className="stage classic-stage"><MusicScene /><SiriScene /></div></>}
    </main>
    <footer className="site-footer"><a href="?page=overview">◐ Liquid Glass</a><p>Matched against Apple’s glass in Chromium. Frosted glass in other browsers. <a href="?scene=ui">See the components</a>.</p><a href={repository}>Open source · MIT ↗</a></footer>
  </div>
}
