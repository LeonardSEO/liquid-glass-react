"use client"

import { type CSSProperties, type KeyboardEvent, type ReactNode, useState } from "react"
import { useLensTrack } from "@/registry/glass/glass-lens-track"

export type GlassSegmentedControlItem = {
  value: string
  label: ReactNode
  disabled?: boolean
}

export type GlassSegmentedControlProps = {
  items: GlassSegmentedControlItem[]
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  /** Submits the selected value with a form under this name. */
  name?: string
  disabled?: boolean
  className?: string
  style?: CSSProperties
  "aria-label": string
}

// Measured on iOS 26 in points: a 30 tall track with the selected segment
// inset by 2 on every side.
const PAD = 2

/**
 * An iOS 26 segmented control: a white pill marks the selected segment at
 * rest, and rises into a magnifying glass lens that you can drag to another
 * segment. It is a radio group: arrow keys move and select.
 */
export function GlassSegmentedControl({
  items,
  value: valueProp,
  defaultValue,
  onValueChange,
  name,
  disabled = false,
  className,
  style,
  "aria-label": ariaLabel,
}: GlassSegmentedControlProps) {
  const [uncontrolled, setUncontrolled] = useState(defaultValue ?? items[0]?.value)
  // The glass follows `current` wherever it changes from: a pointer, a key or a new `value`.
  const current = valueProp ?? uncontrolled

  const count = items.length
  const activeIndex = Math.max(0, items.findIndex((item) => item.value === current))

  /** Selects a segment and returns where the glass belongs. */
  const select = (index: number) => {
    const item = items[index]
    if (!item || item.disabled) return activeIndex
    if (item.value !== current) {
      if (valueProp === undefined) setUncontrolled(item.value)
      onValueChange?.(item.value)
    }
    return index
  }

  const track = useLensTrack({ count, activeIndex, pad: PAD, lensWidth: 1.12, lensHeight: 1.3, onPick: select })

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const forward = event.key === "ArrowRight" || event.key === "ArrowDown"
    const back = event.key === "ArrowLeft" || event.key === "ArrowUp"
    if (!forward && !back && event.key !== "Home" && event.key !== "End") return
    event.preventDefault()
    // Skip disabled segments, wrapping around like native radio groups.
    const direction = forward || event.key === "Home" ? 1 : -1
    let target = event.key === "Home" ? 0 : event.key === "End" ? count - 1 : index + direction
    for (let tries = 0; tries < count && items[((target % count) + count) % count].disabled; tries++) target += direction
    target = ((target % count) + count) % count
    select(target)
    const radios = event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="radio"]')
    radios?.[target]?.focus()
  }

  const columns: CSSProperties = { display: "grid", gridTemplateColumns: `repeat(${count}, 1fr)`, padding: PAD }
  const pointer = disabled ? {} : track.rootProps

  return (
    <div
      ref={track.rootRef}
      className={["glass-segmented", className].filter(Boolean).join(" ")}
      style={style}
      data-disabled={disabled ? "" : undefined}
      {...pointer}
    >
      <span ref={track.pillRef} className="glass-segmented__pill" aria-hidden="true" style={track.pillStyle} />
      <div ref={track.baseRef} className="glass-segmented__base" role="radiogroup" aria-label={ariaLabel} aria-disabled={disabled || undefined} style={columns}>
        {items.map((item, index) => {
          const selected = item.value === current
          return (
            <button
              key={item.value}
              type="button"
              role="radio"
              aria-checked={selected}
              tabIndex={selected ? 0 : -1}
              disabled={disabled || item.disabled}
              className="glass-segmented__item"
              data-selected={selected ? "" : undefined}
              onClick={(event) => {
                if (event.detail === 0) select(index)
              }}
              onKeyDown={(event) => onKeyDown(event, index)}
            >
              {item.label}
            </button>
          )
        })}
      </div>
      {track.lens}
      <div ref={track.accentRef} className="glass-segmented__accent" aria-hidden="true" style={{ ...columns, ...track.accentStyle }}>
        {items.map((item) => (
          <span key={item.value} className="glass-segmented__item" data-selected={item.value === current ? "" : undefined}>
            {item.label}
          </span>
        ))}
      </div>
      {name !== undefined && current !== undefined && <input type="hidden" name={name} value={current} />}
    </div>
  )
}
