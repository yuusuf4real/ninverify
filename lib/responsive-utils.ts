/**
 * Responsive utilities for better mobile and desktop experiences
 */

import { useEffect, useState } from "react";

// Breakpoint definitions (matching Tailwind CSS)
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

export type Breakpoint = keyof typeof breakpoints;

/**
 * Hook to detect current screen size
 */
export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>("sm");

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;

      if (width >= breakpoints["2xl"]) {
        setBreakpoint("2xl");
      } else if (width >= breakpoints.xl) {
        setBreakpoint("xl");
      } else if (width >= breakpoints.lg) {
        setBreakpoint("lg");
      } else if (width >= breakpoints.md) {
        setBreakpoint("md");
      } else {
        setBreakpoint("sm");
      }
    };

    updateBreakpoint();
    window.addEventListener("resize", updateBreakpoint);

    return () => window.removeEventListener("resize", updateBreakpoint);
  }, []);

  return breakpoint;
}

/**
 * Hook to detect if screen is mobile size
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const updateIsMobile = () => {
      setIsMobile(window.innerWidth < breakpoints.md);
    };

    updateIsMobile();
    window.addEventListener("resize", updateIsMobile);

    return () => window.removeEventListener("resize", updateIsMobile);
  }, []);

  return isMobile;
}

/**
 * Hook to detect if screen is tablet size
 */
export function useIsTablet() {
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const updateIsTablet = () => {
      const width = window.innerWidth;
      setIsTablet(width >= breakpoints.md && width < breakpoints.lg);
    };

    updateIsTablet();
    window.addEventListener("resize", updateIsTablet);

    return () => window.removeEventListener("resize", updateIsTablet);
  }, []);

  return isTablet;
}

/**
 * Hook to detect device orientation
 */
export function useOrientation() {
  const [orientation, setOrientation] = useState<"portrait" | "landscape">(
    "portrait",
  );

  useEffect(() => {
    const updateOrientation = () => {
      setOrientation(
        window.innerHeight > window.innerWidth ? "portrait" : "landscape",
      );
    };

    updateOrientation();
    window.addEventListener("resize", updateOrientation);

    return () => window.removeEventListener("resize", updateOrientation);
  }, []);

  return orientation;
}

/**
 * Hook to detect if device supports touch
 */
export function useIsTouchDevice() {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    setIsTouch("ontouchstart" in window || navigator.maxTouchPoints > 0);
  }, []);

  return isTouch;
}

/**
 * Responsive value selector
 */
export function getResponsiveValue<T>(
  values: Partial<Record<Breakpoint | "default", T>>,
  currentBreakpoint: Breakpoint,
): T | undefined {
  // Try current breakpoint first
  if (values[currentBreakpoint]) {
    return values[currentBreakpoint];
  }

  // Fallback to smaller breakpoints
  const orderedBreakpoints: (Breakpoint | "default")[] = [
    "2xl",
    "xl",
    "lg",
    "md",
    "sm",
    "default",
  ];
  const currentIndex = orderedBreakpoints.indexOf(currentBreakpoint);

  for (let i = currentIndex; i < orderedBreakpoints.length; i++) {
    const bp = orderedBreakpoints[i];
    if (values[bp]) {
      return values[bp];
    }
  }

  return undefined;
}

/**
 * Generate responsive grid columns class
 */
export function getResponsiveGridCols(
  cols: Partial<Record<Breakpoint | "default", number>>,
) {
  const classes: string[] = [];

  if (cols.default) classes.push(`grid-cols-${cols.default}`);
  if (cols.sm) classes.push(`sm:grid-cols-${cols.sm}`);
  if (cols.md) classes.push(`md:grid-cols-${cols.md}`);
  if (cols.lg) classes.push(`lg:grid-cols-${cols.lg}`);
  if (cols.xl) classes.push(`xl:grid-cols-${cols.xl}`);
  if (cols["2xl"]) classes.push(`2xl:grid-cols-${cols["2xl"]}`);

  return classes.join(" ");
}

/**
 * Generate responsive spacing classes
 */
export function getResponsiveSpacing(
  property:
    | "p"
    | "px"
    | "py"
    | "pt"
    | "pb"
    | "pl"
    | "pr"
    | "m"
    | "mx"
    | "my"
    | "mt"
    | "mb"
    | "ml"
    | "mr",
  values: Partial<Record<Breakpoint | "default", number>>,
) {
  const classes: string[] = [];

  if (values.default) classes.push(`${property}-${values.default}`);
  if (values.sm) classes.push(`sm:${property}-${values.sm}`);
  if (values.md) classes.push(`md:${property}-${values.md}`);
  if (values.lg) classes.push(`lg:${property}-${values.lg}`);
  if (values.xl) classes.push(`xl:${property}-${values.xl}`);
  if (values["2xl"]) classes.push(`2xl:${property}-${values["2xl"]}`);

  return classes.join(" ");
}

/**
 * Responsive text size classes
 */
export function getResponsiveTextSize(
  sizes: Partial<Record<Breakpoint | "default", string>>,
) {
  const classes: string[] = [];

  if (sizes.default) classes.push(`text-${sizes.default}`);
  if (sizes.sm) classes.push(`sm:text-${sizes.sm}`);
  if (sizes.md) classes.push(`md:text-${sizes.md}`);
  if (sizes.lg) classes.push(`lg:text-${sizes.lg}`);
  if (sizes.xl) classes.push(`xl:text-${sizes.xl}`);
  if (sizes["2xl"]) classes.push(`2xl:text-${sizes["2xl"]}`);

  return classes.join(" ");
}

/**
 * Safe area utilities for mobile devices with notches
 */
export const safeAreaClasses = {
  top: "pt-safe-top",
  bottom: "pb-safe-bottom",
  left: "pl-safe-left",
  right: "pr-safe-right",
  all: "p-safe",
} as const;

/**
 * Common responsive patterns
 */
export const responsivePatterns = {
  // Container max widths
  container: {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "3xl": "max-w-3xl",
    "4xl": "max-w-4xl",
    "5xl": "max-w-5xl",
    "6xl": "max-w-6xl",
    "7xl": "max-w-7xl",
    full: "max-w-full",
  },

  // Common grid patterns
  grid: {
    cards: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
    list: "grid-cols-1 md:grid-cols-2",
    dashboard: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    stats: "grid-cols-2 md:grid-cols-4",
  },

  // Common spacing patterns
  spacing: {
    section: "py-8 md:py-12 lg:py-16",
    container: "px-4 sm:px-6 lg:px-8",
    gap: "gap-4 md:gap-6 lg:gap-8",
  },

  // Typography patterns
  typography: {
    heading: "text-2xl md:text-3xl lg:text-4xl",
    subheading: "text-lg md:text-xl lg:text-2xl",
    body: "text-sm md:text-base",
    caption: "text-xs md:text-sm",
  },
} as const;
