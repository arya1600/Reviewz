import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

const AdminContext = createContext(null);

export function AdminProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin]           = useState(false);
  const [adminRole, setAdminRole]       = useState(null); // 'super_admin' | 'admin' | null
  const [adminLoading, setAdminLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setIsAdmin(false);
      setAdminRole(null);
      setAdminLoading(false);
      return;
    }

    let cancelled = false;

    async function checkAdminRole() {
      try {
        // Supabase returns errors in { error } — they don't throw.
        // We also wrap in try/catch for genuine network failures.
        const { data, error } = await supabase
          .from('admin_users')
          .select('id, role')
          .eq('id', user.id)
          .maybeSingle();

        if (!cancelled) {
          const isAdminUser = !error && !!data;
          setIsAdmin(isAdminUser);
          setAdminRole(isAdminUser ? (data?.role ?? null) : null);
        }
      } catch {
        if (!cancelled) {
          setIsAdmin(false);
          setAdminRole(null);
        }
      } finally {
        if (!cancelled) setAdminLoading(false);
      }
    }

    checkAdminRole();
    return () => { cancelled = true; };
  }, [user, authLoading]);

  return (
    <AdminContext.Provider value={{ isAdmin, adminRole, adminLoading }}>
      {children}
    </AdminContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAdmin() {
  return useContext(AdminContext);
}
