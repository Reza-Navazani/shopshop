import type { ProductResponse } from '@/types';

// Determine API base URL based on environment
let API_BASE_URL: string;

// In production (like Azure), use relative URLs or the actual deployed backend URL
if (import.meta.env.PROD) {
  // When deployed to Azure Static Web Apps with separate backend
  // Replace this URL with your actual Azure Web App URL once deployed
  API_BASE_URL = 'https://your-backend-name.azurewebsites.net';
  
  // If you configure proxying in your Static Web App, you could use:
  // API_BASE_URL = '/api';
} else {
  // In development, use localhost
  API_BASE_URL = 'http://localhost:5000';
}

export const ApiService = {
    async sendMessage(message: string): Promise<ProductResponse> {
        const response = await fetch(`${API_BASE_URL}/send-message`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message }),
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
            const response = await fetch(`${API_BASE_URL}/boxes`);
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