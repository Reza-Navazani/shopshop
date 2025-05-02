import type { User, AuthResponse } from '@/types';

// Determine API base URL based on environment
const API_BASE_URL = import.meta.env.PROD 
  ? (import.meta.env.VITE_API_URL || 'https://dynamic-server-bmcsdef3b9dygjcy.canadacentral-01.azurewebsites.net')
  : 'http://localhost:5000';

// Simple function to register a user
export async function registerUser(userData: { 
  username: string; 
  email: string; 
  password: string; 
  first_name?: string; 
  last_name?: string; 
}): Promise<AuthResponse> {
  console.log('Registering user:', userData);
  
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  
  const data = await response.json();
  console.log('Registration response:', data);
  
  if (!response.ok) {
    throw new Error(data.error || 'Registration failed');
  }
  
  // Save token to localStorage
  if (data.access_token) {
    localStorage.setItem('auth_token', data.access_token);
    localStorage.setItem('user', JSON.stringify(data.user));
  }
  
  return data;
}

// Simple function to login a user
export async function loginUser(credentials: { 
  username: string; 
  password: string; 
}): Promise<AuthResponse> {
  console.log('Logging in user:', credentials.username);
  
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Login failed');
  }
  
  // Log token first 10 chars for debugging (don't log full token for security)
  if (data.access_token) {
    console.log(`Received token (first 10 chars): ${data.access_token.substring(0, 10)}...`);
    console.log('Storing token in localStorage');
    
    // Save token to localStorage
    localStorage.setItem('auth_token', data.access_token);
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('token_created', new Date().toISOString());
  }
  
  return data;
}

// Simple function to logout a user
export function logoutUser(): void {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user');
}

// Simple function to check if user is authenticated
export function isAuthenticated(): boolean {
  return !!localStorage.getItem('auth_token');
}

// Simple function to check if the auth token is valid
export async function verifyToken(): Promise<boolean> {
  const token = localStorage.getItem('auth_token');
  
  if (!token) {
    console.log('No auth token found in localStorage');
    return false;
  }
  
  try {
    console.log('Verifying token...');
    
    // Log the first few characters of the token for debugging (don't log the full token for security)
    console.log(`Token being verified (first 10 chars): ${token.substring(0, 10)}...`);
    
    const response = await fetch(`${API_BASE_URL}/api/auth/verify`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      // Adding credentials: 'include' to ensure cookies are sent if needed
      credentials: 'include'
    });
    
    if (response.status === 401 || response.status === 422) {
      // Log full error response for debugging
      const errorData = await response.text();
      console.error(`Token verification failed with status ${response.status}:`, errorData);
      
      // Token has expired or is invalid, clear it
      console.log('Token expired or invalid. Clearing authentication data.');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      return false;
    }
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('Token verification failed:', data.error || 'Unknown error');
      return false;
    }
    
    console.log('Token verified successfully:', data.message);
    return true;
  } catch (err) {
    console.error('Error verifying token:', err);
    return false;
  }
}

// Simple function to get the current user
export function getCurrentUser(): User | null {
  const userJson = localStorage.getItem('user');
  return userJson ? JSON.parse(userJson) : null;
}

// Simple function to get the user's profile
export async function getUserProfile(): Promise<User> {
  const token = localStorage.getItem('auth_token');
  
  if (!token) {
    throw new Error('Not authenticated');
  }
  
  const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
    headers: {
      'Authorization': `Bearer ${token}`
    },
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch profile');
  }
  
  return data;
}

// Simple function to update the user's profile
export async function updateUserProfile(profileData: Partial<User>): Promise<User> {
  const token = localStorage.getItem('auth_token');
  
  if (!token) {
    throw new Error('Not authenticated');
  }
  
  const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(profileData),
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to update profile');
  }
  
  // Update stored user data
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  localStorage.setItem('user', JSON.stringify({ ...currentUser, ...data.user }));
  
  return data.user;
}