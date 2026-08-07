'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * shadcn/ui Button, retuned to the True Formula palette: sage primary, cream
 * surfaces, pill radii. Variants map to the intent of the action so that
 * destructive confirmations never read as ordinary buttons.
 */
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-xs font-bold transition-all disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E5A44]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#FDFBF7] [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-[#2E5A44] text-white shadow-md hover:bg-[#234735]',
        ink: 'bg-[#111827] text-white shadow-luxe hover:bg-[#1f2937]',
        destructive: 'bg-[#9A3A3A] text-white shadow-md hover:bg-[#7E2E2E]',
        outline:
          'border border-[#C6DFD1] bg-white text-[#111827] hover:bg-[#EAF2ED] hover:border-[#2E5A44]',
        secondary: 'bg-[#EAF2ED] text-[#2E5A44] hover:bg-[#DDF0E5]',
        ghost: 'text-[#4B5563] hover:bg-[#F5F0E4]/70 hover:text-[#111827]',
        link: 'text-[#2E5A44] underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-5 py-2',
        sm: 'h-8 px-3.5 text-[11px]',
        lg: 'h-12 px-7 text-sm',
        icon: 'h-9 w-9 rounded-full',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
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
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
