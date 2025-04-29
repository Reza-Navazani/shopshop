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

        console.log('Sending image to scanner server...');
        console.log('Image blob size:', imageBlob.size, 'bytes');
        console.log('Image blob type:', imageBlob.type);

        const response = await fetch('http://localhost:5000/scan', {
            method: 'POST',
            body: formData,
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