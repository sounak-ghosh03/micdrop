"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import useAuth from '../hooks/useAuth';

const Sidebar = () => {
  const path = usePathname();
  const { isAuthenticated, logout } = useAuth();

  return (
    <div className="w-64 h-screen bg-gray-50 border-r border-gray-200 p-4 flex flex-col justify-between">
      <div>
        <div className="mb-8 px-2">
          <h2 className="text-2xl font-bold text-gray-800">MicDrop</h2>
        </div>
        <ul className="space-y-2">
          <li>
            <Link href="/" className={`block p-2 rounded font-medium transition-colors ${path === '/' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-700'}`}>
              Home
            </Link>
          </li>
          <li>
            <Link href="/profile" className={`block p-2 rounded font-medium transition-colors ${path === '/profile' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-700'}`}>
              Profile
            </Link>
          </li>
          <li>
            <Link href="/settings" className={`block p-2 rounded font-medium transition-colors ${path === '/settings' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-700'}`}>
              Settings
            </Link>
          </li>
        </ul>
      </div>
      
      {isAuthenticated && (
        <div className="mt-auto">
          <button 
            onClick={logout}
            className="w-full text-left p-2 rounded font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
