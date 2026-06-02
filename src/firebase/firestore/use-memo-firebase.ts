'use client';

import { useMemo } from 'react';

/**
 * A simple wrapper around useMemo to stabilize Firebase references or queries.
 */
export function useMemoFirebase<T>(factory: () => T, deps: any[]): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(factory, deps);
}
