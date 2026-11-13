"use client"

import { type ButtonHTMLAttributes, type KeyboardEvent, type MouseEvent, type PointerEvent, forwardRef, useCallback, useEffect, useRef, useState } from "react"
import { useLensThumb } from "@/registry/glass/glass-lens-thumb"

export type GlassSwitchProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "value" | "defaultValue" | "onChange" | "role" | "type"> & {
  checked?: boolean
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean) => void
  /** Submits the switch with a form under this name while it is on. */
  name?: string
  /** The value submitted while the switch is on. Default: "on". */
  value?: string
}

// Measured on iOS 26 in points: a 63 × 28 track, a 37 × 24 capsule at rest
// that grows into a 54 × 35 lens while touched.
const TRACK_WIDTH = 63
const TRACK_HEIGHT = 28
const INSET = 2
const THUMB_HEIGHT = TRACK_HEIGHT - INSET * 2
const THUMB_WIDTH = THUMB_HEIGHT * (54 / 35)
const LIFT = 35 / THUMB_HEIGHT
const OFF_X = INSET + THUMB_WIDTH / 2
const ON_X = TRACK_WIDTH - OFF_X

/**
 * An iOS 26 switch: a white capsule at rest that turns into a clear glass
 * lens as soon as it is pressed, magnifying the track beneath it. It stays
 * glass while held, toggles on release and turns white again once it lands.
 */
export const GlassSwitch = forwardRef<HTMLButtonElement, GlassSwitchProps>(function GlassSwitch(
  { checked: checkedProp, defaultChecked = false, onCheckedChange, name, value = "on", disabled, className, style, onPointerDown, onKeyDown, onClick, ...props },
  forwardedRef,
) {
  const [uncontrolled, setUncontrolled] = useState(defaultChecked)
  const checked = checkedProp ?? uncontrolled
  // What the track shows: changes as the thumb sets off, not when it lands.
  const [shown, setShown] = useState(checked)
  const press = useRef<number | null>(null)
  const checkedRef = useRef(checked)
  checkedRef.current = checked

  const thumb = useLensThumb({ width: THUMB_WIDTH, height: THUMB_HEIGHT, lift: LIFT, centerY: TRACK_HEIGHT / 2, initialX: checked ? ON_X : OFF_X })
  const { moveTo, target } = thumb

  /** Sends the thumb to a side. `lift` turns it into glass on the way. */
  const settle = useCallback(
    (on: boolean, lift = false) => {
      setShown(on)
      moveTo(on ? ON_X : OFF_X, { lift })
    },
    [moveTo],
  )

  // An outside change of `checked` moves the thumb.
  useEffect(() => {
    if (target() !== (checked ? ON_X : OFF_X)) settle(checked)
    else setShown(checked)
  }, [checked, settle, target])

  const commit = (next: boolean) => {
    if (next !== checkedRef.current) {
      if (checkedProp === undefined) setUncontrolled(next)
      onCheckedChange?.(next)
    }
    settle(next, true)
  }

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    onPointerDown?.(event)
    if (event.defaultPrevented || disabled || event.button !== 0) return
    event.currentTarget.setPointerCapture(event.pointerId)
    press.current = event.pointerId
    thumb.press()
  }

  const handlePointerUp = (event: PointerEvent<HTMLButtonElement>, cancelled: boolean) => {
    if (press.current !== event.pointerId) return
    press.current = null
    thumb.release()
    if (cancelled) settle(checkedRef.current)
    else commit(!checkedRef.current)
  }

  // Pointers are handled above; a click with detail 0 comes from the keyboard
  // or assistive technology.
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    onClick?.(event)
    if (event.defaultPrevented || disabled || event.detail > 0) return
    commit(!checkedRef.current)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    onKeyDown?.(event)
    // A switch toggles on Space only; Enter would submit a surrounding form.
    if (event.key === "Enter") event.preventDefault()
  }

  return (
    <button
      {...props}
      ref={forwardedRef}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      data-checked={shown ? "" : undefined}
      className={["glass-switch", className].filter(Boolean).join(" ")}
      style={style}
      onPointerDown={handlePointerDown}
      onPointerUp={(event) => handlePointerUp(event, false)}
      onPointerCancel={(event) => handlePointerUp(event, true)}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <span className="glass-switch__track" aria-hidden="true" />
      {thumb.element}
      {name !== undefined && checked && <input type="hidden" name={name} value={value} />}
    </button>
  )
})
