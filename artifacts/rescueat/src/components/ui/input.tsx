import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // ── Base ───────────────────────────────────────────────────────────
          "flex h-11 w-full rounded-xl",
          "border border-input bg-card",
          "px-4 py-2.5 text-base text-foreground",
          // Placeholder
          "placeholder:text-muted-foreground/55",
          // File input
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          // Transitions: ボーダー色・影・背景色を滑らかに補間
          "transition-all duration-200 ease-out",
          // フォーカス: リング＋ボーダー強調（outline廃止）
          "focus-visible:outline-none",
          "focus-visible:ring-2 focus-visible:ring-primary/20",
          "focus-visible:border-primary/60",
          "focus-visible:bg-white",
          // Disabled
          "disabled:cursor-not-allowed disabled:opacity-40 disabled:bg-muted",
          // md: 以上は少し小さく
          "md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
