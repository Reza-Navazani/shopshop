import React, { useState, useEffect } from 'react';
import { ApiService } from '@/lib/api-service';
import { useAuth } from '@/context/AuthContext';
import type { UserPreference } from '@/types';

// Use the same ViewType as defined in App.tsx
type ViewType = 'boxes' | 'scanner' | 'history' | 'profile' | 'login' | 'preferences';

interface UserPreferencesPageProps {
  onNavigate?: (view: ViewType) => void;
}

export default function UserPreferencesPage({ onNavigate }: UserPreferencesPageProps) {
  const { isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Form data
  const [preferences, setPreferences] = useState<UserPreference>({
    allergies: '',
    ingredients_to_avoid: '',
    brands_of_interest: '',
    price_preference: '',
    store_preference: ''
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated && onNavigate) {
      onNavigate('login');
    } else if (isAuthenticated) {
      loadUserPreferences();
    }
  }, [isAuthenticated, onNavigate]);

  // Load existing user preferences
  const loadUserPreferences = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await ApiService.getUserPreferences();
      if (response.success) {
        setPreferences(response.preferences);
      } else {
        setError(response.error || 'Failed to load preferences');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred loading preferences');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await ApiService.saveUserPreferences(preferences);
      if (response.success) {
        setSuccessMessage('Preferences saved successfully!');
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000); // Clear success message after 3 seconds
      } else {
        setError(response.error || 'Failed to save preferences');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred saving preferences');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setPreferences(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="w-full py-6 px-4 sm:px-6 lg:px-8 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-xl rounded-lg p-6 md:p-8">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">My Shopping Preferences</h1>
          
          {isLoading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
              <p className="mt-2 text-gray-600">Loading preferences...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              {error && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md shadow">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm">{error}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {successMessage && (
                <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-md shadow">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm">{successMessage}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div>
                  <label htmlFor="allergies" className="block text-sm font-medium text-gray-700 mb-1">
                    Allergies
                  </label>
                  <input
                    type="text"
                    id="allergies"
                    name="allergies"
                    value={preferences.allergies}
                    onChange={handleChange}
                    placeholder="e.g., peanuts, shellfish, dairy"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    List allergies separated by commas
                  </p>
                </div>

                <div>
                  <label htmlFor="ingredients_to_avoid" className="block text-sm font-medium text-gray-700 mb-1">
                    Ingredients to Avoid
                  </label>
                  <textarea
                    id="ingredients_to_avoid"
                    name="ingredients_to_avoid"
                    value={preferences.ingredients_to_avoid}
                    onChange={handleChange}
                    placeholder="e.g., high fructose corn syrup, artificial colors, palm oil"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    List ingredients you prefer to avoid in products
                  </p>
                </div>

                <div>
                  <label htmlFor="brands_of_interest" className="block text-sm font-medium text-gray-700 mb-1">
                    Preferred Brands
                  </label>
                  <input
                    type="text"
                    id="brands_of_interest"
                    name="brands_of_interest"
                    value={preferences.brands_of_interest}
                    onChange={handleChange}
                    placeholder="e.g., Organic Farms, Nature's Best"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Brands you prefer when shopping
                  </p>
                </div>

                <div>
                  <label htmlFor="price_preference" className="block text-sm font-medium text-gray-700 mb-1">
                    Price Preference
                  </label>
                  <select
                    id="price_preference"
                    name="price_preference"
                    value={preferences.price_preference}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">No preference</option>
                    <option value="budget">Budget-friendly</option>
                    <option value="mid-range">Mid-range</option>
                    <option value="premium">Premium</option>
                  </select>
                  <p className="text-sm text-gray-500 mt-1">
                    Your typical price range preference
                  </p>
                </div>

                <div>
                  <label htmlFor="store_preference" className="block text-sm font-medium text-gray-700 mb-1">
                    Preferred Store
                  </label>
                  <input
                    type="text"
                    id="store_preference"
                    name="store_preference"
                    value={preferences.store_preference}
                    onChange={handleChange}
                    placeholder="e.g., Walmart, Target, Whole Foods"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Stores you prefer to shop at
                  </p>
                </div>
              </div>

              <div className="flex justify-end pt-6">
                <button
                  type="button"
                  onClick={() => onNavigate ? onNavigate('boxes') : null}
                  className="mr-3 px-5 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Preferences'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}