"use client";

import * as React from "react";
import { Switch as HeadlessSwitch } from "@headlessui/react";
import { cn } from "@/lib/utils";

const Switch = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    checked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
  }
>(({ className, checked, onCheckedChange, ...props }, ref) => (
  <HeadlessSwitch
    checked={checked}
    onChange={onCheckedChange}
    className={cn(
      "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary",
      checked ? "bg-primary" : "bg-gray-200",
      className
    )}
    ref={ref}
    {...props}
  >
    <span
      className={cn(
        "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
        checked ? "translate-x-6" : "translate-x-1"
      )}
    />
  </HeadlessSwitch>
));
Switch.displayName = "Switch";

export { Switch };