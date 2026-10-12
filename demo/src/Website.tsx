import { useState } from "react"
import { LiquidGlass } from "@vepando/liquid-glass-react"
import { MusicScene, SiriScene } from "./Scenes"
import { LensCanvas } from "./GlassLab"
import "./website.css"

const pages = [{ id: "overview", label: "Overview" }, { id: "lab", label: "Glass lab" }, { id: "showcase", label: "Showcase" }, { id: "classic", label: "Classic demo" }]
const repository = "https://github.com/LeonardSEO/liquid-glass-react"
const image = (name: string) => `${import.meta.env.BASE_URL}img/${name}.jpg`

function Gallery() {
  const artworks = [
    { title: "Late Bloomer", artist: "Tuck Ellis", image: "art1" },
    { title: "Like A Ribbon", artist: "John Odell", image: "art2" },
    { title: "Paper Suns", artist: "Halcyon", image: "art4" },
    { title: "Night Swim", artist: "Moira", image: "art5" },
  ]
  const [index, setIndex] = useState(0)
  const artwork = artworks[index]
  return <section className="gallery-scene" aria-label="Interactive artwork showcase" style={{ backgroundImage: `url(${image(artwork.image)})` }}>
    <div className="gallery-heading"><span className="eyebrow">01 / THE LISTENING ROOM</span><h2>Artwork first.<br />Interface, lighter.</h2><p>Change the artwork. Watch the glass take on its colours.</p></div>
    <LiquidGlass radius={40} blur={8} tint="dark" className="gallery-player">
      <div className="gallery-cover"><img src={image(artwork.image)} alt={`${artwork.title} album artwork`} /><span className="eyebrow">A STUDY IN SOUND & SURFACE</span></div>
      <div className="gallery-track" aria-live="polite"><span>SELECTED ARTWORK</span><h3>{artwork.title}</h3><p>{artwork.artist}</p></div>
      <div className="gallery-controls"><button type="button" aria-label="Previous artwork" onClick={() => setIndex((index + artworks.length - 1) % artworks.length)}>←</button><span>{String(index + 1).padStart(2, "0")} / 04</span><button type="button" aria-label="Next artwork" onClick={() => setIndex((index + 1) % artworks.length)}>→</button></div>
    </LiquidGlass>
    <div className="gallery-choices" aria-label="Choose artwork">{artworks.map((art, i) => <button type="button" key={art.title} aria-label={`View ${art.title}`} aria-pressed={i === index} onClick={() => setIndex(i)}><img src={image(art.image)} alt="" /></button>)}</div>
  </section>
}

function Overview() {
  return <>
    <section className="site-hero">
      <div className="hero-copy"><span className="eyebrow">AN OPEN-SOURCE MATERIAL FOR REACT</span><h1>Liquid<br /><span>Glass.</span></h1><p>A little less interface.<br />A whole new way to see through it.</p><a className="solid-link" href="?page=lab">Enter the glass lab <span aria-hidden="true">↗</span></a></div>
      <LensCanvas hero />
      <div className="hero-footer"><span>REFRACTION. REFLECTION. A LITTLE PLAY.</span><a href="#material">Explore the material ↓</a></div>
    </section>
    <section id="material" className="material-section">
      <span className="eyebrow">LESS SURFACE. MORE DEPTH.</span><div className="material-intro"><h2>Glass you can<br /><em>get your hands on.</em></h2><p>Move a lens over type. Slide it across colour. See the rim bend what’s underneath, while the centre stays clear.</p></div>
      <div className="explore-links"><a href="?page=lab"><span>01</span><div><h3>Make it move</h3><p>Three shapes, three backdrops. Your own material study.</p></div><b aria-hidden="true">↗</b></a><a href="?page=showcase"><span>02</span><div><h3>See it in context</h3><p>Artwork, floating navigation and glass over everyday interfaces.</p></div><b aria-hidden="true">↗</b></a><a href="?page=classic"><span>03</span><div><h3>The original collection</h3><p>The Music and Siri demos, kept together just as before.</p></div><b aria-hidden="true">↗</b></a></div>
    </section>
    <section className="build-section"><span className="eyebrow">TAKE THE MATERIAL WITH YOU</span><h2>Your next interface,<br />with a different feel.</h2><code>npm install @vepando/liquid-glass-react</code><a href={`${repository}#quick-start`}>Read the documentation ↗</a></section>
  </>
}

function Showcase() {
  return <><header className="page-intro"><span className="eyebrow">THE MATERIAL, IN CONTEXT</span><h1>Small details.<br /><em>A different feeling.</em></h1><p>Explore the artwork, scroll the music library, and switch the glass tabs.</p></header><Gallery /><section className="interface-section"><div className="interface-copy"><span className="eyebrow">02 / FLOATING CONTROLS</span><h2>Above the music.<br />Part of the picture.</h2><p>Scroll inside the phone and switch tabs. The selection droplet follows, bending the interface beneath it.</p><a href="?scene=music">Open the standalone demo ↗</a></div><MusicScene /></section><section className="weather-section"><div><span className="eyebrow">03 / A QUIETER LAYER</span><h2>A view through<br />the conversation.</h2><p>A dark glass panel, a bright forecast, and the colours that tie them together.</p><a href="?scene=siri">Open the standalone demo ↗</a></div><SiriScene /></section></>
}

export function Website() {
  const requested = new URLSearchParams(location.search).get("page") ?? "overview"
  const page = pages.some((item) => item.id === requested) ? requested : "overview"
  return <div className={`website website--${page}`}>
    <a className="skip-link" href="#content">Skip to content</a>
    <header className="site-header"><a className="site-brand" href="?page=overview" aria-label="Liquid Glass home"><span aria-hidden="true">◐</span> <span>Liquid Glass</span></a><LiquidGlass radius={999} blur={10} tint={page === "overview" ? "dark" : "light"} className="site-navigation"><nav aria-label="Main navigation">{pages.map((item) => <a key={item.id} href={`?page=${item.id}`} aria-current={page === item.id ? "page" : undefined}>{item.label}</a>)}</nav></LiquidGlass><a className="source-link" href={repository}>GitHub <span aria-hidden="true">↗</span></a></header>
    <main id="content">
      {page === "overview" && <Overview />}
      {page === "lab" && <><header className="page-intro page-intro--lab"><span className="eyebrow">A HANDS-ON MATERIAL STUDY</span><h1>The glass lab<span className="title-dot">.</span></h1><p>Pick a backdrop. Tune the glass. Move the shapes and see what bends.</p></header><section className="lab-workspace" aria-label="Glass playground"><LensCanvas /></section><p className="lab-comparison">Looking for the first experiment? <a href="?scene=original">View the v1 static-map demo ↗</a> or <a href="?scene=playground">open the original playground ↗</a>.</p></>}
      {page === "showcase" && <Showcase />}
      {page === "classic" && <><header className="page-intro"><span className="eyebrow">THE ORIGINAL DEMO</span><h1>The classic collection.</h1><p>Music and Siri, side by side. The original standalone scenes are still available.</p><div className="classic-links"><a href="?scene=music">Music ↗</a><a href="?scene=siri">Siri ↗</a><a href="?scene=playground">Playground ↗</a><a href="?scene=original">v1 comparison ↗</a></div></header><div className="stage classic-stage"><MusicScene /><SiriScene /></div></>}
    </main>
    <footer className="site-footer"><a href="?page=overview">◐ Liquid Glass</a><p>Full refraction in Chromium. Frosted glass in other browsers.</p><a href={repository}>Open source · MIT ↗</a></footer>
  </div>
}
