"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius)] text-base font-semibold tracking-[-0.01em] transition-colors duration-150 disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--accent)] text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)] disabled:bg-[var(--wash)] disabled:text-[var(--ink-faint)] disabled:ring-1 disabled:ring-[var(--rule-strong)] disabled:ring-inset",
        secondary:
          "bg-white text-[var(--ink)] ring-1 ring-[var(--rule-strong)] ring-inset hover:bg-[var(--wash)] hover:ring-[var(--line-strong)]",
        ghost: "text-[var(--ink-soft)] hover:bg-[var(--wash)] hover:text-[var(--ink)]",
        link: "text-[var(--accent-deep)] underline underline-offset-4 hover:text-[var(--accent)]",
        onBand: "bg-white text-[var(--ink)] hover:bg-[var(--accent-soft)]",
      },
      size: {
        sm: "h-11 px-3.5 text-sm sm:h-9",
        md: "h-11 px-5",
        lg: "h-12 px-6 text-base sm:h-13 sm:px-7",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
