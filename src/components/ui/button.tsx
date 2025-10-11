import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 relative overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-primary via-primary to-accent text-primary-foreground shadow-lg hover:shadow-[0_0_20px_hsla(195,100%,55%,0.6)] border border-primary/20",
        destructive:
          "bg-gradient-to-r from-destructive to-red-600 text-destructive-foreground shadow-lg hover:shadow-[0_0_20px_hsla(0,84%,60%,0.6)]",
        outline:
          "border-2 border-primary/30 bg-background/50 backdrop-blur-sm hover:bg-primary/10 hover:border-primary/60 hover:shadow-[0_0_15px_hsla(195,100%,55%,0.3)]",
        secondary:
          "bg-gradient-to-br from-secondary to-secondary/80 text-secondary-foreground shadow-md hover:shadow-[0_0_15px_hsla(210,35%,18%,0.5)] border border-white/5",
        ghost: "hover:bg-accent/20 hover:text-accent-foreground hover:shadow-[0_0_10px_hsla(195,100%,45%,0.2)]",
        link: "text-primary underline-offset-4 hover:underline hover:text-accent",
      },
      size: {
        default: "h-10 xs:h-11 px-4 xs:px-5 py-2 text-sm xs:text-base",
        sm: "h-9 xs:h-10 rounded-md px-3 xs:px-4 text-xs xs:text-sm",
        lg: "h-11 xs:h-12 rounded-md px-6 xs:px-8 text-base xs:text-lg",
        icon: "h-10 w-10 xs:h-11 xs:w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
