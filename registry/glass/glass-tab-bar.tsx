"use client"

import { type CSSProperties, type KeyboardEvent, type MouseEvent, type ReactNode, useEffect, useRef, useState } from "react"
import { useLensTrack } from "@/registry/glass/glass-lens-track"
import { type GlassMaterial, useGlassSurface } from "@/registry/glass/glass-material"

export type GlassTabBarItem = {
  value: string
  label: ReactNode
  icon?: ReactNode
  /** Renders a link and navigates to it once the glass has settled. */
  href?: string
}

export type GlassTabBarProps = {
  items: GlassTabBarItem[]
  value: string
  onValueChange?: (value: string) => void
  material?: GlassMaterial
  className?: string
  style?: CSSProperties
  "aria-label": string
}

const PAD = 4

function ItemContent({ item }: { item: GlassTabBarItem }) {
  return (
    <>
      {item.icon}
      <span>{item.label}</span>
    </>
  )
}

/**
 * A tab bar in the style of iOS: a quiet pill at rest, and a magnifying lens
 * that rises out of the bar while it is touched or travelling. Labels under
 * the lens switch to the accent colour.
 */
export function GlassTabBar({ items, value, onValueChange, material = "bar", className, style, "aria-label": ariaLabel }: GlassTabBarProps) {
  const bar = useGlassSurface<HTMLDivElement>({ material })
  const [current, setCurrent] = useState(value)
  const pendingHref = useRef<string | undefined>(undefined)

  const count = items.length
  const activeIndex = Math.max(0, items.findIndex((item) => item.value === current))

  const select = (index: number, navigate: boolean) => {
    const item = items[index]
    if (item.value === current) return
    setCurrent(item.value)
    onValueChange?.(item.value)
    if (navigate) pendingHref.current = item.href
  }

  const track = useLensTrack({
    count,
    activeIndex,
    pad: PAD,
    onPick: (index) => select(index, true),
    onSettle: () => {
      const href = pendingHref.current
      pendingHref.current = undefined
      if (href) window.location.assign(href)
    },
  })

  // Only an outside change of `value` moves the selection; the glass follows it.
  useEffect(() => {
    setCurrent(value)
  }, [value])

  // A real pointer was handled by the track and navigates once the glass has
  // settled. Keyboard activation reports detail 0 and follows the link natively.
  const onClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.detail > 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey) event.preventDefault()
  }

  const onTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const delta = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0
    const target = event.key === "Home" ? 0 : event.key === "End" ? count - 1 : delta ? (index + delta + count) % count : -1
    if (target < 0) return
    event.preventDefault()
    select(target, false)
    const tabs = event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
    tabs?.[target]?.focus()
  }

  const links = items.some((item) => item.href)
  const columns: CSSProperties = { display: "grid", gridTemplateColumns: `repeat(${count}, 1fr)`, padding: PAD }

  const list = items.map((item, index) => {
    if (links) {
      return (
        <a key={item.value} className="glass-tab-bar__item" href={item.href} draggable={false} aria-current={item.value === current ? "page" : undefined}>
          <ItemContent item={item} />
        </a>
      )
    }
    const selected = item.value === current
    return (
      <button
        key={item.value}
        type="button"
        className="glass-tab-bar__item"
        role="tab"
        aria-selected={selected}
        tabIndex={selected ? 0 : -1}
        onClick={(event) => {
          if (event.detail === 0) select(index, false)
        }}
        onKeyDown={(event) => onTabKeyDown(event, index)}
      >
        <ItemContent item={item} />
      </button>
    )
  })

  const barStyle: CSSProperties = { ...bar.rootProps.style, position: "absolute", inset: 0, borderRadius: 9999 }

  return (
    <div ref={track.rootRef} className={["glass-tab-bar", className].filter(Boolean).join(" ")} style={style} {...track.rootProps} onClick={onClick}>
      <div {...bar.rootProps} ref={bar.ref} style={barStyle} aria-hidden="true">
        {bar.wrap()}
      </div>
      <span ref={track.pillRef} className="glass-tab-bar__pill" aria-hidden="true" style={track.pillStyle} />
      <div ref={track.baseRef} className="glass-tab-bar__base">
        {links ? (
          <nav aria-label={ariaLabel} style={columns}>
            {list}
          </nav>
        ) : (
          <div role="tablist" aria-label={ariaLabel} style={columns}>
            {list}
          </div>
        )}
      </div>
      {track.lens}
      <div ref={track.accentRef} className="glass-tab-bar__accent" aria-hidden="true" style={{ ...columns, ...track.accentStyle }}>
        {items.map((item) => (
          <span key={item.value} className="glass-tab-bar__item">
            <ItemContent item={item} />
          </span>
        ))}
      </div>
    </div>
  )
}
