"use client";

import {
   createContext,
   useContext,
   useState,
   useEffect,
   useCallback,
   ReactNode,
} from "react";
import {
   getAdminToken,
   setAdminToken,
   removeAdminToken,
   getStoredAdminUser,
   setStoredAdminUser,
   removeStoredAdminUser,
} from "../utils/adminHelpers";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// Types

interface AdminUser {
   adminId: string;
   username: string;
   email: string;
   role: string;
   avatar?: string;
}

interface AdminAuthContextType {
   admin: AdminUser | null;
   adminToken: string | null;
   loading: boolean;
   isAdminAuthenticated: boolean;
   adminLogin: (
      email: string,
      password: string,
      accessCode: string,
   ) => Promise<void>;
   adminLogout: () => void;
}

// Context

const AdminAuthContext = createContext<AdminAuthContextType | null>(null);

// Provider

export const AdminAuthProvider = ({ children }: { children: ReactNode }) => {
   const [admin, setAdmin] = useState<AdminUser | null>(null);
   const [adminToken, setAdminTokenState] = useState<string | null>(null);
   const [loading, setLoading] = useState(true);

   // Rehydrate from localStorage on first render
   useEffect(() => {
      const storedToken = getAdminToken();
      const storedUser = getStoredAdminUser();
      if (storedToken && storedUser) {
         setAdminTokenState(storedToken);
         setAdmin(storedUser as unknown as AdminUser);
      }
      setLoading(false);
   }, []);

   // Login
   const adminLogin = useCallback(
      async (email: string, password: string, accessCode: string) => {
         const res = await fetch(`${API_URL}/api/admin/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password, accessCode }),
         });
         const data = await res.json();
         if (!res.ok) throw new Error(data.message || "Admin login failed");

         const adminUser: AdminUser = {
            adminId: data.adminId,
            username: data.username,
            email: data.email,
            role: "admin",
         };

         setAdminToken(data.token);
         setStoredAdminUser(adminUser as unknown as Record<string, unknown>);
         setAdminTokenState(data.token);
         setAdmin(adminUser);
      },
      [],
   );

   // Logout
   const adminLogout = useCallback(() => {
      // Fire logout audit log on server (non-blocking)
      const token = getAdminToken();
      if (token) {
         fetch(`${API_URL}/api/admin/auth/logout`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
         }).catch(() => {});
      }

      removeAdminToken();
      removeStoredAdminUser();
      setAdminTokenState(null);
      setAdmin(null);
   }, []);

   return (
      <AdminAuthContext.Provider
         value={{
            admin,
            adminToken,
            loading,
            isAdminAuthenticated: !!adminToken,
            adminLogin,
            adminLogout,
         }}
      >
         {children}
      </AdminAuthContext.Provider>
   );
};

// Hook

export const useAdminAuth = () => {
   const ctx = useContext(AdminAuthContext);
   if (!ctx)
      throw new Error("useAdminAuth must be used within <AdminAuthProvider>");
   return ctx;
};
