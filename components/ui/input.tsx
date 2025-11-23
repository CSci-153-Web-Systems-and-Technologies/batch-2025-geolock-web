import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, id, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={id}
            className="block text-xs font-medium text-gray-800 mb-1"
          >
            {label}
          </label>
        )}
        <input
          type={type}
          id={id}
          ref={ref}
          className={cn(
            "w-full h-[49.5px] px-4 rounded-[10px] border border-border",
            "text-sm text-gray-900 placeholder:text-gray-400",
            "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
            "transition-colors",
            error && "border-red-500 focus:ring-red-500/20 focus:border-red-500",
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1 text-xs text-red-500">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };