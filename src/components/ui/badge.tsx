import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 backdrop-blur-sm",
  {
    variants: {
      variant: {
        default:
          "border-primary/30 bg-gradient-to-r from-primary/20 to-accent/20 text-primary shadow-sm hover:shadow-[0_0_10px_hsla(195,100%,55%,0.4)]",
        secondary:
          "border-white/10 bg-gradient-to-br from-secondary/60 to-secondary/40 text-secondary-foreground hover:shadow-[0_0_10px_hsla(210,35%,18%,0.3)]",
        destructive:
          "border-destructive/30 bg-gradient-to-r from-destructive/20 to-red-600/20 text-destructive shadow-sm hover:shadow-[0_0_10px_hsla(0,84%,60%,0.4)]",
        outline: "border-primary/40 text-foreground bg-background/50 hover:bg-primary/10 hover:shadow-[0_0_8px_hsla(195,100%,55%,0.3)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
