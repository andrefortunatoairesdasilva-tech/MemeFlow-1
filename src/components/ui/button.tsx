import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-purple-600 text-white hover:bg-purple-700 shadow-md shadow-purple-500/20 active:scale-95',
        destructive:
          'bg-red-500 text-white hover:bg-red-600 shadow-md shadow-red-500/20 active:scale-95',
        outline:
          'border border-purple-300 bg-transparent hover:bg-purple-50 text-purple-700 dark:border-purple-700 dark:text-purple-300 dark:hover:bg-purple-900/30 active:scale-95',
        secondary:
          'bg-pink-500 text-white hover:bg-pink-600 shadow-md shadow-pink-500/20 active:scale-95',
        ghost:
          'hover:bg-purple-50 text-purple-700 dark:text-purple-300 dark:hover:bg-purple-900/30 active:scale-95',
        link: 'text-purple-600 underline-offset-4 hover:underline dark:text-purple-400',
        gradient:
          'bg-purple-600 text-white hover:bg-purple-700 shadow-lg shadow-purple-500/30 active:scale-95',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-12 rounded-xl px-8 text-base',
        icon: 'h-10 w-10',
        'icon-sm': 'h-8 w-8 rounded-md',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
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
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
