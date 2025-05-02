import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserProduct } from '@/types';
import { 
  registerUser, 
  loginUser, 
  logoutUser, 
  isAuthenticated as checkIsAuthenticated, 
  getCurrentUser, 
  getUserProfile, 
  updateUserProfile 
} from '@/lib/auth-service';
import {
  saveProductScan as apiSaveProductScan,
  getUserProductScans,
  getAllProductScans,
  deleteProductScan as apiDeleteProductScan
} from '@/lib/product-service';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (formData: {
    username: string;
    email: string;
    password: string;
    first_name?: string;
    last_name?: string;
  }) => Promise<void>;
  logout: () => void;
  updateProfile: (userData: Partial<User>) => Promise<void>;
  // User product scan related functions
  saveProductScan: (scanData: { barcode: string; product_name: string }) => Promise<UserProduct>;
  getUserScans: () => Promise<UserProduct[]>;
  getAllScans: () => Promise<UserProduct[]>;
  deleteProductScan: (scanId: number) => Promise<void>;
  userScans: UserProduct[];
  loadingScans: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userScans, setUserScans] = useState<UserProduct[]>([]);
  const [loadingScans, setLoadingScans] = useState(false);

  // Define logout function here, before using it in useEffect
  const logout = () => {
    logoutUser();
    setUser(null);
    setIsAuthenticated(false);
  };

  // Check for stored token expiration or age
  useEffect(() => {
    const checkTokenAge = () => {
      const tokenCreated = localStorage.getItem('token_created');
      if (tokenCreated) {
        const createdDate = new Date(tokenCreated);
        const now = new Date();
        const diffInHours = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60);
        
        // If token is older than 23 hours, force a token refresh
        if (diffInHours > 23) {
          console.log('Token is older than 23 hours, attempting to refresh');
          // Clear the token and force a refresh
          logout();
          setError('Your session has expired. Please log in again.');
        }
      }
    };

    // Check token age on component mount
    checkTokenAge();
    
    // Also set up interval to check periodically (every 5 minutes)
    const intervalId = setInterval(checkTokenAge, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, []);  // Remove logout from dependencies since it's defined in the same scope

  // Initialize auth state from local storage
  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);
      try {
        // Check if we have a token in localStorage
        if (checkIsAuthenticated()) {
          const currentUser = getCurrentUser();
          if (currentUser) {
            setUser(currentUser);
            setIsAuthenticated(true);
          } else {
            // If we have a token but no user data, fetch the profile
            try {
              const profile = await getUserProfile();
              setUser(profile);
              setIsAuthenticated(true);
            } catch (err) {
              // If profile fetch fails, token may be invalid
              console.error('Failed to fetch profile:', err);
              logoutUser();
              setIsAuthenticated(false);
            }
          }
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
        setError('Failed to initialize authentication');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (username: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await loginUser({ username, password });
      setUser(response.user);
      setIsAuthenticated(true);
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (formData: {
    username: string;
    email: string;
    password: string;
    first_name?: string;
    last_name?: string;
  }) => {
    setLoading(true);
    setError(null);
    try {
      console.log("Calling registerUser function with:", formData);
      const response = await registerUser(formData);
      setUser(response.user);
      setIsAuthenticated(true);
    } catch (err) {
      console.error('Registration error:', err);
      setError(err instanceof Error ? err.message : 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (userData: Partial<User>) => {
    setLoading(true);
    try {
      const updatedUser = await updateUserProfile(userData);
      setUser(updatedUser);
    } catch (err) {
      console.error('Profile update error:', err);
      setError(err instanceof Error ? err.message : 'Failed to update profile');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const saveProductScan = async (scanData: { barcode: string; product_name: string }) => {
    setLoadingScans(true);
    try {
      const newScan = await apiSaveProductScan(scanData);
      setUserScans((prevScans) => [...prevScans, newScan]);
      return newScan;
    } catch (err) {
      // Improved error logging
      const errorMessage = err instanceof Error ? err.message : 'Unknown error saving product scan';
      console.error('Save product scan error:', errorMessage);
      // Also log full error object for debugging
      console.error('Full error:', err);
      throw err;
    } finally {
      setLoadingScans(false);
    }
  };

  const getUserScans = async () => {
    setLoadingScans(true);
    try {
      const scans = await getUserProductScans();
      setUserScans(scans);
      return scans;
    } catch (err) {
      console.error('Get user scans error:', err);
      throw err;
    } finally {
      setLoadingScans(false);
    }
  };

  const getAllScans = async () => {
    setLoadingScans(true);
    try {
      const scans = await getAllProductScans();
      return scans;
    } catch (err) {
      console.error('Get all scans error:', err);
      throw err;
    } finally {
      setLoadingScans(false);
    }
  };

  const deleteProductScan = async (scanId: number) => {
    setLoadingScans(true);
    try {
      await apiDeleteProductScan(scanId);
      setUserScans((prevScans) => prevScans.filter((scan) => scan.id !== scanId));
    } catch (err) {
      console.error('Delete product scan error:', err);
      throw err;
    } finally {
      setLoadingScans(false);
    }
  };

  const value = {
    user,
    loading,
    error,
    isAuthenticated,  // Use the state variable directly instead of !!user
    login,
    register,
    logout,
    updateProfile,
    saveProductScan,
    getUserScans,
    getAllScans,
    deleteProductScan,
    userScans,
    loadingScans
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};