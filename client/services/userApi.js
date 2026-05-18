import { API_BASE_URL } from '../utils/constants';

export const getUserProfile = async (userId) => {
  const token = localStorage.getItem('token');
  const url = userId ? `${API_BASE_URL}/users/${userId}` : `${API_BASE_URL}/auth/me`;
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!response.ok) throw new Error('Failed to fetch user profile');
  return response.json();
};

export const updateUserProfile = async (data) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/auth/profile`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to update profile');
  return response.json();
};
