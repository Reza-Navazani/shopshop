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

        const response = await fetch(scannerUrl, {
            method: 'POST',
            body: formData,
            mode: 'cors',
            credentials: 'omit', // Changed from 'same-origin' to 'omit'
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Scanner server error:', errorText);
            throw new Error(`Scanner server error: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        console.log('Scanner server response:', result);
        return result;
    } catch (err) {
        console.error('Error in scanBarcode:', err);
        throw err;
    }
};