import { cn } from '@/lib/utils';

export function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      className={cn(
        'border-input bg-background ring-offset-background placeholder:text-muted-foreground flex h-11 w-full rounded-lg border px-3 py-2 text-sm transition-colors',
        'focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'aria-invalid:border-destructive aria-invalid:ring-destructive/30',
        className,
      )}
      {...props}
    />
  );
}
