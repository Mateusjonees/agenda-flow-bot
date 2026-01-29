import * as React from "react";
import { cn } from "@/lib/utils";

interface SimpleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

export const SimpleButton = React.forwardRef<HTMLButtonElement, SimpleButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 touch-manipulation active:scale-95";
    
    const variants: Record<string, string> = {
      default: "bg-primary text-primary-foreground hover:bg-primary/90",
      outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
      ghost: "hover:bg-accent hover:text-accent-foreground",
    };
    
    const sizes: Record<string, string> = {
      default: "h-10 px-4 py-2 min-h-[44px] md:min-h-0",
      sm: "h-9 rounded-md px-3 min-h-[40px] md:min-h-0",
      lg: "h-11 rounded-md px-8 min-h-[48px] md:min-h-0",
      icon: "h-10 w-10 min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0",
    };
    
    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);
SimpleButton.displayName = "SimpleButton";
