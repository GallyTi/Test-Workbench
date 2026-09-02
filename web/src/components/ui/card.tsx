import * as React from 'react';
import { cn } from '@/lib/utils';

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { variant?: 'glass' | 'solid' | 'interactive' | 'bento' }
>(({ className, variant = 'glass', ...props }, ref) => {
  const variantStyles = {
    glass:
      'backdrop-blur-xl bg-black/40 border border-white/[0.08] shadow-[0_8px_32px_0_rgba(0,0,0,0.5)]',
    solid:
      'bg-zinc-950 border border-zinc-800 shadow-xl',
    interactive:
      'backdrop-blur-xl bg-black/40 border border-white/[0.08] hover:border-white/20 hover:bg-white/[0.04] transition-all duration-300 shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] hover:shadow-[0_12px_40px_0_rgba(59,130,246,0.15)] hover:-translate-y-0.5',
    bento:
      'backdrop-blur-2xl bg-gradient-to-b from-white/[0.05] to-white/[0.01] border border-white/[0.08] hover:border-white/[0.18] transition-all duration-300 shadow-2xl relative overflow-hidden group',
  };

  return (
    <div
      ref={ref}
      className={cn(
        'rounded-2xl text-card-foreground',
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
});
Card.displayName = 'Card';

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-6', className)}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'text-lg font-semibold leading-none tracking-tight text-white',
      className
    )}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-xs text-zinc-400 leading-relaxed', className)}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
));
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center p-6 pt-0', className)}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
