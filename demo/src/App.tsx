import { Suspense, lazy } from "react"
import { Bench } from "./Bench"
import { BannerScene, MusicScene, SiriScene } from "./Scenes"
import { Playground } from "./Playground"
import { Website } from "./Website"

// Lazy so Tailwind's output only loads on this page.
const UiDemo = lazy(() => import("./UiDemo").then((m) => ({ default: m.UiDemo })))

const scene = new URLSearchParams(location.search).get("scene")

export default function App() {
  if (!scene) return <Website />
  if (scene === "ui")
    return (
      <Suspense fallback={null}>
        <UiDemo />
      </Suspense>
    )
  if (scene === "bench") return <Bench />
  if (scene === "banner") return <BannerScene />
  if (scene === "playground" || scene === "original") return <Playground />
  return (
    <div className="stage">
      {(scene === "all" || scene === "music") && <MusicScene />}
      {(scene === "all" || scene === "siri") && <SiriScene />}
    </div>
  )
}
