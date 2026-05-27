"use client";

import {
   createContext,
   useContext,
   useState,
   useEffect,
   useCallback,
} from "react";
import {
   getToken,
   setToken,
   removeToken,
   getStoredUser,
   setStoredUser,
   removeStoredUser,
} from "../utils/helpers";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

// Context

const AuthContext = createContext(null);

// Provider

export const AuthProvider = ({ children }) => {
   const [user, setUser] = useState(null);
   const [token, setTokenState] = useState(null);
   const [loading, setLoading] = useState(true);

   // Rehydrate from localStorage on first render
   useEffect(() => {
      const storedToken = getToken();
      const storedUser = getStoredUser();
      if (storedToken && storedUser) {
         setTokenState(storedToken);
         setUser(storedUser);
      }
      setLoading(false);
   }, []);

   // login
   const login = useCallback(async ({ email, password }) => {
      const res = await fetch(`${API_URL}/api/auth/login`, {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login failed");

      setToken(data.token);
      setStoredUser(data);
      setTokenState(data.token);
      setUser(data);
      return data;
   }, []);

   // register
   const register = useCallback(async ({ username, email, password, role }) => {
      const res = await fetch(`${API_URL}/api/auth/register`, {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({
            username,
            email,
            password,
            role: role || "audience",
         }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Registration failed");

      setToken(data.token);
      setStoredUser(data);
      setTokenState(data.token);
      setUser(data);
      return data;
   }, []);

   // logout
   const logout = useCallback(() => {
      removeToken();
      removeStoredUser();
      setTokenState(null);
      setUser(null);
   }, []);

   // updateProfile
   const updateProfile = useCallback(
      async (profileData) => {
         const token = getToken();
         const res = await fetch(`${API_URL}/api/auth/profile`, {
            method: "PATCH",
            headers: {
               "Content-Type": "application/json",
               Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(profileData),
         });
         const data = await res.json();
         if (!res.ok) throw new Error(data.message || "Update failed");

         const updated = { ...user, ...data.user };
         setStoredUser(updated);
         setUser(updated);
         return data;
      },
      [user],
   );

   // deleteAccount
   const deleteAccount = useCallback(async () => {
      const token = getToken();
      const res = await fetch(`${API_URL}/api/auth/account`, {
         method: "DELETE",
         headers: {
            Authorization: `Bearer ${token}`,
         },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete account");

      // Clear auth state
      removeToken();
      removeStoredUser();
      setTokenState(null);
      setUser(null);

      // Redirect to register page
      window.location.href = "/register";
   }, []);

   return (
      <AuthContext.Provider
         value={{
            user,
            token,
            loading,
            isAuthenticated: !!token,
            login,
            register,
            logout,
            updateProfile,
            deleteAccount,
         }}
      >
         {children}
      </AuthContext.Provider>
   );
};

// Hook

export const useAuth = () => {
   const ctx = useContext(AuthContext);
   if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
   return ctx;
};
