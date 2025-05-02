// Determine API base URL based on environment
let API_BASE_URL;
// In production (like Azure), use the environment variable or fallback to the Azure URL
if (import.meta.env.PROD) {
    // Use environment variable from .env.production
    API_BASE_URL = import.meta.env.VITE_API_URL || 'https://dynamic-server-bmcsdef3b9dygjcy.canadacentral-01.azurewebsites.net';
}
else {
    // In development, use localhost
    API_BASE_URL = 'http://localhost:5000';
}

// Helper to get the token from localStorage
const getToken = () => localStorage.getItem('auth_token');

export const ApiService = {
    async sendMessage(message, sessionId) {
        const response = await fetch(`${API_BASE_URL}/api/send-message`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message,
                sessionId: sessionId || `session-${Date.now()}`
            }),
        });
        const data = await response.json();
        console.log('Send message response:', data);
        if (!response.ok || data.error) {
            throw new Error(data.error || 'Failed to send message');
        }
        return data;
    },
    async fetchBoxes() {
        try {
            console.log('Fetching boxes...');
            const response = await fetch(`${API_BASE_URL}/api/boxes`);
            console.log('Fetch response status:', response.status);
            if (!response.ok) {
                throw new Error('Failed to load products');
            }
            const data = await response.json();
            console.log('Fetched boxes data:', data);
            return data;
        }
        catch (err) {
            console.error('Error fetching boxes:', err);
            throw err;
        }
    },
    // User preferences methods
    async getUserPreferences() {
        const token = getToken();
        
        if (!token) {
            throw new Error('Not authenticated');
        }
        
        const response = await fetch(`${API_BASE_URL}/api/preferences`, {
            headers: {
                'Authorization': `Bearer ${token}`
            },
        });
        
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Failed to fetch preferences');
        }
        
        return response.json();
    },
    
    async saveUserPreferences(preferences) {
        const token = getToken();
        
        if (!token) {
            throw new Error('Not authenticated');
        }
        
        const response = await fetch(`${API_BASE_URL}/api/preferences`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(preferences),
        });
        
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Failed to save preferences');
        }
        
        return response.json();
    },
    
    // Helper methods for auth state
    isAuthenticated() {
        return !!getToken();
    },
    
    getCurrentUser() {
        const userJson = localStorage.getItem('user');
        return userJson ? JSON.parse(userJson) : null;
    }
};
