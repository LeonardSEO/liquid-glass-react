export function Background() {
  return (
    <div className="bg">
      <div className="grid" />
      <div className="blob" style={{ width: 420, height: 420, left: -60, top: 60, background: "#ff9500" }} />
      <div className="blob" style={{ width: 360, height: 360, right: 40, top: 300, background: "#5856d6" }} />
      <div className="blob" style={{ width: 300, height: 300, left: 380, top: 820, background: "#34c759" }} />
      <div style={{ position: "relative" }}>
        <h1 className="bigtext">Liquid<br />Glass ✦ 26</h1>
        <p className="para">
          The quick brown fox jumps over the lazy dog. Real glass bends light at its curved rim: lines,
          letters and edges behind the material visibly warp, magnify and pick up a faint colour fringe,
          while the flat centre stays sharp and clear.
        </p>
        <div className="stripes" />
        <div className="checker" />
        <h2 className="bigtext" style={{ fontSize: 90 }}>Hello World 0123456789</h2>
        <p className="para">Scroll the page to move content underneath the glass elements.</p>
        <div className="stripes" />
        <div className="checker" />
      </div>
    </div>
  )
}
