/**
 * Example: a floating pill-shaped navbar and a round icon button made of
 * Liquid Glass. The component measures itself and generates a
 * displacement map that matches its exact size.
 *
 *   npm install @vepando/liquid-glass-react
 */

import { LiquidGlass } from "@vepando/liquid-glass-react"
import "@vepando/liquid-glass-react/style.css"

export function LiquidGlassPill() {
  return (
    <div className="fixed top-4 inset-x-0 mx-auto z-50 w-full max-w-3xl px-4 flex gap-3">
      <LiquidGlass radius={999} className="h-16 flex-1">
        <nav className="h-full flex items-center justify-between px-6" aria-label="Main navigation">
          <span className="font-semibold">Your Logo</span>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium">
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
            <a href="#about">About</a>
          </div>
          <a href="#cta" className="text-sm font-semibold">
            Get started
          </a>
        </nav>
      </LiquidGlass>

      <LiquidGlass radius={999} interactive className="h-16 w-16 shrink-0" role="button" aria-label="Search">
        <span className="h-full flex items-center justify-center">🔍</span>
      </LiquidGlass>
    </div>
  )
}
