"use client";

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, ...props }, ref) => {
    const id = React.useId();

    return (
      <div className="relative flex items-center">
        <div className="relative">
          <input
            type="checkbox"
            id={id}
            ref={ref}
            className="peer sr-only"
            {...props}
          />
          <div className={cn(
            "h-4 w-4 rounded border border-primary ring-offset-background transition-all",
            "peer-checked:bg-primary peer-checked:text-primary-foreground",
            "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
            "flex items-center justify-center",
            className
          )}>
            <Check className="h-3 w-3 text-white" />
          </div>
        </div>
        {label && (
          <label
            htmlFor={id}
            className="ml-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {label}
          </label>
        )}
      </div>
    );
  }
);
Checkbox.displayName = "Checkbox";

export { Checkbox };