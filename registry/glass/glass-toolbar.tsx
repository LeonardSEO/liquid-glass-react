"use client"

import { type ComponentProps, type ReactNode, forwardRef } from "react"
import { Toolbar } from "@base-ui/react/toolbar"
import { mergeProps } from "@base-ui/react/merge-props"
import { cn } from "@/lib/utils"
import { type GlassMaterial, GlassStack, type WithStringClassName, useGlassSurface } from "@/registry/glass/glass-material"

export type GlassToolbarProps = WithStringClassName<ComponentProps<typeof Toolbar.Root>> & {
  material?: GlassMaterial
  children?: ReactNode
}

/**
 * A floating group of actions on one shared glass capsule, as in iOS 26.
 * Arrow keys move between its buttons. Glass controls placed inside render
 * as inset glass, because the toolbar hides the page from them.
 */
export const GlassToolbar = forwardRef<HTMLDivElement, GlassToolbarProps>(function GlassToolbar(
  { material = "regular", className, children, ...props },
  forwardedRef,
) {
  const glass = useGlassSurface<HTMLDivElement>({ material, forwardedRef })
  return (
    <Toolbar.Root
      {...mergeProps<typeof Toolbar.Root>(glass.rootProps, props)}
      ref={glass.ref}
      className={cn(glass.rootProps.className, "glass-toolbar", className)}
    >
      <GlassStack.Provider value={true}>{glass.wrap(<span className="glass-toolbar__items">{children}</span>)}</GlassStack.Provider>
    </Toolbar.Root>
  )
})

export type GlassToolbarButtonProps = WithStringClassName<ComponentProps<typeof Toolbar.Button>> & {
  /** A wider button with a text label instead of a round icon button. */
  wide?: boolean
}

/** A plain icon button on the toolbar's glass. Give it an `aria-label` when it shows only an icon. */
export const GlassToolbarButton = forwardRef<HTMLButtonElement, GlassToolbarButtonProps>(function GlassToolbarButton(
  { wide = false, className, ...props },
  forwardedRef,
) {
  return <Toolbar.Button ref={forwardedRef} className={cn("glass-toolbar__button", wide && "glass-toolbar__button--wide", className)} {...props} />
})

export function GlassToolbarSeparator({ className, ...props }: WithStringClassName<ComponentProps<typeof Toolbar.Separator>>) {
  return <Toolbar.Separator className={cn("glass-toolbar__separator", className)} {...props} />
}
