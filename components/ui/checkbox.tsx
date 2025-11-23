import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, id, ...props }, ref) => {
    return (
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id={id}
          ref={ref}
          className={cn(
            "h-[15px] w-[15px] rounded-sm border border-border bg-gray-200",
            "accent-primary cursor-pointer",
            className
          )}
          {...props}
        />
        {label && (
          <label
            htmlFor={id}
            className="text-xs font-medium text-gray-700 cursor-pointer select-none"
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