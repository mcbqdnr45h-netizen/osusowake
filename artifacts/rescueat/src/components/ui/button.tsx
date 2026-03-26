import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  // ── Base: 全バリアント共通 ──────────────────────────────────────────────────
  // transition-all で色・影・transformを一括補間。duration-200で滑らか。
  // active:scale で「押し込まれた」感覚。disabled はポインター無効＋透過。
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold",
    "transition-all duration-200 ease-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-1",
    "disabled:pointer-events-none disabled:opacity-40",
    "active:scale-[0.97] active:duration-75",
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
    "select-none cursor-pointer",
  ].join(" "),
  {
    variants: {
      variant: {
        // プライマリ: オレンジ塗り。ホバーで輝度UP＋わずかに浮かぶ。
        default:
          "bg-primary text-primary-foreground rounded-xl " +
          "shadow-sm shadow-primary/20 " +
          "hover:brightness-105 hover:-translate-y-px hover:shadow-md hover:shadow-primary/25 " +
          "active:brightness-95 active:translate-y-0 active:shadow-sm",

        // 破壊的: 赤塗り。
        destructive:
          "bg-destructive text-destructive-foreground rounded-xl " +
          "shadow-sm " +
          "hover:brightness-105 hover:-translate-y-px hover:shadow-md " +
          "active:brightness-95 active:translate-y-0",

        // アウトライン: 背景透明・枠線あり。ホバーで薄く塗る。
        outline:
          "border border-border bg-transparent text-foreground rounded-xl " +
          "hover:bg-muted/70 hover:border-foreground/20 " +
          "active:bg-muted",

        // セカンダリ: 薄いオレンジ背景。
        secondary:
          "bg-secondary text-secondary-foreground rounded-xl " +
          "hover:bg-secondary/80 hover:-translate-y-px " +
          "active:translate-y-0",

        // ゴースト: 背景なし。ホバーでミュート背景。
        ghost:
          "text-foreground rounded-xl " +
          "hover:bg-muted hover:text-foreground " +
          "active:bg-muted/80",

        // リンク: テキストのみ。
        link:
          "text-primary underline-offset-4 hover:underline p-0 h-auto rounded-none",
      },
      size: {
        default: "h-11 px-5 py-2.5 text-sm rounded-xl",
        sm:      "h-9  px-4 py-2   text-xs rounded-lg",
        lg:      "h-12 px-7 py-3   text-base rounded-xl",
        xl:      "h-14 px-8 py-4   text-base rounded-2xl",
        icon:    "h-10 w-10 rounded-xl",
        "icon-sm": "h-8 w-8 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
