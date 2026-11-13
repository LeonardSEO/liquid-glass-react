"use client"

import { type ChangeEvent, type ComponentProps, type ReactNode, forwardRef, useCallback, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { type GlassMaterial, useGlassSurface } from "@/registry/glass/glass-material"

export type GlassInputProps = Omit<ComponentProps<"input">, "size"> & {
  material?: GlassMaterial
  /** Shown before the text, such as a magnifying glass. */
  icon?: ReactNode
  /** Shown after the text, such as a microphone button. */
  trailing?: ReactNode
  /** Shows a clear button while there is text. */
  clearable?: boolean
  /** Called by the clear button. A controlled input should empty its value here. */
  onClear?: () => void
  size?: "md" | "lg"
  /** Class for the glass wrapper; `className` goes on the input. */
  containerClassName?: string
}

/**
 * A text field on glass, such as the search field of iOS 26. The whole
 * capsule is the glass; the input itself stays a native input.
 */
export const GlassInput = forwardRef<HTMLInputElement, GlassInputProps>(function GlassInput(
  { material = "regular", icon, trailing, clearable = false, onClear, size = "md", containerClassName, className, onChange, value, defaultValue, disabled, ...props },
  forwardedRef,
) {
  const glass = useGlassSurface<HTMLDivElement>({ material })
  const input = useRef<HTMLInputElement | null>(null)
  const [typed, setTyped] = useState(() => String(defaultValue ?? "").length > 0)
  const filled = value !== undefined ? String(value).length > 0 : typed

  const setInput = useCallback(
    (element: HTMLInputElement | null) => {
      input.current = element
      if (typeof forwardedRef === "function") forwardedRef(element)
      else if (forwardedRef) forwardedRef.current = element
    },
    [forwardedRef],
  )

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setTyped(event.target.value.length > 0)
    onChange?.(event)
  }

  const clear = () => {
    if (value === undefined && input.current) input.current.value = ""
    setTyped(false)
    onClear?.()
    input.current?.focus()
  }

  return (
    <div
      {...glass.rootProps}
      ref={glass.ref}
      className={cn(glass.rootProps.className, "glass-input", size === "lg" && "glass-input--lg", disabled && "glass-input--disabled", containerClassName)}
      onPointerDown={(event) => {
        // Clicking the glass around the text still puts the caret in the field.
        if (event.target === event.currentTarget || !(event.target as HTMLElement).closest("button,input,a")) {
          event.preventDefault()
          input.current?.focus()
        }
      }}
    >
      {glass.wrap(
        <span className="glass-input__row">
          {icon && <span className="glass-input__icon" aria-hidden="true">{icon}</span>}
          <input
            {...props}
            ref={setInput}
            value={value}
            defaultValue={defaultValue}
            disabled={disabled}
            onChange={handleChange}
            className={cn("glass-input__field", className)}
          />
          {clearable && filled && !disabled && (
            <button type="button" className="glass-input__clear" aria-label="Clear" onClick={clear}>
              <svg viewBox="0 0 20 20" width="17" height="17" aria-hidden="true">
                <circle cx="10" cy="10" r="10" fill="currentColor" />
                <path d="M6.5 6.5l7 7m0-7l-7 7" stroke="var(--glass-input-clear-mark)" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          )}
          {trailing}
        </span>,
      )}
    </div>
  )
})
