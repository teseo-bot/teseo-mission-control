"use client";

import * as React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { toHexString, toOklchString } from "@/lib/color-utils";
import { cn } from "@/lib/utils";

interface ColorPickerProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}

export const ColorPicker = React.forwardRef<HTMLInputElement, ColorPickerProps>(
  ({ value = "oklch(0 0 0)", onChange, className, ...props }, ref) => {
    const [internalValue, setInternalValue] = React.useState(value);

    // Sync with external value if it changes
    React.useEffect(() => {
      setInternalValue(value);
    }, [value]);

    const hexValue = React.useMemo(() => toHexString(internalValue), [internalValue]);

    const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newHex = e.target.value;
      const newOklch = toOklchString(newHex);
      setInternalValue(newOklch);
      onChange?.(newOklch);
    };

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newText = e.target.value;
      setInternalValue(newText);
    };

    const handleTextBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      // Attempt to parse what the user typed when they blur
      const newOklch = toOklchString(internalValue);
      setInternalValue(newOklch);
      onChange?.(newOklch);
      props.onBlur?.(e);
    };

    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Popover>
          <PopoverTrigger
            className="w-10 h-10 rounded-md border border-input shadow-sm flex-shrink-0 cursor-pointer overflow-hidden focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            style={{ backgroundColor: hexValue }}
            aria-label="Pick color"
          />
          <PopoverContent className="w-auto p-3" align="start">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <label htmlFor="native-color" className="text-sm font-medium">Selector de OS</label>
                <input
                  id="native-color"
                  type="color"
                  value={hexValue}
                  onChange={handleHexChange}
                  className="w-8 h-8 p-0 border-0 rounded cursor-pointer flex-shrink-0"
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>
        <Input
          ref={ref}
          value={internalValue}
          onChange={handleTextChange}
          onBlur={handleTextBlur}
          className="flex-1 font-mono text-sm"
          placeholder="oklch(L C H)"
          {...props}
        />
      </div>
    );
  }
);
ColorPicker.displayName = "ColorPicker";
