"use client"

import { type ComponentProps, type ForwardedRef, type ReactNode, forwardRef } from "react"
import { Menu } from "@base-ui/react/menu"
import { mergeProps } from "@base-ui/react/merge-props"
import { cn } from "@/lib/utils"
import { type GlassMaterial, GlassStack, type WithStringClassName, useGlassSurface } from "@/registry/glass/glass-material"

export const GlassMenu = Menu.Root

/**
 * The button that opens the menu. Render it as a glass button, for example
 * `render={<GlassButton size="icon" aria-label="More" />}`: the menu grows
 * out of it and shrinks back into it.
 */
export const GlassMenuTrigger = forwardRef<HTMLButtonElement, WithStringClassName<ComponentProps<typeof Menu.Trigger>>>(function GlassMenuTrigger(
  { className, ...props },
  ref,
) {
  return <Menu.Trigger ref={ref} className={cn("glass-menu-trigger", className)} {...props} />
})

export type GlassMenuContentProps = WithStringClassName<ComponentProps<typeof Menu.Popup>> & {
  /** Which edge of the button the menu lines up with. Default: "start". */
  align?: "start" | "center" | "end"
  /** Open below or above the button. Default: "bottom". */
  side?: "bottom" | "top"
  material?: GlassMaterial
}

/**
 * The menu: a glass panel that morphs out of its trigger. It is laid over
 * the button, starts clipped to the button's capsule and grows to its full
 * size while the button fades, so the button seems to become the menu.
 */
export const GlassMenuContent = forwardRef<HTMLDivElement, GlassMenuContentProps>(function GlassMenuContent(props, forwardedRef) {
  // The menu is portalled out of any surrounding glass, so it has a backdrop
  // of its own even when its trigger sits on a toolbar or card.
  return (
    <GlassStack.Provider value={false}>
      <MenuPanel {...props} forwardedRef={forwardedRef} />
    </GlassStack.Provider>
  )
})

function MenuPanel({
  align = "start",
  side = "bottom",
  material = "regular",
  className,
  children,
  forwardedRef,
  ...props
}: GlassMenuContentProps & { forwardedRef: ForwardedRef<HTMLDivElement> }) {
  const glass = useGlassSurface<HTMLDivElement>({ material, forwardedRef })
  return (
    <Menu.Portal>
      <Menu.Positioner
        className="glass-menu-positioner"
        side={side}
        align={align}
        // Over the button rather than next to it: the menu starts as the button.
        sideOffset={({ anchor }) => -anchor.height}
        collisionPadding={12}
      >
        <Menu.Popup {...mergeProps<typeof Menu.Popup>(glass.rootProps, props)} ref={glass.ref} className={cn(glass.rootProps.className, "glass-menu", className)}>
          {glass.wrap(<span className="glass-menu__items">{children as ReactNode}</span>)}
        </Menu.Popup>
      </Menu.Positioner>
    </Menu.Portal>
  )
}

export type GlassMenuItemProps = WithStringClassName<ComponentProps<typeof Menu.Item>> & {
  /** Shown at the trailing edge, as in iOS menus. */
  icon?: ReactNode
  /** Red, for actions that delete or cannot be undone. */
  destructive?: boolean
}

export const GlassMenuItem = forwardRef<HTMLDivElement, GlassMenuItemProps>(function GlassMenuItem(
  { icon, destructive = false, className, children, ...props },
  ref,
) {
  return (
    <Menu.Item ref={ref} className={cn("glass-menu__item", destructive && "glass-menu__item--destructive", className)} {...props}>
      <span className="glass-menu__label">{children as ReactNode}</span>
      {icon && (
        <span className="glass-menu__icon" aria-hidden="true">
          {icon}
        </span>
      )}
    </Menu.Item>
  )
})

export function GlassMenuSeparator({ className, ...props }: WithStringClassName<ComponentProps<typeof Menu.Separator>>) {
  return <Menu.Separator className={cn("glass-menu__separator", className)} {...props} />
}

export const GlassMenuGroup = Menu.Group

export function GlassMenuGroupLabel({ className, ...props }: WithStringClassName<ComponentProps<typeof Menu.GroupLabel>>) {
  return <Menu.GroupLabel className={cn("glass-menu__group-label", className)} {...props} />
}
