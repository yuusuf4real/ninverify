import React, { memo, useMemo } from "react";
import { useVirtualScroll } from "@/lib/hooks/use-performance";

interface OptimizedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemHeight: number;
  containerHeight: number;
  keyExtractor: (item: T, index: number) => string;
  className?: string;
  overscan?: number;
}

function OptimizedListComponent<T>({
  items,
  renderItem,
  itemHeight,
  containerHeight,
  keyExtractor,
  className = "",
  overscan = 5,
}: OptimizedListProps<T>) {
  const [containerRef, { startIndex, endIndex, totalHeight, offsetY }] =
    useVirtualScroll(items.length, {
      itemHeight,
      containerHeight,
      overscan,
    });

  const visibleItems = useMemo(() => {
    return items.slice(startIndex, endIndex + 1).map((item, index) => ({
      item,
      originalIndex: startIndex + index,
    }));
  }, [items, startIndex, endIndex]);

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
    >
      <div style={{ height: totalHeight, position: "relative" }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map(({ item, originalIndex }) => (
            <div
              key={keyExtractor(item, originalIndex)}
              style={{ height: itemHeight }}
            >
              {renderItem(item, originalIndex)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export const OptimizedList = memo(OptimizedListComponent) as <T>(
  props: OptimizedListProps<T>,
) => React.JSX.Element;
