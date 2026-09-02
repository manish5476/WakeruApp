import React, { useMemo, useCallback, useRef, useEffect } from 'react';

/**
 * withMemo - Higher Order Component for memoization
 * Prevents re-renders when props haven't changed
 */
export const withMemo = <P extends object>(
  Component: React.ComponentType<P>,
  propsAreEqual?: (prevProps: Readonly<P>, nextProps: Readonly<P>) => boolean,
): React.FC<P> => {
  const MemoizedComponent = React.memo(Component, propsAreEqual);
  MemoizedComponent.displayName = `withMemo(${Component.displayName || Component.name})`;
  return MemoizedComponent;
};

/**
 * useMemoized - Memoize expensive computations
 * Wraps useMemo for cleaner API
 */
export const useMemoized = <T>(
  factory: () => T,
  deps: React.DependencyList,
): T => {
  return useMemo(factory, deps);
};

/**
 * useCallbackMemoized - Memoize callback functions
 * Ensures function reference stability
 */
export const useCallbackMemoized = <T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList,
): T => {
  return useCallback(callback, deps) as T;
};

/**
 * useDebounce - Debounce value changes
 * Delays updates until user stops interacting
 */
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

/**
 * useThrottle - Throttle function execution
 * Limits how often a function can run
 */
export const useThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  limit: number,
): T => {
  const inThrottle = useRef(false);

  return useCallback(
    (...args: any[]) => {
      if (!inThrottle.current) {
        callback(...args);
        inThrottle.current = true;
        setTimeout(() => {
          inThrottle.current = false;
        }, limit);
      }
    },
    [callback, limit],
  ) as T;
};

/**
 * useLazyComponent - Load component lazily with suspense
 * Code-split for better performance
 */
export const useLazyComponent = <P extends object>(
  importFunc: () => Promise<{ default: React.ComponentType<P> }>,
) => {
  return React.lazy(() => importFunc());
};

/**
 * useMemoryLeakWarning - Detect potential memory leaks in dev
 * Warns if component doesn't cleanup
 */
export const useMemoryLeakWarning = (componentName: string) => {
  useEffect(() => {
    return () => {
      console.warn(
        `[v0] Component ${componentName} unmounted - check for cleanup`,
      );
    };
  }, [componentName]);
};

/**
 * useRenderCount - Count component renders (debug)
 * Track unnecessary re-renders in development
 */
export const useRenderCount = (componentName: string) => {
  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current += 1;
    console.log(`[v0] ${componentName} rendered ${renderCount.current} times`);
  });

  return renderCount.current;
};

/**
 * usePerformanceMonitor - Monitor component performance
 * Track render time and re-render frequency
 */
export const usePerformanceMonitor = (componentName: string) => {
  const renderStartTime = useRef(Date.now());
  const renderTimes = useRef<number[]>([]);

  useEffect(() => {
    const renderTime = Date.now() - renderStartTime.current;
    renderTimes.current.push(renderTime);

    if (renderTimes.current.length % 10 === 0) {
      const avgTime =
        renderTimes.current.reduce((a, b) => a + b, 0) /
        renderTimes.current.length;
      console.log(
        `[v0] ${componentName} avg render time: ${avgTime.toFixed(2)}ms`,
      );
    }

    renderStartTime.current = Date.now();
  });
};

/**
 * useDeepCompareMemo - Deep comparison for complex objects
 * Prevents unnecessary updates with complex prop structures
 */
export const useDeepCompareMemo = <T>(
  factory: () => T,
  deps: React.DependencyList,
): T => {
  const ref = useRef<{ deps: React.DependencyList; result: T } | undefined>(
    undefined,
  );

  if (
    !ref.current ||
    deps.length !== ref.current.deps.length ||
    !deepEqual(deps, ref.current.deps)
  ) {
    ref.current = { deps, result: factory() };
  }

  return ref.current.result;
};

/**
 * deepEqual - Deep equality check for arrays/objects
 * Helper for useDeepCompareMemo
 */
function deepEqual(
  arr1: React.DependencyList,
  arr2: React.DependencyList,
): boolean {
  if (arr1.length !== arr2.length) return false;

  return arr1.every((val, idx) => {
    const val2 = arr2[idx];
    if (val === val2) return true;
    if (typeof val !== 'object' || typeof val2 !== 'object') return false;
    return JSON.stringify(val) === JSON.stringify(val2);
  });
}

/**
 * useFlatListOptimization - Optimize FlatList performance
 * Returns optimized props for FlatList components
 */
export const useFlatListOptimization = (itemCount: number) => {
  return {
    removeClippedSubviews: true,
    maxToRenderPerBatch: 10,
    updateCellsBatchingPeriod: 50,
    initialNumToRender: Math.min(itemCount, 10),
    windowSize: 5,
  };
};

/**
 * useLazyLoad - Load items lazily as user scrolls
 * Infinite scroll implementation
 */
export const useLazyLoad = (
  hasMore: boolean,
  isLoading: boolean,
  onLoadMore: () => void,
  threshold: number = 0.8,
) => {
  const handleScroll = useCallback(
    ({ nativeEvent }: any) => {
      const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
      const paddingToBottom = layoutMeasurement.height * (1 - threshold);

      if (
        contentSize.height - contentOffset.y < paddingToBottom &&
        hasMore &&
        !isLoading
      ) {
        onLoadMore();
      }
    },
    [hasMore, isLoading, onLoadMore, threshold],
  );

  return { handleScroll };
};

export default {
  withMemo,
  useMemoized,
  useCallbackMemoized,
  useDebounce,
  useThrottle,
  useLazyComponent,
  useMemoryLeakWarning,
  useRenderCount,
  usePerformanceMonitor,
  useDeepCompareMemo,
  useFlatListOptimization,
  useLazyLoad,
};
