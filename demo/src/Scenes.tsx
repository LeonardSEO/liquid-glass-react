import { useState } from "react"
import { LiquidGlass, type LiquidGlassProps } from "./liquid-glass/LiquidGlass"

const params = new URLSearchParams(location.search)
const num = (k: string) => (params.has(k) ? Number(params.get(k)) : undefined)
/** Lets every scene be tuned from the URL: ?thickness=40&blur=2 ... */
export const overrides: Partial<LiquidGlassProps> = Object.fromEntries(
  ["bezel", "thickness", "ior", "refraction", "dispersion", "blur", "saturation", "specular"]
    .filter((k) => params.has(k))
    .map((k) => [k, num(k)]),
)

const Icon = {
  play: <svg width="28" height="28" viewBox="0 0 24 24"><path d="M6 4l15 8-15 8z" fill="currentColor" /></svg>,
  fwd: (
    <svg width="34" height="28" viewBox="0 0 30 24"><path d="M2 4l12 8-12 8zM15 4l12 8-12 8z" fill="currentColor" /></svg>
  ),
  home: (
    <svg width="26" height="26" viewBox="0 0 24 24"><path d="M12 3l9 8h-3v9h-5v-6h-2v6H6v-9H3z" fill="currentColor" /></svg>
  ),
  grid: (
    <svg width="24" height="24" viewBox="0 0 24 24"><rect x="3" y="3" width="8" height="8" rx="2" fill="currentColor" /><rect x="13" y="3" width="8" height="8" rx="2" fill="currentColor" /><rect x="3" y="13" width="8" height="8" rx="2" fill="currentColor" /><rect x="13" y="13" width="8" height="8" rx="2" fill="currentColor" /></svg>
  ),
  radio: (
    <svg width="28" height="24" viewBox="0 0 28 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="14" cy="12" r="2.5" fill="currentColor" /><path d="M9 7a7 7 0 000 10M19 7a7 7 0 010 10M5 4a12 12 0 000 16M23 4a12 12 0 010 16" /></svg>
  ),
  lib: (
    <svg width="24" height="26" viewBox="0 0 24 26"><rect x="3" y="6" width="18" height="18" rx="3" fill="currentColor" /><rect x="5" y="2" width="14" height="2" rx="1" fill="currentColor" /><path d="M10 10v8.5a2 2 0 11-1.5-1.9V11l6-1.5v7a2 2 0 11-1.5-1.9V10.5z" fill="#fff" /></svg>
  ),
  search: (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="10.5" cy="10.5" r="6.5" /><path d="M15.5 15.5L21 21" /></svg>
  ),
}

const albums = [
  ["Late Bloomer", "Tuck Ellis"],
  ["Like A Ribbon", "John Odell"],
  ["What Not to", "Selena V"],
  ["Paper Suns", "Halcyon"],
  ["Night Swim", "Moira"],
  ["Golden Hour", "The Coves"],
  ["Static Bloom", "Ivo"],
  ["Low Tide", "Marlowe"],
]

export function MusicScene() {
  const [tab, setTab] = useState(0)
  const [moving, setMoving] = useState(false)
  const select = (i: number) => {
    if (i === tab) return
    setTab(i)
    setMoving(true)
    window.setTimeout(() => setMoving(false), 320)
  }
  const tabs = [
    [Icon.home, "Home"],
    [Icon.grid, "New"],
    [Icon.radio, "Radio"],
    [Icon.lib, "Library"],
  ] as const
  return (
    <div className="phone">
      <div className="phone__scroll">
        <h1 className="m-h1">Home</h1>
        <h2 className="m-h2">Top Picks for You</h2>
        <div className="m-grid">
          {albums.map(([t, a], i) => (
            <div key={t}>
              <img className="m-art" src={`/img/art${i + 1}.jpg`} alt="" />
              <div className="m-title">{t}</div>
              <div className="m-artist">{a}</div>
            </div>
          ))}
        </div>
        <h2 className="m-h2">Feel Good</h2>
        <div className="m-grid">
          {albums.slice(0, 4).map(([t, a], i) => (
            <div key={t}>
              <img className="m-art" src={`/img/art${8 - i}.jpg`} alt="" />
              <div className="m-title">{t}</div>
              <div className="m-artist">{a}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="m-chrome">
        <LiquidGlass radius={999} interactive className="m-player" {...overrides}>
          <div className="m-player__row">
            <img src="/img/art3.jpg" className="m-player__art" alt="" />
            <div className="m-player__text">
              <b>All Of Me</b>
              <span>Nao</span>
            </div>
            <span className="m-player__btn">{Icon.play}</span>
            <span className="m-player__btn">{Icon.fwd}</span>
          </div>
        </LiquidGlass>

        <div className="m-tabrow">
          <LiquidGlass radius={999} className="m-tabbar" {...overrides}>
            <div className="m-tabs">
              {tabs.map(([icon, label], i) => (
                <button key={label} className={"m-tab" + (i === tab ? " m-tab--on" : "")} onClick={() => select(i)}>
                  {icon}
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </LiquidGlass>
          {/* The selection droplet is a sibling painted over the tab bar, so its
              backdrop includes the bar and its icons - which it magnifies. */}
          <div className="m-dropzone" style={{ "--i": tab } as React.CSSProperties}>
            <div className={"m-drop" + (moving ? " m-drop--moving" : "")}>
              <LiquidGlass radius={999} tint="rgba(255,255,255,0.05)" blur={0} saturation={1.2} className="m-drop__glass" {...overrides} />
            </div>
          </div>
          <LiquidGlass radius={999} interactive className="m-search" {...overrides}>
            <div className="m-search__icon">{Icon.search}</div>
          </LiquidGlass>
        </div>
      </div>
    </div>
  )
}

export function SiriScene() {
  return (
    <div className="siri">
      <LiquidGlass radius={56} className="siri__panel" tint="dark" {...overrides}>
        <p className="siri__text">It'll be fantastic weather for your upcoming tennis lesson this Sunday.</p>
        <div className="siri__card">
          <div>
            <div className="siri__city">San Francisco ➤</div>
            <div className="siri__temp">63°</div>
          </div>
          <div className="siri__right">
            <div className="siri__sun">☀︎</div>
            <div>Sunny</div>
            <div>H:63° L:52°</div>
          </div>
        </div>
      </LiquidGlass>
    </div>
  )
}

export function BannerScene() {
  return (
    <div className="banner">
      <LiquidGlass radius={999} className="banner__title" tint="rgba(255,255,255,0.12)" blur={2}>
        <div className="banner__titlerow">
          <span className="banner__logo">◐</span>
          <span>Liquid Glass</span>
        </div>
      </LiquidGlass>
      <LiquidGlass radius={999} className="banner__sub" tint="dark" blur={6}>
        <div className="banner__subrow">Physically-based refraction for React · no WebGL</div>
      </LiquidGlass>
      <LiquidGlass radius={999} className="banner__orb banner__orb--a" />
      <LiquidGlass radius={999} className="banner__orb banner__orb--b" />
      <LiquidGlass radius={40} className="banner__card" />
    </div>
  )
}
