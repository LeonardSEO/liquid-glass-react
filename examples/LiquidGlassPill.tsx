/**
 * Example: a floating pill-shaped navbar using the Liquid Glass effect.
 *
 * This is a reference for how to wire `.liquid-glass` up to a real
 * component - copy and adapt the shape/content, not necessarily this
 * exact markup.
 *
 * Don't forget: <LiquidGlassFilter /> must be rendered once elsewhere on
 * the page (e.g. your root layout) for `url(#liquid-lens)` to resolve.
 * See ../components/LiquidGlassFilter.tsx.
 */

import "../components/liquid-glass.css"

export function LiquidGlassPill() {
  return (
    <div className="fixed top-4 inset-x-0 mx-auto z-50 w-full max-w-3xl px-4">
      <nav
        className="liquid-glass relative h-16 rounded-full flex items-center justify-between px-6"
        aria-label="Main navigation"
      >
        <span className="font-semibold">Your Logo</span>

        <div className="hidden md:flex items-center gap-6 text-sm font-medium">
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
          <a href="#about">About</a>
        </div>

        <a
          href="#cta"
          className="inline-flex items-center px-5 h-11 rounded-full text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
        >
          Get started
        </a>
      </nav>
    </div>
  )
}
