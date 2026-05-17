"use client";

import React, { useState, useEffect } from 'react';
import { getUserProfile } from '../services/userApi';
import useAuth from '../hooks/useAuth';
import Loader from '../components/Loader';
import ProtectedRoute from '../components/ProtectedRoute';

const Profile = () => {
  const { isAuthenticated } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getUserProfile();
        setProfileData(data.data || data);
      } catch (err) {
        setError('Failed to load profile data.');
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  if (loading) return <Loader />;

  return (
    <ProtectedRoute>
      <div className="max-w-2xl mx-auto p-8 mt-10 bg-white shadow-sm border border-gray-100 rounded-lg">
        <h1 className="text-2xl font-semibold text-gray-800 mb-6 border-b pb-2">Profile Page</h1>
        
        {error ? (
          <div className="p-4 bg-red-50 text-red-600 rounded mb-4">{error}</div>
        ) : profileData ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl font-bold overflow-hidden">
                {profileData.avatar ? (
                  <img src={profileData.avatar} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  profileData.username?.charAt(0).toUpperCase() || 'U'
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">{profileData.username || 'User'}</h2>
                <p className="text-gray-500 capitalize">{profileData.role || 'Member'}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded border border-gray-100">
                <span className="block text-sm text-gray-500 mb-1">Email</span>
                <span className="font-medium text-gray-800">{profileData.email || 'N/A'}</span>
              </div>
              <div className="p-4 bg-gray-50 rounded border border-gray-100">
                <span className="block text-sm text-gray-500 mb-1">Status</span>
                <span className="font-medium text-green-600">Active</span>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-gray-600">Please log in to view your profile.</p>
        )}
      </div>
    </ProtectedRoute>
  );
};

export default Profile;
