import {
  type CSSProperties,
  type ForwardedRef,
  type HTMLAttributes,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
  type ReactNode,
  cloneElement,
  forwardRef,
  useCallback,
  version,
} from "react"
import { type LiquidGlassOptions, useLiquidGlass } from "./useLiquidGlass"

const isReact19 = parseInt(version, 10) >= 19

export type LiquidGlassProps = HTMLAttributes<HTMLDivElement> &
  LiquidGlassOptions & {
    children?: ReactNode
    /**
     * Corner radius in px (a large value such as 999 makes a pill or circle),
     * or "auto" to read the CSS border-radius. Default: 32.
     */
    radius?: number | "auto"
    /** Render as this element instead of a div, e.g. `render={<button type="button" />}`. */
    render?: ReactElement<Record<string, unknown>>
  }

type PointerHandler = ((e: ReactPointerEvent<HTMLDivElement>) => void) | undefined

function both(glass: (e: ReactPointerEvent<HTMLElement>) => void, own: PointerHandler) {
  return (e: ReactPointerEvent<HTMLDivElement>) => {
    glass(e)
    own?.(e)
  }
}

function setRef<T>(ref: ForwardedRef<T> | undefined, value: T | null) {
  if (typeof ref === "function") ref(value)
  else if (ref) ref.current = value
}

export const LiquidGlass = forwardRef<HTMLDivElement, LiquidGlassProps>(function LiquidGlass(
  {
    children,
    render,
    radius = 32,
    bezel,
    thickness,
    tint,
    ior,
    profile,
    refraction,
    dispersion,
    blur,
    saturation,
    specular,
    lightAngle,
    interactive,
    className,
    style,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerLeave,
    onPointerCancel,
    ...rest
  },
  forwardedRef,
) {
  const glass = useLiquidGlass({ radius, bezel, thickness, tint, ior, profile, refraction, dispersion, blur, saturation, specular, lightAngle, interactive })
  const { ref: glassRef, rootProps } = glass

  // React 19 keeps an element's ref in props; before that it sits on the
  // element, where reading it under 19 would log a deprecation warning.
  const renderRef = (
    render && (isReact19 ? render.props.ref : (render as unknown as { ref?: unknown }).ref)
  ) as ForwardedRef<HTMLDivElement> | undefined
  const ref = useCallback(
    (element: HTMLDivElement | null) => {
      glassRef(element)
      setRef(forwardedRef, element)
      setRef(renderRef, element)
    },
    [glassRef, forwardedRef, renderRef],
  )

  const props = {
    ...rest,
    ref,
    className: [rootProps.className, render?.props.className as string | undefined, className].filter(Boolean).join(" "),
    style: { ...(render?.props.style as CSSProperties | undefined), ...style, ...rootProps.style },
    onPointerDown: both(rootProps.onPointerDown, onPointerDown),
    onPointerMove: both(rootProps.onPointerMove, onPointerMove),
    onPointerUp: both(rootProps.onPointerUp, onPointerUp),
    onPointerLeave: both(rootProps.onPointerLeave, onPointerLeave),
    onPointerCancel: both(rootProps.onPointerCancel, onPointerCancel),
  }

  if (render) return cloneElement(render, props, glass.wrap(children))
  return <div {...props}>{glass.wrap(children)}</div>
})
