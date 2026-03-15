import { useCallback, useRef, useMemo, useEffect, useState } from "react";
import React from "react";

// Debounce hook for search inputs and API calls
export function useDebounce<T extends (...args: never[]) => void>(
  callback: T,
  delay: number,
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay],
  ) as T;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
}

// Throttle hook for scroll events and frequent updates
export function useThrottle<T extends (...args: never[]) => void>(
  callback: T,
  delay: number,
): T {
  const lastCallRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const throttledCallback = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLastCall = now - lastCallRef.current;

      if (timeSinceLastCall >= delay) {
        lastCallRef.current = now;
        callback(...args);
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
          lastCallRef.current = Date.now();
          callback(...args);
        }, delay - timeSinceLastCall);
      }
    },
    [callback, delay],
  ) as T;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return throttledCallback;
}

// Intersection Observer hook for lazy loading
export function useIntersectionObserver(
  options: IntersectionObserverInit = {},
): [React.RefCallback<Element>, boolean] {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [element, setElement] = useState<Element | null>(null);

  const observer = useMemo(() => {
    if (typeof window === "undefined") return null;

    return new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);
  }, [options]);

  useEffect(() => {
    if (!observer || !element) return;

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [observer, element]);

  const ref = useCallback((node: Element | null) => {
    setElement(node);
  }, []);

  return [ref, isIntersecting];
}

// Virtual scrolling hook for large lists
interface UseVirtualScrollOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

interface VirtualScrollResult {
  startIndex: number;
  endIndex: number;
  totalHeight: number;
  offsetY: number;
}

export function useVirtualScroll(
  itemCount: number,
  options: UseVirtualScrollOptions,
): [React.RefCallback<HTMLElement>, VirtualScrollResult] {
  const { itemHeight, containerHeight, overscan = 5 } = options;
  const [scrollTop, setScrollTop] = useState(0);
  const [element, setElement] = useState<HTMLElement | null>(null);

  const handleScroll = useThrottle<(e: Event) => void>((e: Event) => {
    const target = e.target as HTMLElement;
    setScrollTop(target.scrollTop);
  }, 16); // ~60fps

  useEffect(() => {
    if (!element) return;

    element.addEventListener("scroll", handleScroll);
    return () => element.removeEventListener("scroll", handleScroll);
  }, [element, handleScroll]);

  const result = useMemo((): VirtualScrollResult => {
    const startIndex = Math.max(
      0,
      Math.floor(scrollTop / itemHeight) - overscan,
    );
    const endIndex = Math.min(
      itemCount - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan,
    );

    return {
      startIndex,
      endIndex,
      totalHeight: itemCount * itemHeight,
      offsetY: startIndex * itemHeight,
    };
  }, [scrollTop, itemHeight, containerHeight, itemCount, overscan]);

  const ref = useCallback((node: HTMLElement | null) => {
    setElement(node);
  }, []);

  return [ref, result];
}

// Memoized component factory
export function createMemoComponent<P extends object>(
  Component: React.ComponentType<P>,
  areEqual?: (prevProps: P, nextProps: P) => boolean,
): React.MemoExoticComponent<React.ComponentType<P>> {
  return React.memo(Component, areEqual);
}

// Performance monitoring hook
export function usePerformanceMonitor(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _componentName: string,
) {
  const renderCountRef = useRef(0);
  const lastRenderTimeRef = useRef(Date.now());

  useEffect(() => {
    renderCountRef.current += 1;
    const now = Date.now();
    lastRenderTimeRef.current = now;

    // Performance tracking in development mode
    if (process.env.NODE_ENV === "development") {
      // Render performance tracking (logged to performance monitor)
    }
  });

  return {
    renderCount: renderCountRef.current,
  };
}

// Stable reference hook
export function useStableCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
): T {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  });

  return useCallback((...args: Parameters<T>) => {
    return callbackRef.current(...args);
  }, []) as T;
}

// Optimized state updater
export function useOptimizedState<T>(
  initialState: T,
): [T, (updater: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState(initialState);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const optimizedSetState = useCallback((updater: T | ((prev: T) => T)) => {
    setState((prevState) => {
      const newState =
        typeof updater === "function"
          ? (updater as (prev: T) => T)(prevState)
          : updater;

      // Only update if the state actually changed
      if (Object.is(newState, prevState)) {
        return prevState;
      }

      return newState;
    });
  }, []);

  return [state, optimizedSetState];
}
