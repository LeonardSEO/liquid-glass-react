"use client"

import { type ComponentProps, type ReactNode, forwardRef } from "react"
import { Button } from "@base-ui/react/button"
import { mergeProps } from "@base-ui/react/merge-props"
import { cn } from "@/lib/utils"
import { type GlassMaterial, type WithStringClassName, useGlassSurface } from "@/registry/glass/glass-material"

const sizes = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-13 px-7 text-base",
  icon: "size-11",
}

export type GlassButtonProps = WithStringClassName<ComponentProps<typeof Button>> & {
  variant?: "primary" | "secondary"
  size?: keyof typeof sizes
  material?: GlassMaterial
  /** Shows a spinner and blocks activation, but keeps keyboard focus on the button. */
  loading?: boolean
  children?: ReactNode
}

export const GlassButton = forwardRef<HTMLElement, GlassButtonProps>(function GlassButton(
  { variant = "secondary", size = "md", material = "clear", loading = false, disabled = false, className, children, ...props },
  forwardedRef,
) {
  const inactive = disabled || loading
  const glass = useGlassSurface<HTMLElement>({ material, interactive: !inactive, forwardedRef })

  return (
    <Button
      {...mergeProps<typeof Button>(glass.rootProps, props)}
      ref={glass.ref}
      disabled={inactive}
      focusableWhenDisabled={loading}
      aria-busy={loading || undefined}
      className={cn(
        glass.rootProps.className,
        variant === "primary" && "glass-primary",
        "inline-flex shrink-0 select-none items-center justify-center rounded-full border-0 bg-transparent font-medium",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--glass-ring)",
        "data-disabled:cursor-not-allowed data-disabled:opacity-55",
        loading && "cursor-progress data-disabled:opacity-100",
        sizes[size],
        className,
      )}
    >
      {glass.wrap(
        <span className="flex h-full items-center justify-center gap-2">
          {loading && (
            <svg className="size-4 animate-spin motion-reduce:animate-none" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
              <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
          )}
          {children}
        </span>,
      )}
    </Button>
  )
})
