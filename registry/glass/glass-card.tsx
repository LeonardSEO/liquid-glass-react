"use client"

import { type ComponentProps, forwardRef } from "react"
import { mergeProps } from "@base-ui/react/merge-props"
import { cn } from "@/lib/utils"
import { type GlassMaterial, GlassStack, useGlassSurface } from "@/registry/glass/glass-material"

export type GlassCardProps = ComponentProps<"div"> & { material?: GlassMaterial }

/** Glass buttons inside a card render as inset glass, because the card hides the page from them. */
export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(function GlassCard({ material = "regular", className, children, ...props }, forwardedRef) {
  const glass = useGlassSurface<HTMLDivElement>({ material, forwardedRef })
  return (
    <div
      {...mergeProps<"div">(glass.rootProps, props)}
      ref={glass.ref}
      className={cn(glass.rootProps.className, "block rounded-(--glass-radius-lg)", className)}
    >
      <GlassStack.Provider value={true}>{glass.wrap(children)}</GlassStack.Provider>
    </div>
  )
})

export function GlassCardHeader({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-1 p-6 pb-0", className)} {...props} />
}

export function GlassCardTitle({ className, ...props }: ComponentProps<"h3">) {
  return <h3 className={cn("text-lg font-semibold", className)} {...props} />
}

export function GlassCardDescription({ className, ...props }: ComponentProps<"p">) {
  return <p className={cn("text-sm text-(--glass-muted-foreground)", className)} {...props} />
}

export function GlassCardContent({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("p-6", className)} {...props} />
}

export function GlassCardFooter({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("flex items-center gap-2 p-6 pt-0", className)} {...props} />
}
