'use client';

import { useEffect, useState } from 'react';
import {
  DocumentReference,
  onSnapshot,
  DocumentSnapshot,
  DocumentData,
} from 'firebase/firestore';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

/**
 * Hook to listen to a single document in Firestore.
 * 
 * FIX: This hook uses the document path (ref.path) as the dependency for useEffect.
 * This prevents infinite re-render loops when DocumentReference objects are created
 * inline in parent components without memoization.
 */
export function useDoc<T = DocumentData>(ref: DocumentReference<T> | null) {
  const [data, setData] = useState<(T & { id: string }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Extract the path to use as a stable dependency in the effect array
  const refPath = ref?.path ?? null;

  useEffect(() => {
    if (!ref) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = onSnapshot(
      ref,
      (snapshot: DocumentSnapshot<T>) => {
        setData(snapshot.exists() 
          ? { ...snapshot.data()!, id: snapshot.id } as (T & { id: string })
          : null
        );
        setError(null);
        setLoading(false);
      },
      async (serverError) => {
        // Handle permission errors using the specialized architecture
        const permissionError = new FirestorePermissionError({
          path: ref.path,
          operation: 'get',
        });

        // Emit for the Next.js development overlay listener
        errorEmitter.emit('permission-error', permissionError);

        setError(permissionError);
        setData(null);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [refPath]);

  return { data, loading, error };
}
