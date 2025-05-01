export interface ProductInfo {
    name: string;
    description: string;
    ingredients: string;
    barcode: string;
    image_url?: string;
    unhealthy_ingredients?: string;
    error?: string;
}

/**
 * Compresses an image blob to reduce its size before sending to the server
 * @param imageBlob Original image blob
 * @param maxSizeKB Maximum size in KB (default 1000KB/1MB)
 * @param quality Compression quality (0-1, default 0.8)
 * @returns Promise with compressed image blob
 */
async function compressImage(imageBlob: Blob, maxSizeKB: number = 1000, quality: number = 0.8): Promise<Blob> {
    // If the image is already smaller than the target size, return it as is
    if (imageBlob.size <= maxSizeKB * 1024) {
        console.log('Image already under size limit, skipping compression');
        return imageBlob;
    }

    // For non-image files or unsupported types, return original
    if (!imageBlob.type.startsWith('image/')) {
        console.log('Not an image or unsupported type, skipping compression');
        return imageBlob;
    }

    // Create an image from the blob
    const img = new Image();
    const objectUrl = URL.createObjectURL(imageBlob);
    
    try {
        // Wait for the image to load
        await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject(new Error('Failed to load image for compression'));
            img.src = objectUrl;
        });

        // Create a canvas to draw the image
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Calculate dimensions maintaining aspect ratio
        const MAX_WIDTH = 1600;
        const MAX_HEIGHT = 1600;
        
        if (width > height && width > MAX_WIDTH) {
            height = Math.round(height * (MAX_WIDTH / width));
            width = MAX_WIDTH;
        } else if (height > MAX_HEIGHT) {
            width = Math.round(width * (MAX_HEIGHT / height));
            height = MAX_HEIGHT;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw image on canvas
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Could not get canvas context');
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // Try to compress with decreasing quality until target size is reached
        let currentQuality = quality;
        let compressedBlob: Blob | null = null;
        
        while (currentQuality >= 0.3 && (!compressedBlob || compressedBlob.size > maxSizeKB * 1024)) {
            compressedBlob = await new Promise<Blob>(resolve => {
                canvas.toBlob(
                    blob => resolve(blob as Blob),
                    imageBlob.type,
                    currentQuality
                );
            });
            
            currentQuality -= 0.1;
        }
        
        // If we couldn't create a compressed blob, return the original
        if (!compressedBlob) {
            console.log('Could not compress image, returning original');
            return imageBlob;
        }
        
        console.log(`Image compressed from ${(imageBlob.size/1024).toFixed(2)}KB to ${(compressedBlob.size/1024).toFixed(2)}KB`);
        return compressedBlob;
    } catch (err) {
        console.error('Error compressing image:', err);
        return imageBlob; // Return original on error
    } finally {
        URL.revokeObjectURL(objectUrl);
    }
}

export const scanBarcode = async (imageBlob: Blob): Promise<ProductInfo> => {
    try {
        // Compress the image before sending
        console.log('Original image size:', (imageBlob.size/1024).toFixed(2), 'KB');
        const compressedImage = await compressImage(imageBlob, 1000, 0.8);
        console.log('Compressed image size:', (compressedImage.size/1024).toFixed(2), 'KB');
        
        const formData = new FormData();
        formData.append('image', compressedImage);

        // Determine correct scanner URL based on environment
        const isProduction = window.location.hostname !== 'localhost';
        const scannerUrl = isProduction 
            ? 'https://scanner-bmfhhwf0a5drhrb7.canadacentral-01.azurewebsites.net/scan' // Real production URL
            : 'http://localhost:8000/scan';

        console.log('Sending image to scanner server at:', scannerUrl);
        console.log('Image blob type:', compressedImage.type);

        // Calculate timeout based on image size (longer timeout for larger files)
        // Minimum 30 seconds, add 15 seconds per MB
        const imageSizeMB = compressedImage.size / (1024 * 1024);
        const timeoutMs = Math.max(30000, Math.round(30000 + (imageSizeMB * 15000)));
        console.log(`Setting request timeout to ${timeoutMs/1000} seconds based on image size`);

        // Create a controller to allow aborting the request if it takes too long
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

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
                return {
                    name: 'Error',
                    description: '',
                    ingredients: '',
                    barcode: '',
                    error: `Scanner server error: ${response.status} ${response.statusText}`
                };
            }

            const result = await response.json();
            console.log('Scanner server response:', result);
            
            // Validate the response format
            if (!result || typeof result !== 'object') {
                return {
                    name: 'Error',
                    description: '',
                    ingredients: '',
                    barcode: '',
                    error: 'Invalid response format from server'
                };
            }
            
            // Ensure all required fields are present, even if empty
            return {
                name: result.name || '',
                description: result.description || '',
                ingredients: result.ingredients || '',
                barcode: result.barcode || '',
                image_url: result.image_url || undefined,
                unhealthy_ingredients: result.unhealthy_ingredients || undefined,
                error: result.error || undefined
            };
        } catch (fetchError) {
            clearTimeout(timeoutId);
            
            // Safe type checking for AbortError
            if (fetchError && typeof fetchError === 'object' && 'name' in fetchError && fetchError.name === 'AbortError') {
                console.error('Request timed out after', timeoutMs/1000, 'seconds');
                return {
                    name: 'Error',
                    description: '',
                    ingredients: '',
                    barcode: '',
                    error: `Request timed out after ${timeoutMs/1000} seconds. Try using a clearer image or ensure you have a stable internet connection.`
                };
            }

            // Handle CORS errors specifically
            if (fetchError instanceof TypeError && 
                typeof fetchError.message === 'string' && 
                fetchError.message.includes('NetworkError')) {
                console.error('CORS error detected:', fetchError);
                return {
                    name: 'Error',
                    description: '',
                    ingredients: '',
                    barcode: '',
                    error: 'Cross-Origin Request Blocked. This might be a CORS configuration issue. Please contact support.'
                };
            }
            
            // Safe access to error message
            const errorMessage = fetchError && typeof fetchError === 'object' && 'message' in fetchError 
                ? fetchError.message 
                : 'Unknown error';
                
            return {
                name: 'Error',
                description: '',
                ingredients: '',
                barcode: '',
                error: `Network error: ${errorMessage}`
            };
        }
    } catch (err) {
        console.error('Error in scanBarcode:', err);
        
        // Safe access to error message with proper type checking
        const errorMessage = err && typeof err === 'object' && 'message' in err 
            ? err.message 
            : 'Unknown error';
            
        return {
            name: 'Error',
            description: '',
            ingredients: '',
            barcode: '',
            error: `Failed to scan barcode: ${errorMessage}`
        };
    }
};