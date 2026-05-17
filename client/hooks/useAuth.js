"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { logout as logoutApi } from '../services/authApi';

const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (token && storedUser) {
      try {
        setIsAuthenticated(true);
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse stored user", e);
      }
    }
    setLoading(false);
  }, []);

  const loginUser = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setIsAuthenticated(true);
    setUser(userData);
    router.push('/');
  };

  const logoutUser = async () => {
    try {
      await logoutApi();
    } catch (err) {
      console.error("Logout error", err);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setIsAuthenticated(false);
      setUser(null);
      router.push('/login');
    }
  };

  return { isAuthenticated, user, loading, login: loginUser, logout: logoutUser };
};

export default useAuth;
