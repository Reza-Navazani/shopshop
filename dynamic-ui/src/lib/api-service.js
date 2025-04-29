const API_BASE_URL = 'http://localhost:5000';
export const ApiService = {
    async sendMessage(message) {
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
    async fetchBoxes() {
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
        }
        catch (err) {
            console.error('Error fetching boxes:', err);
            throw err;
        }
    }
};
