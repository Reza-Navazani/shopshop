import type { ProductResponse } from '@/types';

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

export const ApiService = {
    async sendMessage(message: string, sessionId?: string): Promise<ProductResponse> {
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

    async fetchBoxes(): Promise<ProductResponse> {
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
        } catch (err) {
            console.error('Error fetching boxes:', err);
            throw err;
        }
    }
};