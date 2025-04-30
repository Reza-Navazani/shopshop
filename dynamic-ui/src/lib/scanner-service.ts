export interface ProductInfo {
    name: string;
    description: string;
    ingredients: string;
    barcode: string;
    error?: string;
}

export const scanBarcode = async (imageBlob: Blob): Promise<ProductInfo> => {
    try {
        const formData = new FormData();
        formData.append('image', imageBlob);

        // Determine correct scanner URL based on environment
        const isProduction = window.location.hostname !== 'localhost';
        const scannerUrl = isProduction 
            ? 'https://scanner-bmfhhwf0a5drhrb7.canadacentral-01.azurewebsites.net/scan' // Real production URL
            : 'http://localhost:8000/scan';

        console.log('Sending image to scanner server at:', scannerUrl);
        console.log('Image blob size:', imageBlob.size, 'bytes');
        console.log('Image blob type:', imageBlob.type);

        // Create a controller to allow aborting the request if it takes too long
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        try {
            const response = await fetch(scannerUrl, {
                method: 'POST',
                body: formData,
                mode: 'cors',
                credentials: 'omit',
                signal: controller.signal,
                headers: {
                    'Accept': 'application/json',
                    'Origin': window.location.origin
                }
            });
            
            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Scanner server error:', errorText);
                throw new Error(`Scanner server error: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            console.log('Scanner server response:', result);
            return result;
        } catch (fetchError) {
            clearTimeout(timeoutId);
            
            if (fetchError.name === 'AbortError') {
                console.error('Request timed out after 30 seconds');
                return {
                    name: 'Error',
                    description: '',
                    ingredients: '',
                    barcode: '',
                    error: 'Request timed out. The server took too long to respond.'
                };
            }

            // Handle CORS errors specifically
            if (fetchError instanceof TypeError && fetchError.message.includes('NetworkError')) {
                console.error('CORS error detected:', fetchError);
                return {
                    name: 'Error',
                    description: '',
                    ingredients: '',
                    barcode: '',
                    error: 'Cross-Origin Request Blocked. This might be a CORS configuration issue. Please contact support.'
                };
            }
            
            throw fetchError;
        }
    } catch (err) {
        console.error('Error in scanBarcode:', err);
        return {
            name: 'Error',
            description: '',
            ingredients: '',
            barcode: '',
            error: `Failed to scan barcode: ${err.message || 'Unknown error'}`
        };
    }
};