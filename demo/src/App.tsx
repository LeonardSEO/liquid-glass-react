import { Suspense, lazy } from "react"
import { Bench } from "./Bench"
import { BannerScene, MusicScene, SiriScene } from "./Scenes"
import { OriginalDemo } from "./original/OriginalDemo"
import { Playground } from "./Playground"
import { params } from "./urlParams"
import { Website } from "./Website"

// Lazy so Tailwind's output only loads on this page.
const UiDemo = lazy(() => import("./UiDemo").then((m) => ({ default: m.UiDemo })))

const scene = params.get("scene")

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
  if (scene === "playground") return <Playground />
  if (scene === "original") return <OriginalDemo />
  return (
    <div className="stage">
      {(scene === "all" || scene === "music") && <MusicScene />}
      {(scene === "all" || scene === "siri") && <SiriScene />}
    </div>
  )
}
