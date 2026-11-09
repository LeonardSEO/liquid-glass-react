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
import { type LiquidGlassOptions, type LiquidGlassRootProps, useLiquidGlass } from "./useLiquidGlass"

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

// A Record so that adding an option without listing it here fails to compile.
const OPTION_KEYS: Record<keyof LiquidGlassOptions, true> = {
  variant: true,
  radius: true,
  bezel: true,
  thickness: true,
  tint: true,
  ior: true,
  profile: true,
  refraction: true,
  dispersion: true,
  blur: true,
  saturation: true,
  specular: true,
  lightAngle: true,
  interactive: true,
}

type PointerKey = Extract<keyof LiquidGlassRootProps, `on${string}`>
type DomProps = HTMLAttributes<HTMLDivElement>

function setRef<T>(ref: ForwardedRef<T> | undefined, value: T | null) {
  if (typeof ref === "function") ref(value)
  else if (ref) ref.current = value
}

function splitOptions(props: LiquidGlassOptions & DomProps) {
  const options: Record<string, unknown> = {}
  const dom: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(props)) (key in OPTION_KEYS ? options : dom)[key] = value
  return { options: options as LiquidGlassOptions, dom: dom as DomProps }
}

export const LiquidGlass = forwardRef<HTMLDivElement, LiquidGlassProps>(function LiquidGlass({ children, render, radius = 32, className, style, ...others }, forwardedRef) {
  const { options, dom } = splitOptions(others)
  const glass = useLiquidGlass({ ...options, radius })
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

  const pointerKeys = Object.keys(rootProps).filter((name) => name.startsWith("on")) as PointerKey[]
  const pointerHandlers = Object.fromEntries(
    pointerKeys.map((key) => [
      key,
      (event: ReactPointerEvent<HTMLDivElement>) => {
        rootProps[key](event)
        dom[key]?.(event)
      },
    ]),
  )
  const props = {
    ...dom,
    ...pointerHandlers,
    ref,
    className: [rootProps.className, render?.props.className as string | undefined, className].filter(Boolean).join(" "),
    style: { ...(render?.props.style as CSSProperties | undefined), ...style, ...rootProps.style },
  }

  if (render) return cloneElement(render, props, glass.wrap(children))
  return <div {...props}>{glass.wrap(children)}</div>
})
