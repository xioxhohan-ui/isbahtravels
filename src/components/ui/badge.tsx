import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-lg border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-950",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-emerald-100 text-emerald-800",
        secondary:
          "border-transparent bg-slate-100 text-slate-900",
        destructive:
          "border-transparent bg-rose-100 text-rose-800",
        outline: "text-slate-950 border border-slate-200",
        gold: "border-transparent bg-amber-100 text-amber-900 font-bold",
        cyan: "border-transparent bg-cyan-100 text-cyan-900 font-semibold",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
