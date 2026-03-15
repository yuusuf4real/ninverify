"use client";

import React, { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface DropdownOption {
  value: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
  description?: string;
}

interface EnhancedDropdownProps {
  options: DropdownOption[];
  value?: string;
  onSelect: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

const sizeConfig = {
  sm: {
    trigger: "h-8 px-3 text-sm",
    content: "text-sm",
    option: "px-3 py-1.5",
  },
  md: {
    trigger: "h-10 px-4 text-sm",
    content: "text-sm",
    option: "px-4 py-2",
  },
  lg: {
    trigger: "h-12 px-4 text-base",
    content: "text-base",
    option: "px-4 py-3",
  },
};

const variantConfig = {
  default: {
    trigger:
      "bg-white border-gray-300 hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20",
    content: "bg-white border-gray-200 shadow-xl",
  },
  outline: {
    trigger:
      "bg-transparent border-gray-300 hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20",
    content: "bg-white border-gray-200 shadow-xl",
  },
  ghost: {
    trigger:
      "bg-transparent border-transparent hover:bg-gray-50 focus:bg-white focus:border-gray-300 focus:ring-2 focus:ring-blue-500/20",
    content: "bg-white border-gray-200 shadow-xl",
  },
};

export const EnhancedDropdown = memo<EnhancedDropdownProps>(
  ({
    options,
    value,
    onSelect,
    placeholder = "Select option...",
    disabled = false,
    className = "",
    variant = "default",
    size = "md",
  }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [focusedIndex, setFocusedIndex] = React.useState(-1);
    const dropdownRef = React.useRef<HTMLDivElement>(null);
    const triggerRef = React.useRef<HTMLButtonElement>(null);

    const sizeStyles = sizeConfig[size];
    const variantStyles = variantConfig[variant];

    const selectedOption = options.find((option) => option.value === value);

    // Close dropdown when clicking outside
    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
          setFocusedIndex(-1);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (disabled) return;

      switch (e.key) {
        case "Enter":
        case " ":
          e.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
            setFocusedIndex(0);
          } else if (focusedIndex >= 0) {
            const option = options[focusedIndex];
            if (!option.disabled) {
              onSelect(option.value);
              setIsOpen(false);
              setFocusedIndex(-1);
            }
          }
          break;
        case "Escape":
          setIsOpen(false);
          setFocusedIndex(-1);
          triggerRef.current?.focus();
          break;
        case "ArrowDown":
          e.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
            setFocusedIndex(0);
          } else {
            setFocusedIndex((prev) => {
              const nextIndex = prev + 1;
              return nextIndex >= options.length ? 0 : nextIndex;
            });
          }
          break;
        case "ArrowUp":
          e.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
            setFocusedIndex(options.length - 1);
          } else {
            setFocusedIndex((prev) => {
              const nextIndex = prev - 1;
              return nextIndex < 0 ? options.length - 1 : nextIndex;
            });
          }
          break;
      }
    };

    const handleOptionSelect = (option: DropdownOption) => {
      if (option.disabled) return;
      onSelect(option.value);
      setIsOpen(false);
      setFocusedIndex(-1);
      triggerRef.current?.focus();
    };

    return (
      <div ref={dropdownRef} className={cn("relative", className)}>
        {/* Trigger Button */}
        <button
          ref={triggerRef}
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className={cn(
            "w-full flex items-center justify-between",
            "border rounded-lg transition-all duration-200",
            "focus:outline-none",
            sizeStyles.trigger,
            variantStyles.trigger,
            disabled && "opacity-50 cursor-not-allowed bg-gray-50",
            className,
          )}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-labelledby="dropdown-label"
        >
          <span className="flex items-center gap-2 truncate">
            {selectedOption?.icon && (
              <selectedOption.icon className="h-4 w-4 text-gray-500" />
            )}
            <span
              className={selectedOption ? "text-gray-900" : "text-gray-500"}
            >
              {selectedOption?.label || placeholder}
            </span>
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-gray-400 transition-transform duration-200",
              isOpen && "rotate-180",
            )}
          />
        </button>

        {/* Dropdown Content */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className={cn(
                "absolute z-50 w-full mt-1",
                "border rounded-lg overflow-hidden",
                "backdrop-blur-sm",
                sizeStyles.content,
                variantStyles.content,
              )}
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.98)", // High opacity white background
                backdropFilter: "blur(8px) saturate(180%)",
              }}
            >
              <div className="max-h-60 overflow-y-auto py-1">
                {options.map((option, index) => {
                  const isSelected = option.value === value;
                  const isFocused = index === focusedIndex;
                  const IconComponent = option.icon;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleOptionSelect(option)}
                      onMouseEnter={() => setFocusedIndex(index)}
                      disabled={option.disabled}
                      className={cn(
                        "w-full flex items-center gap-3 text-left transition-colors duration-150",
                        sizeStyles.option,
                        // Enhanced contrast and visibility
                        "text-gray-900 hover:bg-blue-50 hover:text-blue-900",
                        isFocused && "bg-blue-50 text-blue-900",
                        isSelected && "bg-blue-100 text-blue-900 font-medium",
                        option.disabled && "opacity-50 cursor-not-allowed",
                      )}
                      role="option"
                      aria-selected={isSelected}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {IconComponent && (
                          <IconComponent className="h-4 w-4 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="truncate">{option.label}</div>
                          {option.description && (
                            <div className="text-xs text-gray-500 truncate">
                              {option.description}
                            </div>
                          )}
                        </div>
                      </div>
                      {isSelected && (
                        <Check className="h-4 w-4 text-blue-600 flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  },
);

EnhancedDropdown.displayName = "EnhancedDropdown";
