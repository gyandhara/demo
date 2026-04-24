import * as React from "react"
import { cn } from "@/src/lib/utils"

const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default' | 'outline' | 'ghost' | 'destructive', size?: 'default' | 'sm' | 'lg' | 'icon' }>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          variant === 'default' && "bg-blue-600 text-white hover:bg-blue-700",
          variant === 'outline' && "border border-input bg-background hover:bg-blue-50 text-blue-600",
          variant === 'ghost' && "hover:bg-blue-50 text-blue-600",
          variant === 'destructive' && "bg-red-500 text-white hover:bg-red-600",
          size === 'default' && "h-10 px-4 py-2",
          size === 'sm' && "h-9 rounded-md px-3",
          size === 'lg' && "h-11 rounded-md px-8",
          size === 'icon' && "h-10 w-10",
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
