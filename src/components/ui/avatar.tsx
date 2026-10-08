"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { assets } from "@/lib/assets"
import { cn } from "@/lib/utils"
import { Avatar as AvatarPrimitive } from "radix-ui"

// Design diameters (px, border included) -> initials size.
const sizeMap = {
  18: "size-[18px] text-9",
  20: "size-5 text-10",
  22: "size-[22px] text-10",
  24: "size-6 text-11",
  26: "size-[26px] text-11",
  28: "size-7 text-12",
  30: "size-[30px] text-12",
  32: "size-8 text-13",
  36: "size-9 text-14",
  40: "size-10 text-15",
  44: "size-11 text-16",
  48: "size-12 text-17",
  52: "size-[52px] text-18",
  64: "size-16 text-22",
} as const

const avatarSizes = sizeMap
type AvatarSize = keyof typeof sizeMap

const tones = ["amber", "info", "success", "go", "peach"] as const
type AvatarTone = (typeof tones)[number]

const avatarVariants = cva(
  "group/avatar relative flex shrink-0 items-center justify-center select-none font-semibold text-ink",
  {
    variants: {
      // Real borders (border-box), so the design's diameter is kept with the ring inside it.
      ring: {
        none: "",
        white: "border-2 border-white",
        "white-thin": "border-[1.5px] border-white",
        black: "border-2 border-black",
      },
      tone: {
        amber: "bg-amber-soft",
        info: "bg-info-tint",
        success: "bg-success-soft",
        go: "bg-go-soft",
        peach: "bg-peach-tint",
        none: "",
      },
      kind: {
        user: "rounded-full",
        go: "rounded-full bg-info-soft",
        trip: "rounded-xl",
      },
      // Overrides the kind's corner radius (kind="trip" is rounded by default).
      shape: {
        rounded: "",
        circle: "rounded-full",
      },
    },
    defaultVariants: { ring: "none", tone: "none", kind: "user", shape: "rounded" },
  }
)

/** Stable per-user fallback tone, so the same name always gets the same colour. */
function toneFor(name?: string): AvatarTone | "none" {
  if (!name) return "none"
  let h = 0
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return tones[h % tones.length]
}

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return parts
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase()
}

type AvatarProps = Omit<React.ComponentProps<typeof AvatarPrimitive.Root>, "children"> &
  Omit<VariantProps<typeof avatarVariants>, "tone"> & {
    size?: AvatarSize
    tone?: AvatarTone
    /** Image URL (an `assets` entry's `.src`). kind="go" defaults to Go's avatar. */
    src?: string
    /** Used for the image alt and the initials fallback. */
    name?: string
    /** Fallback text; defaults to the initials of `name`. */
    initials?: string
    children?: React.ReactNode
  }

function Avatar({
  className,
  size = 32,
  ring = "none",
  tone,
  kind = "user",
  shape = "rounded",
  src,
  name,
  initials,
  children,
  ...props
}: AvatarProps) {
  const imageSrc = src ?? (kind === "go" ? assets.goAvatar.src : undefined)
  // Load state of `imageSrc` (keyed by src, so a new src starts over at "loading").
  const [image, setImage] = React.useState<{ src: string; state: "loaded" | "error" } | null>(null)
  const imageState = image && image.src === imageSrc ? image.state : "loading"
  // Also the ref: an <img> that settled before hydration never gets a React load/error event.
  const settle = React.useCallback(
    (img: HTMLImageElement | null) => {
      if (!img?.complete || !imageSrc) return
      const state = img.naturalWidth > 0 ? "loaded" : "error"
      setImage((prev) => (prev?.src === imageSrc && prev.state === state ? prev : { src: imageSrc, state }))
    },
    [imageSrc]
  )

  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      data-size={size}
      data-image={imageSrc ? imageState : undefined}
      className={cn(
        avatarVariants({ ring, kind, shape, tone: tone ?? (kind === "user" ? toneFor(name) : "none") }),
        sizeMap[size],
        className
      )}
      {...props}
    >
      {(initials ?? name) && kind === "user" && <AvatarFallback>{initials ?? initialsOf(name!)}</AvatarFallback>}
      {children}
      {/* A plain <img> over the fallback, not Radix's AvatarImage: that one renders nothing until hydration plus a
          JS preload, so server HTML and every first paint showed initials (or an empty circle for Go). */}
      {imageSrc && imageState !== "error" && (
        // eslint-disable-next-line @next/next/no-img-element -- SVG placeholder / design photo inside a sized circle
        <img
          ref={settle}
          data-slot="avatar-image"
          src={imageSrc}
          alt={name ?? ""}
          onLoad={(e) => settle(e.currentTarget)}
          onError={(e) => settle(e.currentTarget)}
          className={cn(
            "absolute inset-0 m-auto",
            // The trip art is a square SVG: it takes the root's radius (rounded-xl tile, or the circle shape) so its
            // corners can never poke out of the avatar.
            kind === "trip" ? "size-[91%] rounded-[inherit] object-contain" : "size-full rounded-full object-cover"
          )}
        />
      )}
    </AvatarPrimitive.Root>
  )
}

function AvatarImage({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn(
        "aspect-square size-full rounded-full object-cover",
        className
      )}
      {...props}
    />
  )
}

function AvatarFallback({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        "flex size-full items-center justify-center rounded-full group-data-[image=loaded]/avatar:hidden",
        className
      )}
      {...props}
    />
  )
}

function AvatarBadge({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="avatar-badge"
      className={cn(
        "absolute right-0 bottom-0 z-10 inline-flex size-2.5 items-center justify-center rounded-full bg-success ring-2 ring-white select-none",
        className
      )}
      {...props}
    />
  )
}

export {
  Avatar,
  AvatarImage,
  AvatarFallback,
  AvatarBadge,
  avatarVariants,
  avatarSizes,
  type AvatarSize,
  type AvatarTone,
}
