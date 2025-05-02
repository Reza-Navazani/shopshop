import type { ProductResponse, User, AuthResponse, UserProduct, PreferenceResponse, UserPreference } from '@/types';

// Determine API base URL based on environment
let API_BASE_URL: string;

// In production (like Azure), use the environment variable or fallback to the Azure URL
if (import.meta.env.PROD) {
  // Use environment variable from .env.production
  API_BASE_URL = import.meta.env.VITE_API_URL || 'https://dynamic-server-bmcsdef3b9dygjcy.canadacentral-01.azurewebsites.net';
} else {
  // In development, use localhost
  API_BASE_URL = 'http://localhost:5000';
}

// Helper function to check if the server is reachable
const checkServerConnection = async (): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
    
    const response = await fetch(`${API_BASE_URL}/api/health`, {
      signal: controller.signal
    }).catch(() => null);
    
    clearTimeout(timeoutId);
    return !!response && response.ok;
  } catch (error) {
    console.warn('Server connection check failed:', error);
    return false;
  }
};

// Helper to get the token from localStorage
const getToken = () => localStorage.getItem('auth_token');

// Helper to include authorization headers when token exists
const getAuthHeaders = () => {
    const token = getToken();
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};

// Define API Service as a simple object with functions
export const ApiService = {
    // Auth methods
    register: function(userData: { username: string; email: string; password: string; first_name?: string; last_name?: string }): Promise<AuthResponse> {
        console.log('Registering user:', userData);
        return fetch(`${API_BASE_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData),
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(data => {
                    throw new Error(data.error || 'Registration failed');
                });
            }
            return response.json();
        })
        .then(data => {
            console.log('Registration response:', data);
            
            // Save token to localStorage
            if (data.access_token) {
                localStorage.setItem('auth_token', data.access_token);
                localStorage.setItem('user', JSON.stringify(data.user));
            }
            
            return data;
        });
    },
    
    login: function(credentials: { username: string; password: string }): Promise<AuthResponse> {
        console.log('Logging in user:', credentials.username);
        return fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials),
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(data => {
                    throw new Error(data.error || 'Login failed');
                });
            }
            return response.json();
        })
        .then(data => {
            console.log('Login response:', data);
            
            // Save token to localStorage
            if (data.access_token) {
                localStorage.setItem('auth_token', data.access_token);
                localStorage.setItem('user', JSON.stringify(data.user));
            }
            
            return data;
        });
    },
    
    logout: function(): void {
        // Remove token from localStorage
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
    },
    
    getProfile: function(): Promise<User> {
        const token = getToken();
        
        if (!token) {
            throw new Error('Not authenticated');
        }
        
        return fetch(`${API_BASE_URL}/api/auth/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`
            },
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(data => {
                    throw new Error(data.error || 'Failed to fetch profile');
                });
            }
            return response.json();
        })
        .then(data => {
            return data;
        });
    },
    
    updateProfile: function(profileData: Partial<User>): Promise<User> {
        const token = getToken();
        
        if (!token) {
            throw new Error('Not authenticated');
        }
        
        return fetch(`${API_BASE_URL}/api/auth/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(profileData),
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(data => {
                    throw new Error(data.error || 'Failed to update profile');
                });
            }
            return response.json();
        })
        .then(data => {
            // Update stored user data
            const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
            localStorage.setItem('user', JSON.stringify({ ...currentUser, ...data.user }));
            
            return data.user;
        });
    },
    
    // Product methods (now with authentication)
    sendMessage: async function(message: string, sessionId?: string): Promise<ProductResponse> {
        console.log('Sending message to API:', message);
        try {
            // First check if server is available
            const isServerAvailable = await checkServerConnection();
            
            if (!isServerAvailable) {
                console.warn('Server is not reachable for sending message');
                return {
                    success: false,
                    error: 'Server is currently unavailable. Please try again later.',
                    products: []
                };
            }
            
            // Server is available, proceed with normal API call
            const response = await fetch(`${API_BASE_URL}/api/send-message`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ 
                    message,
                    sessionId: sessionId || `session-${Date.now()}`
                }),
                // Add timeout for the request
                signal: AbortSignal.timeout(15000) // 15 second timeout for this longer operation
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                let errorData;
                
                try {
                    errorData = JSON.parse(errorText);
                } catch (e) {
                    // Not JSON, use status text
                    throw new Error(`Server error: ${response.status} ${response.statusText}`);
                }
                
                throw new Error(errorData.error || 'Failed to send message');
            }
            
            const data = await response.json();
            console.log('Send message response:', data);
            
            // Ensure the response always has a products array even if missing
            return {
                ...data,
                products: data.products || []
            };
        } catch (err) {
            console.error('Error in sendMessage:', err);
            // Return a valid ProductResponse even on failure to avoid UI errors
            return {
                success: false,
                error: err instanceof Error ? err.message : 'Unknown error occurred',
                products: []
            };
        }
    },

    fetchBoxes: async function(): Promise<ProductResponse> {
        console.log('Fetching boxes...');
        try {
            // First check if server is available
            const isServerAvailable = await checkServerConnection();
            
            if (!isServerAvailable) {
                console.warn('Server is not reachable, using local fallback data');
                // Try to load fallback data from public folder
                try {
                    const fallbackResponse = await fetch('/boxes.json');
                    if (fallbackResponse.ok) {
                        const fallbackData = await fallbackResponse.json();
                        return {
                            success: true,
                            products: fallbackData.products || [],
                            message: 'Using cached data (server unreachable)'
                        };
                    }
                } catch (fallbackErr) {
                    console.error('Failed to load fallback data:', fallbackErr);
                }
                
                return {
                    success: false,
                    error: 'Server is currently unavailable. Please try again later.',
                    products: []
                };
            }
            
            // Server is available, proceed with normal API call
            const response = await fetch(`${API_BASE_URL}/api/boxes`, {
                headers: getAuthHeaders(),
                // Add timeout for the request
                signal: AbortSignal.timeout(10000) // 10 second timeout
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                let errorData;
                
                try {
                    errorData = JSON.parse(errorText);
                } catch (e) {
                    // Not JSON, use status text
                    throw new Error(`Server error: ${response.status} ${response.statusText}`);
                }
                
                throw new Error(errorData.error || 'Failed to load products');
            }
            
            const data = await response.json();
            console.log('Fetched boxes data:', data);
            
            // Ensure the response always has a products array even if missing
            return {
                ...data,
                products: data.products || []
            };
        } catch (err) {
            console.error('Error in fetchBoxes:', err);
            // Return a valid ProductResponse even on failure
            return {
                success: false,
                error: err instanceof Error ? err.message : 'Failed to load products',
                products: []
            };
        }
    },
    
    // User products methods
    getUserProducts: async function(): Promise<UserProduct[]> {
        const token = getToken();
        
        if (!token) {
            throw new Error('Not authenticated');
        }
        
        return fetch(`${API_BASE_URL}/api/products`, {
            headers: {
                'Authorization': `Bearer ${token}`
            },
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(data => {
                    throw new Error(data.error || 'Failed to fetch products');
                });
            }
            return response.json();
        })
        .then(data => {
            return data.products || [];
        });
    },
    
    // User preferences methods
    getUserPreferences: async function(): Promise<PreferenceResponse> {
        const token = getToken();
        
        if (!token) {
            throw new Error('Not authenticated');
        }
        
        return fetch(`${API_BASE_URL}/api/preferences`, {
            headers: {
                'Authorization': `Bearer ${token}`
            },
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(data => {
                    throw new Error(data.error || 'Failed to fetch preferences');
                });
            }
            return response.json();
        });
    },
    
    saveUserPreferences: async function(preferences: UserPreference): Promise<PreferenceResponse> {
        const token = getToken();
        
        if (!token) {
            throw new Error('Not authenticated');
        }
        
        return fetch(`${API_BASE_URL}/api/preferences`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(preferences),
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(data => {
                    throw new Error(data.error || 'Failed to save preferences');
                });
            }
            return response.json();
        });
    },
    
    // Helper methods for auth state
    isAuthenticated: function(): boolean {
        return !!getToken();
    },
    
    getCurrentUser: function(): User | null {
        const userJson = localStorage.getItem('user');
        return userJson ? JSON.parse(userJson) : null;
    }
};