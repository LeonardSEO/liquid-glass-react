"use client"

import { type ComponentProps, forwardRef } from "react"
import { Tabs } from "@base-ui/react/tabs"
import { cn } from "@/lib/utils"
import { type WithStringClassName, useGlassSurface } from "@/registry/glass/glass-material"

export const GlassTabs = forwardRef<HTMLDivElement, ComponentProps<typeof Tabs.Root>>(function GlassTabs(props, ref) {
  return <Tabs.Root ref={ref} {...props} />
})

function GlassTabsIndicator() {
  const glass = useGlassSurface<HTMLSpanElement>({ material: "regular" })
  return (
    <Tabs.Indicator
      {...glass.rootProps}
      ref={glass.ref}
      // Needs inline layout: the engine's unlayered `.lg` rules beat utilities.
      style={{
        ...glass.rootProps.style,
        position: "absolute",
        top: "var(--active-tab-top)",
        left: 0,
        translate: "var(--active-tab-left) 0",
        width: "var(--active-tab-width)",
        height: "var(--active-tab-height)",
      }}
      className={cn(
        glass.rootProps.className,
        // Solid enough to show the selected state on any background.
        "glass-primary z-0 block rounded-full transition-[translate,width]! duration-200 ease-out motion-reduce:transition-none!",
      )}
    >
      {glass.wrap()}
    </Tabs.Indicator>
  )
}

/**
 * The track is deliberately not glass: a backdrop-filter on it would hide the
 * page from the moving indicator, which is the part that refracts.
 */
export const GlassTabsList = forwardRef<HTMLDivElement, WithStringClassName<ComponentProps<typeof Tabs.List>>>(function GlassTabsList(
  { className, children, ...props },
  ref,
) {
  return (
    <Tabs.List
      ref={ref}
      className={cn("relative z-0 inline-flex items-center gap-1 rounded-full bg-(--glass-track) p-1 text-(--glass-foreground)", className)}
      {...props}
    >
      {children}
      <GlassTabsIndicator />
    </Tabs.List>
  )
})

export const GlassTabsTrigger = forwardRef<HTMLElement, WithStringClassName<ComponentProps<typeof Tabs.Tab>>>(function GlassTabsTrigger({ className, ...props }, ref) {
  return (
    <Tabs.Tab
      ref={ref}
      className={cn(
        "relative z-10 h-9 cursor-pointer rounded-full border-0 bg-transparent px-4 text-sm font-medium text-inherit transition-colors duration-200 data-active:text-(--glass-primary-foreground) motion-reduce:transition-none",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--glass-ring)",
        "data-disabled:cursor-not-allowed data-disabled:opacity-55",
        className,
      )}
      {...props}
    />
  )
})

export const GlassTabsPanel = forwardRef<HTMLDivElement, WithStringClassName<ComponentProps<typeof Tabs.Panel>>>(function GlassTabsPanel({ className, ...props }, ref) {
  return (
    <Tabs.Panel
      ref={ref}
      className={cn("mt-4 rounded-(--glass-radius-sm) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--glass-ring)", className)}
      {...props}
    />
  )
})
