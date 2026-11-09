export function Background() {
  return (
    <div className="bg">
      <div style={{ position: "relative" }}>
        <h1 className="bigtext">Liquid<br />Glass ✦ 26</h1>
        <p className="para">
          The quick brown fox jumps over the lazy dog. Real glass bends light at its curved rim: lines,
          letters and edges behind the material visibly warp, magnify and pick up a faint colour fringe,
          while the flat centre stays sharp and clear.
        </p>
        <h2 className="bigtext" style={{ fontSize: 90 }}>Hello World 0123456789</h2>
        <p className="para">Scroll the page to move content underneath the glass elements.</p>
      </div>
    </div>
  )
}

export function DemoNav() {
  return (
    <nav style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", color: "var(--wallpaper-ink)" }}>
      <b>Your Logo</b>
      <span>Features · Pricing · About</span>
      <span>Get started</span>
    </nav>
  )
}
