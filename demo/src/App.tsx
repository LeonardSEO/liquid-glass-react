import { BannerScene, MusicScene, SiriScene } from "./Scenes"
import { Playground } from "./Playground"

const scene = new URLSearchParams(location.search).get("scene") ?? "all"

export default function App() {
  if (scene === "banner") return <BannerScene />
  if (scene === "playground" || scene === "original") return <Playground />
  return (
    <div className="stage">
      {(scene === "all" || scene === "music") && <MusicScene />}
      {(scene === "all" || scene === "siri") && <SiriScene />}
    </div>
  )
}
