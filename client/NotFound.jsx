import React from 'react';
import Link from 'next/link';

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-center px-4 py-20 rounded shadow-sm border border-gray-100">
      <h1 className="text-7xl font-bold text-blue-600 mb-4">404</h1>
      <p className="text-2xl font-semibold text-gray-800 mb-2">Page Not Found</p>
      <p className="text-gray-500 mb-8 max-w-md">The page you are looking for does not exist or has been moved.</p>
      <Link 
        href="/" 
        className="px-6 py-3 bg-blue-600 text-white font-medium rounded hover:bg-blue-700 transition-colors"
      >
        Return to Home
      </Link>
    </div>
  );
};

export default NotFound;
