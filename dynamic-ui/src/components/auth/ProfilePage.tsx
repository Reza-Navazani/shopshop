import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { User } from '@/types';

interface ProfilePageProps {}

export const ProfilePage: React.FC<ProfilePageProps> = () => {
  const { user, updateProfile, loading, error } = useAuth();
  const [formData, setFormData] = useState<Partial<User>>(user || {});
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // If user data changes, update the form data
  React.useEffect(() => {
    if (user) {
      setFormData(user);
    }
  }, [user]);

  if (!user) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Profile</h2>
        <p className="text-gray-600">Please log in to view your profile.</p>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setFormError(null);
    setSuccessMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    try {
      await updateProfile(formData);
      setSuccessMessage('Profile updated successfully');
      setIsEditing(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to update profile');
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Your Profile</h2>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="px-4 py-2 text-sm font-medium rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100"
        >
          {isEditing ? 'Cancel' : 'Edit Profile'}
        </button>
      </div>

      {(formError || error) && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {formError || error}
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
          {successMessage}
        </div>
      )}

      {isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
                First Name
              </label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                value={formData.first_name || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">
                Last Name
              </label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                value={formData.last_name || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label htmlFor="preferred_store" className="block text-sm font-medium text-gray-700 mb-1">
              Preferred Store
            </label>
            <input
              type="text"
              id="preferred_store"
              name="preferred_store"
              value={formData.preferred_store || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
              placeholder="e.g., Walmart, Target, Whole Foods"
            />
          </div>

          <div>
            <label htmlFor="dietary_preferences" className="block text-sm font-medium text-gray-700 mb-1">
              Dietary Preferences
            </label>
            <textarea
              id="dietary_preferences"
              name="dietary_preferences"
              value={formData.dietary_preferences || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
              rows={3}
              placeholder="e.g., Vegetarian, Gluten-free, No nuts"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Username</h3>
              <p className="mt-1 text-sm text-gray-900">{user.username}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Email</h3>
              <p className="mt-1 text-sm text-gray-900">{user.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">First Name</h3>
              <p className="mt-1 text-sm text-gray-900">{user.first_name || '—'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Last Name</h3>
              <p className="mt-1 text-sm text-gray-900">{user.last_name || '—'}</p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500">Preferred Store</h3>
            <p className="mt-1 text-sm text-gray-900">{user.preferred_store || '—'}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500">Dietary Preferences</h3>
            <p className="mt-1 text-sm text-gray-900">{user.dietary_preferences || '—'}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500">Account Created</h3>
            <p className="mt-1 text-sm text-gray-900">
              {user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};