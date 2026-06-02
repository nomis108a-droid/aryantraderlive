'use client';

import { useEffect, useState } from 'react';

export interface MockUser {
  uid: string;
  displayName: string;
  handle: string;
  isAdmin?: boolean;
}

export function useUser() {
  const [user, setUser] = useState<MockUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      if (typeof window === 'undefined') return;
      
      const storedUser = localStorage.getItem('mock_user');
      const isAdminGlobal = localStorage.getItem('isAdmin') === 'true';
      
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          setUser({ 
            ...parsed, 
            isAdmin: parsed.isAdmin || isAdminGlobal 
          });
        } catch (e) {
          localStorage.removeItem('mock_user');
          setUser(null);
        }
      } else if (isAdminGlobal) {
        setUser({ 
          uid: 'admin-global', 
          displayName: 'System Admin', 
          handle: 'admin', 
          isAdmin: true 
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    checkAuth();

    window.addEventListener('storage', checkAuth);
    window.addEventListener('mock-auth-change', checkAuth);

    return () => {
      window.removeEventListener('storage', checkAuth);
      window.removeEventListener('mock-auth-change', checkAuth);
    };
  }, []);

  return { user, loading };
}
