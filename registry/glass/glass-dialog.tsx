"use client"

import { type ComponentProps, type ReactNode, forwardRef } from "react"
import { Dialog } from "@base-ui/react/dialog"
import { mergeProps } from "@base-ui/react/merge-props"
import { cn } from "@/lib/utils"
import { GlassStack, type WithStringClassName, useGlassSurface } from "@/registry/glass/glass-material"

export const GlassDialog = Dialog.Root
export const GlassDialogTrigger = Dialog.Trigger
export const GlassDialogClose = Dialog.Close

export const GlassDialogContent = forwardRef<HTMLDivElement, WithStringClassName<ComponentProps<typeof Dialog.Popup>>>(function GlassDialogContent(
  { className, children, ...props },
  forwardedRef,
) {
  const glass = useGlassSurface<HTMLDivElement>({ material: "regular", forwardedRef })
  return (
    <Dialog.Portal>
      <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/35 transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0 motion-reduce:transition-none" />
      <Dialog.Popup
        // Needs inline layout: the engine's unlayered `.lg` rules beat utilities.
        {...mergeProps<typeof Dialog.Popup>(glass.rootProps, { style: { position: "fixed", top: "50%", left: "50%", translate: "-50% -50%" } }, props)}
        ref={glass.ref}
        className={cn(
          glass.rootProps.className,
          "z-50 w-[min(32rem,calc(100vw-2rem))] max-h-[calc(100vh-2rem)] overflow-auto rounded-(--glass-radius-xl) focus-visible:outline-none",
          "transition-[opacity,scale]! duration-200 ease-out data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0 motion-reduce:transition-none!",
          className,
        )}
      >
        <GlassStack.Provider value={true}>{glass.wrap(<div className="p-6">{children as ReactNode}</div>)}</GlassStack.Provider>
      </Dialog.Popup>
    </Dialog.Portal>
  )
})

export const GlassDialogTitle = forwardRef<HTMLHeadingElement, WithStringClassName<ComponentProps<typeof Dialog.Title>>>(function GlassDialogTitle({ className, ...props }, ref) {
  return <Dialog.Title ref={ref} className={cn("text-lg font-semibold", className)} {...props} />
})

export const GlassDialogDescription = forwardRef<HTMLParagraphElement, WithStringClassName<ComponentProps<typeof Dialog.Description>>>(function GlassDialogDescription(
  { className, ...props },
  ref,
) {
  return <Dialog.Description ref={ref} className={cn("mt-2 text-sm text-(--glass-muted-foreground)", className)} {...props} />
})

export function GlassDialogFooter({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("mt-6 flex justify-end gap-2", className)} {...props} />
}
