'use client';

import { useId } from 'react';
import { cn } from '@/lib/utils';

/**
 * Card-styled radio group.
 *
 * The legacy budget and companion pickers were `<div onClick>` elements with no
 * `role`, no `tabIndex`, no key handler and no focus style — unusable with a
 * keyboard or a screen reader, and invisible to assistive technology as a
 * choice at all.
 *
 * These are native radio inputs, visually hidden but still focusable, so arrow
 * key navigation, roving focus, the accessible name and the checked state all
 * come from the platform rather than being reimplemented.
 */

export type Choice<T extends string> = {
  value: T;
  label: string;
  hint: string;
  icon: string;
};

type Props<T extends string> = {
  name: string;
  legend: string;
  choices: readonly Choice<T>[];
  value: T | null;
  onChange: (value: T) => void;
  error?: string;
  columns?: 3 | 4;
};

export function ChoiceCards<T extends string>({
  name,
  legend,
  choices,
  value,
  onChange,
  error,
  columns = 3,
}: Props<T>) {
  const errorId = useId();

  return (
    <fieldset aria-describedby={error ? errorId : undefined}>
      <legend className="mb-3 text-lg font-medium">{legend}</legend>

      <div
        className={cn(
          'grid gap-3',
          columns === 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-2 sm:grid-cols-4',
        )}
      >
        {choices.map((choice) => {
          const checked = value === choice.value;

          return (
            <label
              key={choice.value}
              className={cn(
                'bg-card relative flex cursor-pointer flex-col gap-1 rounded-xl border p-4 transition-all',
                'hover:border-primary/50 hover:shadow-sm',
                // Focus lives on the hidden input; mirror it onto the card so
                // keyboard users can see where they are.
                'has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-offset-2',
                checked && 'border-primary ring-primary/30 shadow-sm ring-2',
              )}
            >
              <input
                type="radio"
                name={name}
                value={choice.value}
                checked={checked}
                onChange={() => onChange(choice.value)}
                className="sr-only"
              />

              <span className="text-2xl" aria-hidden="true">
                {choice.icon}
              </span>
              <span className="font-semibold">{choice.label}</span>
              <span className="text-muted-foreground text-sm">{choice.hint}</span>
            </label>
          );
        })}
      </div>

      {error ? (
        <p id={errorId} role="alert" className="text-destructive mt-2 text-sm">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
